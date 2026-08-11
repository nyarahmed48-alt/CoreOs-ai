/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reading and writing mail, with no opinion about how it gets there.
 *
 * Both mailbox backends — the Gmail REST API and IMAP/SMTP — need the same
 * things: build an RFC 822 message, pull a header out of one, find the human
 * prose inside a MIME tree. None of that depends on the transport, so it lives
 * here and neither backend owns it.
 *
 * The message shape below is the Gmail API's, kept as the common currency
 * because it was here first and lab/inbox.ts is written against it. The IMAP
 * backend fills `bodyText` directly instead of faking a MIME tree, and
 * messageText() prefers it when present.
 *
 * Nothing in this file is bundled into the browser build.
 */

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
  /**
   * Body text already extracted by the backend. The IMAP side has a real MIME
   * parser to hand and no reason to rebuild the API's payload tree just so
   * this file can walk back down it.
   */
  bodyText?: string;
}

/** Gmail's API takes and returns base64url, not standard base64. */
export function base64url(input: string | Buffer): string {
  return Buffer.from(input as any)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** The bytes behind a base64url string — what IMAP APPEND and SMTP want. */
export function fromBase64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function header(message: GmailMessage, name: string): string {
  const headers = message.payload?.headers || [];
  const match = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return match?.value || "";
}

/** The bare address out of `Jane Okafor <jane@example.com>`. */
export function parseAddress(value: string): { name: string; email: string } {
  const angled = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (angled) {
    return { name: angled[1].replace(/^"|"$/g, "").trim(), email: angled[2].trim().toLowerCase() };
  }
  return { name: "", email: value.trim().toLowerCase() };
}

/** Readable text out of an HTML body, for senders whose client sends no plain part. */
export function htmlToText(html: string): string {
  return html
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

/**
 * The readable body of a message.
 *
 * Walks the MIME tree preferring text/plain, and falls back to stripping tags
 * out of text/html. Attachments are skipped: they have a filename and we only
 * want prose.
 */
export function messageText(message: GmailMessage, limit = 6000): string {
  if (message.bodyText) return message.bodyText.slice(0, limit);

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
    if (mime === "text/plain") plain.push(fromBase64url(data).toString("utf8"));
    else if (mime === "text/html") html.push(fromBase64url(data).toString("utf8"));
  };

  walk(message.payload);

  let text = plain.join("\n").trim();
  if (!text && html.length) text = htmlToText(html.join("\n"));
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

/** Builds an RFC 822 message, base64url-encoded the way Gmail's API wants it. */
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

/** The recipients and sender an SMTP envelope needs, read back off a raw message. */
export function envelopeFromRaw(raw: Buffer | string): { from: string; to: string[] } {
  const text = typeof raw === "string" ? raw : raw.toString("utf8");
  const head = text.split(/\r?\n\r?\n/)[0] || "";
  const field = (name: string) => {
    const match = head.match(new RegExp(`^${name}:\\s*(.*(?:\\r?\\n[ \\t].*)*)$`, "im"));
    return match ? match[1].replace(/\r?\n[ \t]+/g, " ").trim() : "";
  };
  const addresses = (value: string) =>
    value
      .split(",")
      .map((part) => parseAddress(part).email)
      .filter(Boolean);

  return {
    from: parseAddress(field("From")).email,
    to: [...addresses(field("To")), ...addresses(field("Cc")), ...addresses(field("Bcc"))],
  };
}
