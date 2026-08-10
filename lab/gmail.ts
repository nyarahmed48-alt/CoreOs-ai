/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A small Gmail client — just the calls the auto-responder needs.
 *
 * Deliberately no googleapis SDK. That package is tens of megabytes and pulls
 * a dependency tree into every serverless bundle, for what is a handful of
 * REST calls. The rest of this codebase talks to its provider with `fetch`
 * (see lab/agents.ts) and this file keeps that going.
 *
 * Auth is the OAuth2 installed-app flow with a long-lived refresh token:
 *
 *   GOOGLE_CLIENT_ID       from a Google Cloud OAuth client
 *   GOOGLE_CLIENT_SECRET   the same client's secret
 *   GOOGLE_REFRESH_TOKEN   granted once, for the mailbox being answered
 *
 * See README — "The inbox responder" — for how to mint the refresh token.
 * Nothing in this file is bundled into the browser build.
 */

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

function gmailConfig(): GmailConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

/** True once all three Google credentials are present. */
export const isGmailConfigured = (): boolean => gmailConfig() !== null;

/* ------------------------------------------------------------------ auth --
   Access tokens last an hour. On a long-lived server that is worth caching;
   on serverless the module scope usually dies with the invocation, in which
   case this simply refreshes every run — one extra request, no harm. */

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  const config = gmailConfig();
  if (!config) throw new Error("Gmail is not configured");

  // 60s of slack so a token cannot expire mid-request.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const payload: any = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    // A revoked or expired refresh token surfaces here as invalid_grant. Say
    // which one it is: the fix (re-run the consent flow) is not obvious from
    // a bare 400.
    const detail = payload?.error_description || payload?.error || response.statusText;
    throw new Error(
      payload?.error === "invalid_grant"
        ? `Google rejected the refresh token (${detail}). Re-authorise the mailbox and set GOOGLE_REFRESH_TOKEN again.`
        : `Google token exchange failed: ${detail}`,
    );
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
  };
  return cachedToken.value;
}

async function gmail<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const response = await fetch(`${GMAIL_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (response.status === 204) return undefined as T;

  const payload: any = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Gmail ${response.status} on ${path}: ${payload?.error?.message || response.statusText}`);
  }
  return payload as T;
}

/* ------------------------------------------------------------- messages -- */

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: GmailHeader[];
    mimeType?: string;
    body?: { data?: string; size?: number };
    parts?: any[];
  };
}

/** Message ids matching a Gmail search query, newest first. */
export async function searchMessages(query: string, maxResults = 25): Promise<Array<{ id: string; threadId: string }>> {
  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) });
  const payload = await gmail<{ messages?: Array<{ id: string; threadId: string }> }>(`/messages?${params}`);
  return payload.messages || [];
}

/** How many messages match a query, counted up to `ceiling`. */
export async function countMessages(query: string, ceiling = 100): Promise<number> {
  const found = await searchMessages(query, ceiling);
  return found.length;
}

export async function getMessage(id: string): Promise<GmailMessage> {
  return gmail<GmailMessage>(`/messages/${id}?format=full`);
}

export async function getThread(id: string): Promise<{ id: string; messages?: GmailMessage[] }> {
  return gmail(`/threads/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Date`);
}

export async function modifyThread(
  threadId: string,
  changes: { addLabelIds?: string[]; removeLabelIds?: string[] },
): Promise<void> {
  await gmail(`/threads/${threadId}/modify`, { method: "POST", body: JSON.stringify(changes) });
}

/* --------------------------------------------------------------- labels -- */

let labelCache: Map<string, string> | null = null;
let labelLoad: Promise<Map<string, string>> | null = null;

/**
 * The mailbox's labels, name to id.
 *
 * The in-flight promise matters: callers ensure several labels at once, and
 * without it each one would fetch its own copy of the list, decide the label
 * it wants is missing, and create a duplicate.
 */
async function loadLabels(): Promise<Map<string, string>> {
  if (labelCache) return labelCache;
  if (!labelLoad) {
    labelLoad = gmail<{ labels?: Array<{ id: string; name: string }> }>("/labels")
      .then((payload) => {
        labelCache = new Map((payload.labels || []).map((l) => [l.name, l.id]));
        return labelCache;
      })
      .finally(() => {
        labelLoad = null;
      });
  }
  return labelLoad;
}

/** Serialises label creation, for the same reason loadLabels is shared. */
let labelWrites: Promise<unknown> = Promise.resolve();

/**
 * The id of a label, creating it if the mailbox does not have it yet.
 *
 * Nested names ("CoreOs-Auto/Pending") need their parent to exist first or
 * Gmail shows them as one flat label with a slash in the name, so parents are
 * created on the way down.
 */
/**
 * Forgets the cached access token and label ids.
 *
 * The caches assume one mailbox for the life of the process, which is true in
 * production and false in the self-test, where each scenario stands up a fresh
 * one. Also the escape hatch if a label is deleted under a long-lived server.
 */
export function resetGmailCaches(): void {
  cachedToken = null;
  labelCache = null;
  labelLoad = null;
  labelWrites = Promise.resolve();
}

export async function ensureLabel(name: string): Promise<string> {
  const cached = (await loadLabels()).get(name);
  if (cached) return cached;

  // Queue behind any other creation in flight. Two labels under the same new
  // parent, ensured at the same time, would otherwise both create the parent.
  const run = labelWrites.then(async () => {
    const labels = await loadLabels();
    const segments = name.split("/");
    let id = "";

    for (let i = 0; i < segments.length; i++) {
      const path = segments.slice(0, i + 1).join("/");
      const known = labels.get(path);
      if (known) {
        id = known;
        continue;
      }
      try {
        const created = await gmail<{ id: string }>("/labels", {
          method: "POST",
          body: JSON.stringify({
            name: path,
            labelListVisibility: "labelShow",
            messageListVisibility: "show",
          }),
        });
        labels.set(path, created.id);
        id = created.id;
      } catch (err: any) {
        // Someone else got there first — another instance, or a label Gmail
        // considers equal to this one. Re-read rather than fail the run.
        if (!/409|already exists/i.test(String(err?.message))) throw err;
        labelCache = null;
        const refreshed = await loadLabels();
        const found = refreshed.get(path);
        if (!found) throw err;
        id = found;
      }
    }
    return id;
  });

  labelWrites = run.catch(() => undefined);
  return run;
}

/* --------------------------------------------------------------- drafts -- */

export interface GmailDraft {
  id: string;
  message?: GmailMessage;
}

export async function createDraft(raw: string, threadId?: string): Promise<GmailDraft> {
  return gmail<GmailDraft>("/drafts", {
    method: "POST",
    body: JSON.stringify({ message: { raw, ...(threadId ? { threadId } : {}) } }),
  });
}

export async function listDrafts(query: string, maxResults = 25): Promise<GmailDraft[]> {
  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) });
  const payload = await gmail<{ drafts?: GmailDraft[] }>(`/drafts?${params}`);
  return payload.drafts || [];
}

export async function getDraft(id: string): Promise<GmailDraft> {
  return gmail<GmailDraft>(`/drafts/${id}?format=full`);
}

export async function sendDraft(id: string): Promise<GmailMessage> {
  return gmail<GmailMessage>("/drafts/send", { method: "POST", body: JSON.stringify({ id }) });
}

export async function deleteDraft(id: string): Promise<void> {
  await gmail(`/drafts/${id}`, { method: "DELETE" });
}

/** Sends a message that is not a reply — used for the owner's notification. */
export async function sendRaw(raw: string): Promise<GmailMessage> {
  return gmail<GmailMessage>("/messages/send", { method: "POST", body: JSON.stringify({ raw }) });
}

/** The address of the authorised mailbox. */
export async function mailboxAddress(): Promise<string> {
  const profile = await gmail<{ emailAddress: string }>("/profile");
  return profile.emailAddress;
}

/* ------------------------------------------------------------ MIME bits -- */

/** Gmail's API takes and returns base64url, not standard base64. */
export function base64url(input: string | Buffer): string {
  return Buffer.from(input as any)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(input: string): string {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

export function header(message: GmailMessage, name: string): string {
  const headers = message.payload?.headers || [];
  const match = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return match?.value || "";
}

/** Every value for a header that can legitimately repeat (Received, etc.). */
export function headers(message: GmailMessage, name: string): string[] {
  return (message.payload?.headers || [])
    .filter((h) => h.name.toLowerCase() === name.toLowerCase())
    .map((h) => h.value);
}

/** The bare address out of `Jane Okafor <jane@example.com>`. */
export function parseAddress(value: string): { name: string; email: string } {
  const angled = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (angled) {
    return { name: angled[1].replace(/^"|"$/g, "").trim(), email: angled[2].trim().toLowerCase() };
  }
  return { name: "", email: value.trim().toLowerCase() };
}

/**
 * The readable body of a message.
 *
 * Walks the MIME tree preferring text/plain, and falls back to stripping tags
 * out of text/html — plenty of senders' clients only produce HTML. Attachments
 * are skipped: they have a filename and we only want prose.
 */
export function messageText(message: GmailMessage, limit = 6000): string {
  const plain: string[] = [];
  const html: string[] = [];

  const walk = (part: any) => {
    if (!part) return;
    const mime = String(part.mimeType || "");
    if (Array.isArray(part.parts)) {
      part.parts.forEach(walk);
      return;
    }
    if (part.filename) return;
    const data = part.body?.data;
    if (!data) return;
    if (mime === "text/plain") plain.push(fromBase64url(data));
    else if (mime === "text/html") html.push(fromBase64url(data));
  };

  walk(message.payload);

  let text = plain.join("\n").trim();
  if (!text && html.length) {
    text = html
      .join("\n")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  if (!text) text = message.snippet || "";
  return text.slice(0, limit);
}

/** Drops the quoted history so the model reads the new text, not the thread. */
export function withoutQuotedReply(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (/^\s*(On .{10,80}wrote:|-{2,}\s*Original Message\s*-{2,}|_{10,})\s*$/i.test(line)) break;
    if (/^\s*>/.test(line)) continue;
    out.push(line);
  }
  const trimmed = out.join("\n").trim();
  return trimmed || text.trim();
}

/** RFC 2047 encoding, so non-ASCII subjects survive the wire intact. */
function encodeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

export interface OutgoingMail {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  references?: string;
}

/** Builds an RFC 822 message, base64url-encoded the way Gmail wants it. */
export function buildRaw(mail: OutgoingMail): string {
  const boundary = `coreos-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const lines: string[] = [];

  if (mail.from) lines.push(`From: ${mail.from}`);
  lines.push(`To: ${mail.to}`);
  lines.push(`Subject: ${encodeHeaderValue(mail.subject)}`);
  if (mail.inReplyTo) {
    lines.push(`In-Reply-To: ${mail.inReplyTo}`);
    lines.push(`References: ${mail.references || mail.inReplyTo}`);
  }
  lines.push("MIME-Version: 1.0");

  if (mail.html) {
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`, "");
    lines.push(`--${boundary}`, 'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "");
    lines.push(Buffer.from(mail.text, "utf8").toString("base64"));
    lines.push(`--${boundary}`, 'Content-Type: text/html; charset="UTF-8"', "Content-Transfer-Encoding: base64", "");
    lines.push(Buffer.from(mail.html, "utf8").toString("base64"));
    lines.push(`--${boundary}--`, "");
  } else {
    lines.push('Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "");
    lines.push(Buffer.from(mail.text, "utf8").toString("base64"));
  }

  return base64url(lines.join("\r\n"));
}
