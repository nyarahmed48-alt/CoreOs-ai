/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One mailbox, two ways in.
 *
 * lab/gmail.ts talks to the Gmail REST API with an OAuth refresh token.
 * lab/gmail-imap.ts talks IMAP and SMTP with an app password. They export the
 * same functions, and everything above this line — lab/inbox.ts and the
 * scripts — imports from here and never learns which one answered.
 *
 * The app password wins when both are configured, on the grounds that anyone
 * who set one up did it on purpose and more recently.
 *
 * Nothing in this file is bundled into the browser build.
 */

import * as api from "./gmail";
import * as imap from "./gmail-imap";

export * from "./mail-format";
export type { GmailDraft } from "./gmail";

export type BackendName = "app-password" | "oauth" | "none";

/** Which backend the configured environment selects. */
export function backendName(): BackendName {
  if (imap.isGmailConfigured()) return "app-password";
  if (api.isGmailConfigured()) return "oauth";
  return "none";
}

/** Human-readable, for the status endpoint and the doctor. */
export function describeBackend(): string {
  switch (backendName()) {
    case "app-password":
      return "IMAP + SMTP, app password";
    case "oauth":
      return "Gmail API, OAuth refresh token";
    default:
      return "not configured";
  }
}

export const isGmailConfigured = (): boolean => backendName() !== "none";

function backend() {
  switch (backendName()) {
    case "app-password":
      return imap;
    case "oauth":
      return api;
    default:
      throw new Error(
        "No mailbox is configured. Set GMAIL_ADDRESS and GMAIL_APP_PASSWORD, or the three GOOGLE_* OAuth variables.",
      );
  }
}

/* Thin pass-throughs. Written out rather than generated so the surface each
   backend has to implement is visible in one place. */

export const searchMessages = (query: string, maxResults?: number) => backend().searchMessages(query, maxResults);
export const countMessages = (query: string, ceiling?: number) => backend().countMessages(query, ceiling);
export const getMessage = (id: string) => backend().getMessage(id);
export const getThread = (id: string) => backend().getThread(id);
export const modifyThread = (threadId: string, changes: { addLabelIds?: string[]; removeLabelIds?: string[] }) =>
  backend().modifyThread(threadId, changes);
export const ensureLabel = (name: string) => backend().ensureLabel(name);
export const createDraft = (raw: string, threadId?: string) => backend().createDraft(raw, threadId);
export const listDrafts = (query: string, maxResults?: number) => backend().listDrafts(query, maxResults);
export const getDraft = (id: string) => backend().getDraft(id);
export const sendDraft = (id: string) => backend().sendDraft(id).then(() => undefined);
export const deleteDraft = (id: string) => backend().deleteDraft(id);
export const sendRaw = (raw: string) => backend().sendRaw(raw).then(() => undefined);
export const mailboxAddress = () => backend().mailboxAddress();

/** Drops cached tokens, labels and connections in both backends. */
export function resetGmailCaches(): void {
  api.resetGmailCaches();
  imap.resetGmailCaches();
}

/**
 * Releases anything holding the process open.
 *
 * The REST backend has nothing to close. IMAP holds a socket, and a script
 * that forgets this hangs on exit rather than finishing.
 */
export async function closeMailbox(): Promise<void> {
  await imap.closeMailbox();
}
