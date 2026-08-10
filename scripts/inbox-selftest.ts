/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Proves the inbox responder behaves, without touching a real mailbox.
 *
 *   npm run inbox:test
 *
 * A fake Gmail and a fake model provider are stood up in memory and `fetch` is
 * pointed at them, so the pipeline under test is the real one — the same
 * runInboxScan() the scheduler calls — with only the far side replaced.
 *
 * What it is actually checking is the set of promises the responder makes: it
 * answers people and not machines, it never sends before telling you, it holds
 * for the window it said it would, and it refuses to send a reply that breaks
 * the rules it drafts under. Those are the claims worth a test; a mistake in
 * any of them is an email to a stranger you cannot take back.
 */

/* The module reads configuration at call time, so this has to land before the
   import of lab/inbox — hence the assignments ahead of any import. */
process.env.GOOGLE_CLIENT_ID = "test-client";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";
process.env.GOOGLE_REFRESH_TOKEN = "test-refresh";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.OPENROUTER_MODEL = "test/model";
process.env.INBOX_OWNER_EMAIL = "owner@coreos.test";
process.env.INBOX_ACTION_SECRET = "test-action-secret";
process.env.INBOX_HOLD_MINUTES = "20";
process.env.INBOX_AUTOSEND = "true";

import {
  DISCLOSURE,
  LABELS,
  handleInboxAction,
  looksAutomated,
  replyViolatesRules,
  runInboxScan,
  signAction,
  verifyAction,
} from "../lab/inbox";
import {
  base64url,
  buildRaw,
  messageText,
  parseAddress,
  resetGmailCaches,
  withoutQuotedReply,
  type GmailMessage,
} from "../lab/gmail";

/* ============================================================ the harness = */

const MAILBOX = "coreosgmail.com@gmail.com";

interface FakeMessage {
  id: string;
  threadId: string;
  labels: Set<string>;
  internalDate: number;
  headers: Record<string, string>;
  body: string;
  raw?: string;
}

interface FakeDraft {
  id: string;
  messageId: string;
  threadId: string;
  internalDate: number;
  raw: string;
}

class FakeGmail {
  messages = new Map<string, FakeMessage>();
  drafts = new Map<string, FakeDraft>();
  labels = new Map<string, string>([["INBOX", "INBOX"], ["UNREAD", "UNREAD"], ["SENT", "SENT"]]);
  /** Everything that actually left the mailbox, in order. */
  outbound: Array<{ to: string; subject: string; body: string; kind: "notification" | "reply" }> = [];
  private seq = 0;

  private id(prefix: string) {
    this.seq++;
    return `${prefix}${this.seq}`;
  }

  /** Drops a message into the inbox as if it had just arrived. */
  receive(input: { from: string; subject: string; body: string; extraHeaders?: Record<string, string>; ageMinutes?: number }) {
    const id = this.id("msg");
    const message: FakeMessage = {
      id,
      threadId: `thread-${id}`,
      labels: new Set(["INBOX", "UNREAD"]),
      internalDate: Date.now() - (input.ageMinutes || 0) * 60_000,
      headers: {
        From: input.from,
        To: MAILBOX,
        Subject: input.subject,
        "Message-Id": `<${id}@sender.test>`,
        Date: new Date().toUTCString(),
        ...(input.extraHeaders || {}),
      },
      body: input.body,
    };
    this.messages.set(id, message);
    return message;
  }

  labelNames(message: FakeMessage): string[] {
    const byId = new Map([...this.labels].map(([name, id]) => [id, name]));
    return [...message.labels].map((id) => byId.get(id) || id);
  }

  hasLabel(message: FakeMessage, name: string): boolean {
    return this.labelNames(message).includes(name);
  }

  private toApi(message: FakeMessage) {
    return {
      id: message.id,
      threadId: message.threadId,
      labelIds: [...message.labels],
      internalDate: String(message.internalDate),
      snippet: message.body.slice(0, 100),
      payload: {
        mimeType: "text/plain",
        headers: Object.entries(message.headers).map(([name, value]) => ({ name, value })),
        body: { data: base64url(message.body) },
      },
    };
  }

  /**
   * A cut-down Gmail query evaluator — only the operators the responder
   * actually builds. If the responder learns a new one, this throws rather
   * than silently matching everything and making the test meaningless.
   */
  private matches(message: FakeMessage, query: string): boolean {
    if (!query.trim()) return true;
    const names = this.labelNames(message);

    for (const rawTerm of query.trim().split(/\s+/)) {
      const negated = rawTerm.startsWith("-");
      const term = negated ? rawTerm.slice(1) : rawTerm;
      const [operator, ...rest] = term.split(":");
      const value = rest.join(":").replace(/^"|"$/g, "");
      let hit: boolean;

      switch (operator) {
        case "in":
          hit = value === "inbox" ? names.includes("INBOX") : value === "chats" ? false : names.includes(value.toUpperCase());
          break;
        case "label":
          hit = names.some((n) => n.toLowerCase() === value.toLowerCase());
          break;
        case "from":
          hit = parseAddress(message.headers.From || "").email === value.toLowerCase();
          break;
        case "newer_than": {
          const days = Number(value.replace(/d$/, ""));
          hit = Date.now() - message.internalDate < days * 86_400_000;
          break;
        }
        default:
          throw new Error(`FakeGmail does not understand the query operator "${operator}" in: ${query}`);
      }

      if (negated ? hit : !hit) return false;
    }
    return true;
  }

  /** Reads back what a raw outgoing message says, for assertions. */
  private decodeRaw(raw: string): { to: string; subject: string; body: string } {
    const text = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const [head, ...bodyParts] = text.split("\r\n\r\n");
    const to = (head.match(/^To: (.*)$/m) || [, ""])[1].trim();
    const rawSubject = (head.match(/^Subject: (.*)$/m) || [, ""])[1].trim();
    const subject = rawSubject.startsWith("=?UTF-8?B?")
      ? Buffer.from(rawSubject.slice(10, -2), "base64").toString("utf8")
      : rawSubject;

    // Bodies are base64, in one part or as the first part of a multipart.
    const joined = bodyParts.join("\r\n\r\n");
    const firstChunk = joined.split(/--coreos-[a-z0-9]+/)[0] || joined;
    const payload = firstChunk.includes("Content-Transfer-Encoding")
      ? firstChunk.split("\r\n\r\n").slice(1).join("\r\n\r\n")
      : firstChunk;
    let body = "";
    try {
      body = Buffer.from(payload.trim(), "base64").toString("utf8");
    } catch {
      body = payload;
    }
    return { to, subject, body };
  }

  async handle(url: string, init: RequestInit): Promise<Response> {
    const parsed = new URL(url);
    const path = parsed.pathname.replace("/gmail/v1/users/me", "");
    const method = (init.method || "GET").toUpperCase();
    const payload = init.body ? JSON.parse(String(init.body)) : {};
    const json = (data: any, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

    if (path === "/profile") return json({ emailAddress: MAILBOX });

    if (path === "/labels" && method === "GET") {
      return json({ labels: [...this.labels].map(([name, id]) => ({ id, name })) });
    }
    if (path === "/labels" && method === "POST") {
      // Gmail rejects a duplicate name rather than making a second label, and
      // a responder that races itself into this is a real bug — so the fake
      // reproduces it rather than quietly accepting the duplicate.
      if (this.labels.has(payload.name)) return json({ error: { message: "Label name exists or conflicts" } }, 409);
      const id = this.id("label");
      this.labels.set(payload.name, id);
      return json({ id, name: payload.name });
    }

    if (path === "/messages" && method === "GET") {
      const query = parsed.searchParams.get("q") || "";
      const max = Number(parsed.searchParams.get("maxResults") || 25);
      const found = [...this.messages.values()]
        .filter((m) => this.matches(m, query))
        .sort((a, b) => b.internalDate - a.internalDate)
        .slice(0, max);
      return json({ messages: found.map((m) => ({ id: m.id, threadId: m.threadId })) });
    }

    if (path === "/messages/send") {
      const decoded = this.decodeRaw(payload.raw);
      this.outbound.push({ ...decoded, kind: "notification" });
      return json({ id: this.id("sent"), threadId: this.id("thread") });
    }

    const messageMatch = path.match(/^\/messages\/([^/]+)$/);
    if (messageMatch) {
      const message = this.messages.get(messageMatch[1]);
      if (!message) return json({ error: { message: "not found" } }, 404);
      return json(this.toApi(message));
    }

    const threadMatch = path.match(/^\/threads\/([^/]+)$/);
    if (threadMatch) {
      const inThread = [...this.messages.values()].filter((m) => m.threadId === threadMatch[1]);
      return json({ id: threadMatch[1], messages: inThread.map((m) => this.toApi(m)) });
    }

    const modifyMatch = path.match(/^\/threads\/([^/]+)\/modify$/);
    if (modifyMatch) {
      for (const message of this.messages.values()) {
        if (message.threadId !== modifyMatch[1]) continue;
        for (const id of payload.addLabelIds || []) message.labels.add(id);
        for (const id of payload.removeLabelIds || []) message.labels.delete(id);
      }
      return json({ id: modifyMatch[1] });
    }

    if (path === "/drafts" && method === "POST") {
      const id = this.id("draft");
      const draft: FakeDraft = {
        id,
        messageId: this.id("draftmsg"),
        threadId: payload.message.threadId,
        internalDate: Date.now(),
        raw: payload.message.raw,
      };
      this.drafts.set(id, draft);
      return json({ id, message: { id: draft.messageId, threadId: draft.threadId } });
    }

    if (path === "/drafts" && method === "GET") {
      return json({
        drafts: [...this.drafts.values()].map((d) => ({ id: d.id, message: { id: d.messageId, threadId: d.threadId } })),
      });
    }

    if (path === "/drafts/send") {
      const draft = this.drafts.get(payload.id);
      if (!draft) return json({ error: { message: "draft not found" } }, 404);
      this.drafts.delete(draft.id);
      this.outbound.push({ ...this.decodeRaw(draft.raw), kind: "reply" });
      return json({ id: this.id("sent"), threadId: draft.threadId });
    }

    const draftMatch = path.match(/^\/drafts\/([^/]+)$/);
    if (draftMatch) {
      const draft = this.drafts.get(draftMatch[1]);
      if (method === "DELETE") {
        if (!draft) return json({ error: { message: "draft not found" } }, 404);
        this.drafts.delete(draft.id);
        return new Response(null, { status: 204 });
      }
      if (!draft) return json({ error: { message: "draft not found" } }, 404);
      const decoded = this.decodeRaw(draft.raw);
      return json({
        id: draft.id,
        message: {
          id: draft.messageId,
          threadId: draft.threadId,
          internalDate: String(draft.internalDate),
          payload: {
            mimeType: "text/plain",
            headers: [
              { name: "To", value: decoded.to },
              { name: "Subject", value: decoded.subject },
            ],
            body: { data: base64url(decoded.body) },
          },
        },
      });
    }

    throw new Error(`FakeGmail has no route for ${method} ${path}`);
  }

  /** Winds a thread's draft back in time, to test the hold window. */
  ageDraft(threadId: string, minutes: number) {
    for (const draft of this.drafts.values()) {
      if (draft.threadId === threadId) draft.internalDate = Date.now() - minutes * 60_000;
    }
  }
}

/** Stands in for OpenRouter. Answers by inspecting which prompt it was given. */
class FakeModel {
  classifications: Record<string, { kind: string; fromHuman: boolean; confidence: number }> = {};
  /** Overrides the drafted body, to test the outgoing-content checks. */
  draftOverride: string | null = null;
  calls = 0;

  async handle(init: RequestInit): Promise<Response> {
    this.calls++;
    const payload = JSON.parse(String(init.body));
    const system: string = payload.messages[0].content;
    const user: string = payload.messages[payload.messages.length - 1].content;

    let content: string;
    if (system.includes("You triage email")) {
      const subject = (user.match(/^Subject: (.*)$/m) || [, ""])[1];
      const verdict = this.classifications[subject] || { kind: "unclear", fromHuman: true, confidence: 0.2 };
      content = JSON.stringify({ ...verdict, reason: "test fixture" });
    } else {
      content =
        this.draftOverride ??
        "Hi there,\n\nThanks for writing in. CoreOs builds affordable business AI for smaller companies, and what you describe is the sort of thing our agents handle well.\n\nWhat's a good time to call you this week?";
    }

    return new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: "stop" }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}

let gmail = new FakeGmail();
let model = new FakeModel();

globalThis.fetch = (async (input: any, init: RequestInit = {}) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.includes("oauth2.googleapis.com/token")) {
    return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  if (url.includes("gmail.googleapis.com")) return gmail.handle(url, init);
  if (url.includes("openrouter.ai")) return model.handle(init);
  throw new Error(`Unexpected fetch to ${url}`);
}) as typeof fetch;

/* ============================================================== assertions = */

let passed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failures.push(label);
    console.log(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`);
  }
}

function scenario(name: string) {
  console.log(`\n${name}`);
  gmail = new FakeGmail();
  model = new FakeModel();
  // The label ids the new mailbox hands out are different ones; the module
  // under test would otherwise keep using the last scenario's.
  resetGmailCaches();
}

/* =================================================================== tests = */

async function main() {
  /* ------------------------------------------------------ unit-level bits */

  scenario("Telling people from machines");
  {
    const cases: Array<[string, Record<string, string>, boolean, string]> = [
      ["jane@okaforlogistics.com", {}, false, "an ordinary sender"],
      ["noreply@shopify.com", {}, true, "a no-reply address"],
      ["no-reply@bank.example", {}, true, "a hyphenated no-reply address"],
      ["mailer-daemon@googlemail.com", {}, true, "a mailer daemon"],
      ["news@substack.com", { "List-Unsubscribe": "<https://x.test/u>" }, true, "a List-Unsubscribe header"],
      ["hello@company.com", { "Auto-Submitted": "auto-replied" }, true, "an Auto-Submitted header"],
      ["hello@company.com", { "Auto-Submitted": "no" }, false, "Auto-Submitted: no, which means a human"],
      ["billing@stripe.com", { Precedence: "bulk" }, true, "bulk precedence"],
      ["someone@bounces.mailgun.org", {}, true, "a bulk-mail domain"],
      ["real@person.com", { To: "a@x.com, b@x.com, c@x.com, d@x.com, e@x.com, f@x.com" }, true, "a six-way blast"],
    ];

    for (const [from, extra, expected, description] of cases) {
      const message: GmailMessage = {
        id: "m",
        threadId: "t",
        payload: {
          headers: Object.entries({ From: from, Subject: "Hello", To: MAILBOX, ...extra }).map(([name, value]) => ({ name, value })),
        },
      };
      const verdict = looksAutomated(message, parseAddress(from));
      check(`${expected ? "filters out" : "lets through"} ${description}`, verdict.isRobot === expected, `reason: ${verdict.reason || "none"}`);
    }
  }

  scenario("Refusing to send a reply that breaks the rules");
  {
    const bad: Array<[string, string]> = [
      ["It's $500 a month.", "a dollar figure"],
      ["Around 400 USD to set up.", "an amount with a currency word"],
      ["We can do 20% off for you.", "a discount"],
      ["I guarantee it will work for you.", "a guarantee"],
      ["We'll have it running by Friday.", "a deadline"],
      ["We'll have this done within 3 days.", "a relative deadline"],
    ];
    for (const [body, description] of bad) {
      check(`catches ${description}`, replyViolatesRules(body) !== null, `body: ${body}`);
    }
    check(
      "lets an ordinary reply through",
      replyViolatesRules("Thanks for writing in. What's a good time to call this week?") === null,
    );
  }

  scenario("Reading messages");
  {
    check(
      "strips the quoted history off a reply",
      withoutQuotedReply("My actual question.\n\nOn Mon, Jan 1 2026 at 10:00, CoreOs wrote:\n> old text") ===
        "My actual question.",
    );

    const html: GmailMessage = {
      id: "m",
      threadId: "t",
      payload: {
        mimeType: "multipart/alternative",
        parts: [{ mimeType: "text/html", body: { data: base64url("<p>Hello <b>there</b></p><p>Second line</p>") } }],
      },
    };
    check("falls back to stripping HTML when there is no plain text", messageText(html).includes("Hello there"));

    const raw = buildRaw({ to: "a@b.test", subject: "Café ☕", text: "body text" });
    const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    check("encodes a non-ASCII subject as RFC 2047", decoded.includes("Subject: =?UTF-8?B?"));
    check("keeps CRLF line endings", decoded.includes("\r\n"));
  }

  scenario("Signing the one-click links");
  {
    const token = signAction("draft123", "send");
    check("a valid token verifies", verifyAction("draft123", "send", token));
    check("the token is not reusable for the other action", !verifyAction("draft123", "cancel", token));
    check("the token is not reusable for another draft", !verifyAction("draft999", "send", token));
    check("a wrong-length token is rejected without throwing", !verifyAction("draft123", "send", "short"));
  }

  /* ------------------------------------------------- the pipeline, end to end */

  scenario("A real enquiry from the contact form");
  {
    const message = gmail.receive({
      from: "Jane Okafor <jane@okaforlogistics.com>",
      subject: "CoreOs enquiry — Set up an AI agent for my business",
      body: "Name: Jane Okafor\nBusiness: Okafor Logistics\nPhone: +964 750 123 4567\n\nWe get around 60 of the same delivery questions a day.\n\n— Sent from coreos.ai",
    });
    model.classifications["CoreOs enquiry — Set up an AI agent for my business"] = {
      kind: "setup_request",
      fromHuman: true,
      confidence: 0.95,
    };

    const report = await runInboxScan();

    check("drafts exactly one reply", report.drafted === 1, JSON.stringify(report.outcomes));
    check("sends nothing to the enquirer yet", !gmail.outbound.some((m) => m.kind === "reply"));
    check("notifies the owner first", gmail.outbound.filter((m) => m.kind === "notification").length === 1);

    const notification = gmail.outbound.find((m) => m.kind === "notification");
    check("the notification goes to INBOX_OWNER_EMAIL", notification?.to === "owner@coreos.test");
    check("the notification shows the draft in full", Boolean(notification?.body.includes("What's a good time to call")));
    check("the notification carries a stop link", Boolean(notification?.body.includes("/api/inbox/action?id=")));
    check("the notification says when it will send", Boolean(notification?.body.includes("in about 20 minutes")));

    check("the thread is marked pending", gmail.hasLabel(message, LABELS.pending));
    check("a Gmail draft exists on the thread", [...gmail.drafts.values()].some((d) => d.threadId === message.threadId));

    /* Before the hold is up, a second run must not send. */
    const early = await runInboxScan();
    check("holds the reply while the window is open", early.sent === 0 && !gmail.outbound.some((m) => m.kind === "reply"));

    /* Wind the draft back past the window and run again. */
    gmail.ageDraft(message.threadId, 25);
    const late = await runInboxScan();

    check("sends once the hold expires", late.sent === 1, JSON.stringify(late.outcomes));
    const reply = gmail.outbound.find((m) => m.kind === "reply");
    check("the reply goes to the person who wrote in", reply?.to === "jane@okaforlogistics.com");
    check("the reply is a Re: on their subject", Boolean(reply?.subject.startsWith("Re: CoreOs enquiry")));
    check("the reply discloses that it was drafted automatically", Boolean(reply?.body.includes(DISCLOSURE.split("\n")[2])));
    check("the thread moves to replied", gmail.hasLabel(message, LABELS.replied));
    check("the thread is no longer pending", !gmail.hasLabel(message, LABELS.pending));

    const after = await runInboxScan();
    check("never answers the same thread twice", after.drafted === 0 && after.sent === 0);
  }

  scenario("A newsletter from a no-reply address");
  {
    const message = gmail.receive({
      from: "Product Updates <noreply@saasvendor.com>",
      subject: "Your weekly digest",
      body: "Here's what happened this week.",
      extraHeaders: { "List-Unsubscribe": "<https://saasvendor.com/u>" },
    });

    const report = await runInboxScan();

    check("is ignored", report.ignored === 1 && report.drafted === 0);
    check("costs nothing — the model is never called", model.calls === 0);
    check("nothing is sent at all", gmail.outbound.length === 0);
    check("the thread is filed as ignored", gmail.hasLabel(message, LABELS.ignored));
  }

  scenario("A complaint");
  {
    const message = gmail.receive({
      from: "Sam Reeve <sam@reeve-electrical.com>",
      subject: "This is not good enough",
      body: "The agent gave my customer completely wrong information yesterday and I want to know what you're doing about it.",
    });
    model.classifications["This is not good enough"] = { kind: "complaint", fromHuman: true, confidence: 0.97 };

    const report = await runInboxScan();

    check("is never answered automatically", report.drafted === 0 && report.escalated === 1);
    check("nothing is sent to them", !gmail.outbound.some((m) => m.kind === "reply"));
    check("is flagged for a human", gmail.hasLabel(message, LABELS.needsYou));
    check("no draft is left lying around", gmail.drafts.size === 0);
  }

  scenario("An enquiry the classifier is unsure about");
  {
    const message = gmail.receive({ from: "someone@example.com", subject: "quick q", body: "can you help" });
    model.classifications["quick q"] = { kind: "enquiry", fromHuman: true, confidence: 0.4 };

    const report = await runInboxScan();

    check("is left for a human rather than guessed at", report.escalated === 1 && report.drafted === 0);
    check("is flagged for a human", gmail.hasLabel(message, LABELS.needsYou));
  }

  scenario("The model drafts something it shouldn't");
  {
    const message = gmail.receive({
      from: "Ali Hassan <ali@hassan-trading.com>",
      subject: "How much does this cost?",
      body: "What would it cost to run one of your agents for a team of five?",
    });
    model.classifications["How much does this cost?"] = { kind: "pricing", fromHuman: true, confidence: 0.93 };
    model.draftOverride = "Hi Ali,\n\nOur agents start at $200 a month for a team your size.\n\nHappy to talk it through.";

    const report = await runInboxScan();

    check("the reply is held back", report.drafted === 0 && report.escalated === 1);
    check("nothing is sent to them", !gmail.outbound.some((m) => m.kind === "reply"));
    check("no draft is created", gmail.drafts.size === 0);
    check("it is flagged for a human", gmail.hasLabel(message, LABELS.needsYou));
    check(
      "and the reason names the problem",
      Boolean(report.outcomes[0]?.detail.includes("monetary amount")),
      report.outcomes[0]?.detail,
    );
  }

  scenario("A thread you have already answered yourself");
  {
    const message = gmail.receive({ from: "Nadia <nadia@buyer.test>", subject: "Following up", body: "Any thoughts?" });
    // A reply from the mailbox owner, later in the same thread.
    const mine = gmail.receive({ from: MAILBOX, subject: "Re: Following up", body: "Called you — speak tomorrow." });
    mine.threadId = message.threadId;
    model.classifications["Following up"] = { kind: "enquiry", fromHuman: true, confidence: 0.9 };

    const report = await runInboxScan();

    check("is left alone", report.drafted === 0);
    check("is flagged so you keep the thread", gmail.hasLabel(message, LABELS.needsYou));
  }

  scenario("A thread you started yourself");
  {
    // Our outreach first, their answer second — the responder was never part
    // of this conversation and must not join it.
    const mine = gmail.receive({ from: MAILBOX, subject: "Following up on our call", body: "Good speaking earlier." });
    const theirs = gmail.receive({ from: "Omar <omar@buyer.test>", subject: "Re: Following up on our call", body: "Thanks — can you send more detail?" });
    theirs.threadId = mine.threadId;
    model.classifications["Re: Following up on our call"] = { kind: "enquiry", fromHuman: true, confidence: 0.95 };

    const report = await runInboxScan();

    check("is not answered", report.drafted === 0 && !gmail.outbound.some((m) => m.kind === "reply"));
    check("is left for you", gmail.hasLabel(theirs, LABELS.needsYou));
  }

  scenario("Clicking Stop it in the notification");
  {
    const message = gmail.receive({
      from: "Tom Vale <tom@valeworks.com>",
      subject: "Interested in the agents",
      body: "Saw the testing page. Could one of these handle our order emails?",
    });
    model.classifications["Interested in the agents"] = { kind: "capability_question", fromHuman: true, confidence: 0.9 };

    await runInboxScan();
    const draftId = [...gmail.drafts.keys()][0];
    check("a draft is waiting", Boolean(draftId));

    const rejected = await handleInboxAction(draftId, "cancel", "not-the-right-token");
    check("a forged token is refused", rejected.status === 403);
    check("and the draft survives the forgery", gmail.drafts.has(draftId));

    const outcome = await handleInboxAction(draftId, "cancel", signAction(draftId, "cancel"));
    check("a valid stop link works", outcome.status === 200, outcome.message);
    check("the draft is gone", !gmail.drafts.has(draftId));
    check("the thread is handed to you", gmail.hasLabel(message, LABELS.needsYou));
    check("the thread is no longer pending", !gmail.hasLabel(message, LABELS.pending));

    const afterCancel = await runInboxScan();
    check("and it is never sent later", afterCancel.sent === 0 && !gmail.outbound.some((m) => m.kind === "reply"));
  }

  scenario("Clicking Send now in the notification");
  {
    gmail.receive({
      from: "Rana Aziz <rana@azizfoods.com>",
      subject: "Can you help with our inbox",
      body: "We spend every morning answering the same questions from customers.",
    });
    model.classifications["Can you help with our inbox"] = { kind: "enquiry", fromHuman: true, confidence: 0.92 };

    await runInboxScan();
    const draftId = [...gmail.drafts.keys()][0];

    const outcome = await handleInboxAction(draftId, "send", signAction(draftId, "send"));
    check("the reply goes out immediately", outcome.status === 200 && gmail.outbound.some((m) => m.kind === "reply"));
    check("a second click is refused rather than sending twice", (await handleInboxAction(draftId, "send", signAction(draftId, "send"))).status === 410);
  }

  scenario("Deleting the draft in Gmail instead of clicking anything");
  {
    const message = gmail.receive({
      from: "Yusuf Karim <yusuf@karimparts.com>",
      subject: "A question about the agents",
      body: "Do these work in Kurdish as well as English?",
    });
    model.classifications["A question about the agents"] = { kind: "capability_question", fromHuman: true, confidence: 0.9 };

    await runInboxScan();
    gmail.drafts.clear(); // what deleting it in Gmail looks like from here
    gmail.ageDraft(message.threadId, 30);

    const report = await runInboxScan();
    check("nothing is sent", !gmail.outbound.some((m) => m.kind === "reply"));
    check("the deletion is read as a cancellation", report.sent === 0);
    check("the thread is handed to you", gmail.hasLabel(message, LABELS.needsYou));
  }

  scenario("Autosend switched off");
  {
    process.env.INBOX_AUTOSEND = "false";
    const message = gmail.receive({
      from: "Lena Farid <lena@faridclinic.com>",
      subject: "Booking assistant",
      body: "Could one of your agents handle appointment booking for a small clinic?",
    });
    model.classifications["Booking assistant"] = { kind: "capability_question", fromHuman: true, confidence: 0.95 };

    await runInboxScan();
    gmail.ageDraft(message.threadId, 120);
    const report = await runInboxScan();

    check("still drafts and still notifies", gmail.drafts.size === 1 && gmail.outbound.some((m) => m.kind === "notification"));
    check("but never sends on its own, however long it waits", report.sent === 0 && !gmail.outbound.some((m) => m.kind === "reply"));
    const notification = gmail.outbound.find((m) => m.kind === "notification");
    check("and the notification says so", Boolean(notification?.body.includes("INBOX_AUTOSEND is off")));
    process.env.INBOX_AUTOSEND = "true";
  }

  scenario("The daily cap");
  {
    process.env.INBOX_MAX_PER_DAY = "2";
    for (let i = 1; i <= 4; i++) {
      gmail.receive({ from: `person${i}@business${i}.test`, subject: `Enquiry ${i}`, body: "Can you help us with customer questions?" });
      model.classifications[`Enquiry ${i}`] = { kind: "enquiry", fromHuman: true, confidence: 0.9 };
    }

    const report = await runInboxScan();
    check("stops at the cap", report.drafted === 2, `drafted ${report.drafted}`);
    check("and says why it stopped", report.outcomes.some((o) => o.detail.includes("daily cap")));
    process.env.INBOX_MAX_PER_DAY = "20";
  }

  scenario("Writing to the same person twice");
  {
    process.env.INBOX_MAX_PER_DAY = "20";
    const first = gmail.receive({ from: "repeat@customer.test", subject: "First message", body: "Can your agents help us?" });
    model.classifications["First message"] = { kind: "enquiry", fromHuman: true, confidence: 0.9 };
    await runInboxScan();
    gmail.ageDraft(first.threadId, 30);
    await runInboxScan();

    const second = gmail.receive({ from: "repeat@customer.test", subject: "Second message", body: "One more thing." });
    model.classifications["Second message"] = { kind: "enquiry", fromHuman: true, confidence: 0.9 };
    const report = await runInboxScan();

    check("the second one is not auto-answered", report.drafted === 0);
    check("it is handed to you instead", gmail.hasLabel(second, LABELS.needsYou));
    check("with the cooldown named as the reason", report.outcomes.some((o) => o.detail.includes("last 7 days")));
  }

  scenario("A thread you have labelled CoreOs-Auto/Off");
  {
    const message = gmail.receive({ from: "sensitive@client.test", subject: "Private matter", body: "Let's keep this between us." });
    model.classifications["Private matter"] = { kind: "enquiry", fromHuman: true, confidence: 0.99 };
    // Apply the opt-out the way you would in Gmail.
    const offId = "off-label";
    gmail.labels.set(LABELS.off, offId);
    message.labels.add(offId);

    const report = await runInboxScan();
    check("is never examined", report.examined === 0 && report.drafted === 0);
    check("nothing is sent", gmail.outbound.length === 0);
  }

  /* ------------------------------------------------------------------ done */

  console.log(`\n${"─".repeat(60)}`);
  if (failures.length) {
    console.log(`${passed} passed, ${failures.length} FAILED\n`);
    for (const failure of failures) console.log(`  ✗ ${failure}`);
    process.exit(1);
  }
  console.log(`All ${passed} checks passed.\n`);
}

main().catch((err) => {
  console.error("\nSelf-test crashed:", err);
  process.exit(1);
});
