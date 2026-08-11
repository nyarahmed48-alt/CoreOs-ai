/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The same mailbox operations as lab/gmail.ts, over IMAP and SMTP.
 *
 * Why both exist: the REST backend needs a Google Cloud project, an OAuth
 * client, a published consent screen and a refresh token. That is a lot of
 * apparatus for one person answering their own mail. This one needs an address
 * and a 16-character app password:
 *
 *   GMAIL_ADDRESS        the mailbox being answered
 *   GMAIL_APP_PASSWORD   https://myaccount.google.com/apppasswords
 *
 * It is the plainer trade: simpler to set up, but an app password is the whole
 * mailbox rather than a scope, and it cannot be revoked separately from the
 * other app passwords on the account. Both backends implement the same
 * interface and lab/mailbox.ts picks whichever is configured.
 *
 * Three Gmail IMAP extensions carry most of the weight:
 *
 *   X-GM-RAW     Gmail's own search syntax inside IMAP SEARCH, so the triage
 *                queries in lab/inbox.ts work here verbatim
 *   X-GM-LABELS  read and write labels, which plain IMAP has no concept of
 *   X-GM-MSGID   an id that is stable across folders, unlike an IMAP UID,
 *   X-GM-THRID   and a thread id to match
 *
 * Those last two matter more than they look. IMAP UIDs are per-folder, so a
 * draft's UID changes meaning the moment you look in a different mailbox; the
 * Gmail ids are what let this file hand lab/inbox.ts something it can hold on
 * to between calls.
 *
 * Nothing in this file is bundled into the browser build.
 */

import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import {
  envelopeFromRaw,
  fromBase64url,
  htmlToText,
  withoutQuotedReply,
  type GmailMessage,
} from "./mail-format";

/* Gmail's own folders. The prefix is localised in some accounts, which is why
   the special-use flags are consulted first and these are only the fallback. */
const ALL_MAIL = "[Gmail]/All Mail";
const DRAFTS = "[Gmail]/Drafts";

interface ImapConfig {
  address: string;
  password: string;
}

function imapConfig(): ImapConfig | null {
  const address = process.env.GMAIL_ADDRESS;
  // App passwords are shown to you in groups of four; people paste them that
  // way and Google accepts either form, so normalise rather than complain.
  const password = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  if (!address || !password) return null;
  return { address, password };
}

export const isGmailConfigured = (): boolean => imapConfig() !== null;

/* ---------------------------------------------------------- connections -- */

/**
 * A hard ceiling on an operation.
 *
 * imapflow takes a connectionTimeout, but it does not always fire — on a
 * network that silently drops packets to port 993 rather than refusing them,
 * connect() waits forever. Verified: it hangs. So the timeout is enforced out
 * here, where it cannot be skipped, rather than trusted to the library.
 */
function withTimeout<T>(work: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    work.finally(() => clearTimeout(timer)),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${what} timed out after ${Math.round(ms / 1000)}s`)), ms);
      timer.unref?.();
    }),
  ]);
}

let client: ImapFlow | null = null;
let connecting: Promise<ImapFlow> | null = null;
/** Resolved once per connection: Gmail's real names for All Mail and Drafts. */
let folders: { all: string; drafts: string } | null = null;

async function connection(): Promise<ImapFlow> {
  if (client?.usable) return client;
  if (connecting) return connecting;

  const config = imapConfig();
  if (!config) throw new Error("Gmail IMAP is not configured");

  connecting = (async () => {
    const next = new ImapFlow({
      host: "imap.gmail.com",
      port: 993,
      secure: true,
      auth: { user: config.address, pass: config.password },
      // imapflow logs every command at info level otherwise, which buries the
      // responder's own output and puts message subjects in the build log.
      logger: false,
      /* Without these a mailbox that cannot be reached — a blocked port, a
         network with no route to 993 — hangs rather than fails. On a scheduled
         function that spends the entire invocation waiting, and on the Express
         server it is a request that never answers. Fail in seconds instead. */
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 90_000,
    });

    next.on("error", (err: any) => {
      console.error("IMAP connection error:", err?.message || err);
    });

    try {
      await withTimeout(next.connect(), 20_000, "Connecting to imap.gmail.com");
    } catch (err: any) {
      // A half-open client keeps a socket and its timers alive.
      try {
        await next.logout();
      } catch {
        next.close();
      }
      connecting = null;
      // Gmail says "Invalid credentials" for a wrong password, a missing app
      // password, and IMAP being switched off. Point at all three.
      if (/timed? ?out|ETIMEDOUT|ECONNREFUSED|EHOSTUNREACH|ENOTFOUND/i.test(String(err?.message || err?.code))) {
        // Worth naming: plenty of networks allow HTTPS and quietly drop 993.
        throw new Error(
          `Could not reach imap.gmail.com on port 993 (${err?.message || err?.code}). ` +
            "Some networks and hosts block raw IMAP; the OAuth backend uses ordinary HTTPS if that is the problem.",
        );
      }
      if (/AUTHENTICATIONFAILED|Invalid credentials/i.test(String(err?.message))) {
        throw new Error(
          "Gmail rejected the login. Check GMAIL_ADDRESS, and that GMAIL_APP_PASSWORD is a 16-character app password " +
            "(https://myaccount.google.com/apppasswords) rather than the account password.",
        );
      }
      throw err;
    }

    folders = await resolveFolders(next);
    client = next;
    connecting = null;
    return next;
  })();

  return connecting;
}

/**
 * Gmail translates its own folder names — "[Gmail]/All Mail" is
 * "[Gmail]/Alle Nachrichten" on a German account. The special-use flags are
 * the same everywhere, so ask for those and keep the English names only as a
 * last resort.
 */
async function resolveFolders(on: ImapFlow): Promise<{ all: string; drafts: string }> {
  const list = await on.list();
  const bySpecialUse = (use: string) => list.find((box: any) => box.specialUse === use)?.path;
  return {
    all: bySpecialUse("\\All") || ALL_MAIL,
    drafts: bySpecialUse("\\Drafts") || DRAFTS,
  };
}

/** Closes the connection. IMAP is a long-lived socket; scripts hang without this. */
export async function closeMailbox(): Promise<void> {
  const open = client;
  client = null;
  connecting = null;
  folders = null;
  if (!open) return;
  try {
    await open.logout();
  } catch {
    /* already gone — nothing to salvage */
  }
}

export function resetGmailCaches(): void {
  labelCache = null;
  labelWrites = Promise.resolve();
}

/**
 * Runs a block with a mailbox open and locked.
 *
 * imapflow allows one open mailbox per connection, and this file switches
 * between All Mail and Drafts constantly. The lock serialises that; without it
 * two overlapping calls race and one of them reads the wrong folder.
 */
async function inFolder<T>(path: string, run: (on: ImapFlow) => Promise<T>): Promise<T> {
  const on = await connection();
  const lock = await on.getMailboxLock(path);
  try {
    return await run(on);
  } finally {
    lock.release();
  }
}

const allMail = <T>(run: (on: ImapFlow) => Promise<T>) =>
  connection().then(() => inFolder(folders!.all, run));
const draftsFolder = <T>(run: (on: ImapFlow) => Promise<T>) =>
  connection().then(() => inFolder(folders!.drafts, run));

/* -------------------------------------------------------------- reading -- */

interface Located {
  uid: number;
  emailId: string;
  threadId: string;
  internalDate: number;
}

/**
 * fetchOne returns `false` for "no such message", which does not narrow well
 * against the object case. Fold it into null so the call sites can just check.
 */
async function fetchOne(
  on: ImapFlow,
  sequence: string,
  query: Parameters<ImapFlow["fetchOne"]>[1],
): Promise<Exclude<Awaited<ReturnType<ImapFlow["fetchOne"]>>, false> | null> {
  const message = await on.fetchOne(sequence, query, { uid: true });
  return message || null;
}

/** Everything matching a Gmail search query, newest first. */
async function locate(on: ImapFlow, query: string, limit: number): Promise<Located[]> {
  // An empty query means "everything here" — used for listing drafts.
  const uids = (await on.search(query.trim() ? { gmraw: query } : { all: true }, { uid: true })) || [];
  if (!uids.length) return [];

  // Gmail returns UIDs ascending, and UIDs ascend with arrival, so the newest
  // are at the end. Take from there rather than fetching the whole mailbox.
  const newest = uids.slice(-Math.max(limit, 1));
  const found: Located[] = [];

  for await (const message of on.fetch(
    newest as any,
    { uid: true, threadId: true, internalDate: true },
    { uid: true },
  )) {
    found.push({
      uid: message.uid,
      emailId: String((message as any).emailId || message.uid),
      threadId: String((message as any).threadId || (message as any).emailId || message.uid),
      internalDate: message.internalDate ? new Date(message.internalDate).getTime() : 0,
    });
  }

  return found.sort((a, b) => b.internalDate - a.internalDate).slice(0, limit);
}

export async function searchMessages(query: string, maxResults = 25): Promise<Array<{ id: string; threadId: string }>> {
  return allMail(async (on) => {
    const found = await locate(on, query, maxResults);
    return found.map((m) => ({ id: m.emailId, threadId: m.threadId }));
  });
}

export async function countMessages(query: string, ceiling = 100): Promise<number> {
  return allMail(async (on) => {
    const uids = (await on.search({ gmraw: query }, { uid: true })) || [];
    return Math.min(uids.length, ceiling);
  });
}

/** Turns a raw RFC 822 message into the shape lab/inbox.ts reads. */
async function toGmailMessage(
  source: Buffer,
  meta: { emailId: string; threadId: string; internalDate: number; labels?: Set<string> | string[] },
): Promise<GmailMessage> {
  const parsed = await simpleParser(source);

  const headers = parsed.headerLines.map((line) => {
    const at = line.line.indexOf(":");
    return { name: at === -1 ? line.key : line.line.slice(0, at), value: at === -1 ? "" : line.line.slice(at + 1).trim() };
  });

  const text = (parsed.text || "").trim() || (parsed.html ? htmlToText(String(parsed.html)) : "");

  return {
    id: meta.emailId,
    threadId: meta.threadId,
    labelIds: meta.labels ? [...meta.labels] : undefined,
    internalDate: String(meta.internalDate),
    snippet: text.slice(0, 200),
    bodyText: text,
    payload: { headers },
  };
}

export async function getMessage(id: string): Promise<GmailMessage> {
  return allMail(async (on) => {
    const uids = (await on.search({ emailId: id }, { uid: true })) || [];
    if (!uids.length) throw new Error(`No message with id ${id}`);

    const message = await fetchOne(on, String(uids[uids.length - 1]), {
      source: true,
      threadId: true,
      internalDate: true,
      labels: true,
    });
    if (!message || !message.source) throw new Error(`Could not read message ${id}`);


    return toGmailMessage(message.source, {
      emailId: String((message as any).emailId || id),
      threadId: String((message as any).threadId || id),
      internalDate: message.internalDate ? new Date(message.internalDate).getTime() : 0,
      labels: (message as any).labels,
    });
  });
}

/**
 * The messages on a thread, with headers only.
 *
 * lab/inbox.ts uses this for one question — has anyone at this mailbox already
 * written here — so the bodies are not fetched.
 */
export async function getThread(id: string): Promise<{ id: string; messages?: GmailMessage[] }> {
  return allMail(async (on) => {
    const uids = (await on.search({ threadId: id }, { uid: true })) || [];
    if (!uids.length) return { id, messages: [] };

    const messages: GmailMessage[] = [];
    for await (const message of on.fetch(
      uids as any,
      { uid: true, threadId: true, internalDate: true, envelope: true },
      { uid: true },
    )) {
      const envelope: any = message.envelope || {};
      const from = (envelope.from || [])[0];
      messages.push({
        id: String((message as any).emailId || message.uid),
        threadId: id,
        internalDate: message.internalDate ? String(new Date(message.internalDate).getTime()) : "0",
        payload: {
          headers: [
            { name: "From", value: from ? `${from.name || ""} <${from.address}>`.trim() : "" },
            { name: "Subject", value: envelope.subject || "" },
            { name: "Date", value: envelope.date ? new Date(envelope.date).toUTCString() : "" },
          ],
        },
      });
    }
    return { id, messages };
  });
}

/* --------------------------------------------------------------- labels -- */

/**
 * Labels here are their own names, not opaque ids.
 *
 * The REST backend returns "Label_8" and X-GM-LABELS wants "CoreOs-Auto/Pending".
 * lab/inbox.ts never inspects what ensureLabel returns — it only passes it back
 * to modifyThread — so each backend is free to use whatever identifier its own
 * write path needs.
 */
let labelCache: Set<string> | null = null;
let labelWrites: Promise<unknown> = Promise.resolve();

export async function ensureLabel(name: string): Promise<string> {
  if (labelCache?.has(name)) return name;

  const run = labelWrites.then(async () => {
    const on = await connection();
    if (!labelCache) {
      const list = await on.list();
      labelCache = new Set(list.map((box: any) => box.path));
    }
    if (labelCache.has(name)) return name;

    try {
      await on.mailboxCreate(name.split("/"));
      labelCache.add(name);
    } catch (err: any) {
      // Gmail says ALREADYEXISTS for a label it considers equal to this one —
      // a different case, or one created between the list and the create.
      if (!/ALREADYEXISTS|already exists/i.test(String(err?.message))) throw err;
      labelCache.add(name);
    }
    return name;
  });

  labelWrites = run.catch(() => undefined);
  return run;
}

export async function modifyThread(
  threadId: string,
  changes: { addLabelIds?: string[]; removeLabelIds?: string[] },
): Promise<void> {
  await allMail(async (on) => {
    const uids = (await on.search({ threadId }, { uid: true })) || [];
    if (!uids.length) return;

    if (changes.addLabelIds?.length) {
      await on.messageFlagsAdd(uids as any, changes.addLabelIds, { uid: true, useLabels: true } as any);
    }
    if (changes.removeLabelIds?.length) {
      await on.messageFlagsRemove(uids as any, changes.removeLabelIds, { uid: true, useLabels: true } as any);
    }
  });
}

/* --------------------------------------------------------------- drafts -- */

export interface GmailDraft {
  id: string;
  message?: GmailMessage;
}

/**
 * Saves a draft into the Drafts folder.
 *
 * There is no way to say "attach this to thread X" over IMAP. Gmail threads on
 * In-Reply-To and References, which buildRaw already sets from the message
 * being answered, so the draft lands on the right conversation by way of the
 * headers rather than by instruction.
 */
export async function createDraft(raw: string, _threadId?: string): Promise<GmailDraft> {
  const source = fromBase64url(raw);
  const on = await connection();
  const appended = await on.append(folders!.drafts, source, ["\\Draft"]);
  if (!appended) throw new Error("Gmail did not accept the draft");

  // Read back the Gmail id, since the UID that append returns is meaningless
  // outside the Drafts folder and the caller keeps this between runs.
  return draftsFolder(async (inDrafts) => {
    const message = await fetchOne(inDrafts, String(appended.uid), { uid: true });
    return { id: String((message as any)?.emailId || appended.uid) };
  });
}

export async function listDrafts(query: string, maxResults = 25): Promise<GmailDraft[]> {
  return draftsFolder(async (on) => {
    const found = await locate(on, query, maxResults);
    return found.map((draft) => ({
      id: draft.emailId,
      message: { id: draft.emailId, threadId: draft.threadId, internalDate: String(draft.internalDate) },
    }));
  });
}

async function findDraft(on: ImapFlow, id: string): Promise<number | null> {
  const uids = (await on.search({ emailId: id }, { uid: true })) || [];
  if (uids.length) return uids[uids.length - 1];
  // A numeric id is a UID from a create that could not read its Gmail id back.
  return /^\d+$/.test(id) ? Number(id) : null;
}

export async function getDraft(id: string): Promise<GmailDraft> {
  return draftsFolder(async (on) => {
    const uid = await findDraft(on, id);
    if (uid === null) throw new Error(`No draft with id ${id}`);

    const message = await fetchOne(on, String(uid), { source: true, threadId: true, internalDate: true });
    if (!message?.source) throw new Error(`No draft with id ${id}`);

    return {
      id,
      message: await toGmailMessage(message.source, {
        emailId: id,
        threadId: String((message as any).threadId || id),
        internalDate: message.internalDate ? new Date(message.internalDate).getTime() : 0,
      }),
    };
  });
}

/**
 * Sends a draft and removes it.
 *
 * IMAP cannot send, so this is three steps rather than one: read the draft's
 * bytes, hand them to SMTP, delete the draft. Gmail files the sent copy itself
 * — messages sent through its SMTP appear in Sent without being appended.
 *
 * The order is deliberate. Sending first means a failure to delete leaves a
 * stray draft, which is untidy; deleting first would mean a failure to send
 * loses the reply entirely.
 */
export async function sendDraft(id: string): Promise<void> {
  const source = await draftsFolder(async (on) => {
    const uid = await findDraft(on, id);
    if (uid === null) throw new Error(`No draft with id ${id}`);
    const message = await fetchOne(on, String(uid), { source: true });
    if (!message?.source) throw new Error(`No draft with id ${id}`);
    return message.source;
  });

  await smtpSend(source);
  await deleteDraft(id);
}

export async function deleteDraft(id: string): Promise<void> {
  await draftsFolder(async (on) => {
    const uid = await findDraft(on, id);
    if (uid === null) return;
    await on.messageDelete(String(uid), { uid: true });
  });
}

/* --------------------------------------------------------------- sending -- */

let transport: nodemailer.Transporter | null = null;

function smtp(): nodemailer.Transporter {
  const config = imapConfig();
  if (!config) throw new Error("Gmail SMTP is not configured");
  if (transport) return transport;

  transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: config.address, pass: config.password },
    // Same reasoning as the IMAP timeouts: a send that cannot connect should
    // fail and be reported, not hold the run open.
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 60_000,
  });
  return transport;
}

/** Sends a message that is already built, rather than letting nodemailer build one. */
async function smtpSend(source: Buffer): Promise<void> {
  const config = imapConfig()!;
  const envelope = envelopeFromRaw(source);
  if (!envelope.to.length) throw new Error("Refusing to send a message with no recipient");

  await smtp().sendMail({
    envelope: { from: config.address, to: envelope.to },
    raw: source,
  });
}

export async function sendRaw(raw: string): Promise<void> {
  await smtpSend(fromBase64url(raw));
}

/**
 * The address of the authorised mailbox.
 *
 * Connects first, deliberately. The address is sitting right there in the
 * environment and returning it unverified would be faster — but callers treat
 * a successful answer here as "the mailbox works", and the doctor reported a
 * cheerful "signing in … ok" against a password Gmail had never seen. Asking a
 * question that cannot fail is not a check.
 */
export async function mailboxAddress(): Promise<string> {
  const config = imapConfig();
  if (!config) throw new Error("Gmail IMAP is not configured");
  const on = await connection();
  await on.noop();
  return config.address;
}

/* Re-exported so lab/mailbox.ts can present one surface regardless of backend. */
export { withoutQuotedReply };
