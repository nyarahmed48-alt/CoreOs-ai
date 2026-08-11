/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Checks the responder against your actual mailbox.
 *
 *   npm run inbox:doctor
 *
 * The self-test (npm run inbox:test) proves the decision logic with a fake
 * Gmail. This proves the other half: that your credentials work, that your
 * account allows what the responder needs, and that each operation behaves the
 * way the code assumes. A fake can only ever confirm my understanding of Gmail
 * — this confirms Gmail.
 *
 * It is safe to run. Everything it creates, it removes; the only message it
 * sends goes to you, and it never touches mail you have received.
 */

import dotenv from "dotenv";
import {
  backendName,
  buildRaw,
  closeMailbox,
  countMessages,
  createDraft,
  deleteDraft,
  describeBackend,
  ensureLabel,
  getDraft,
  listDrafts,
  mailboxAddress,
  messageText,
  searchMessages,
  sendRaw,
} from "../lab/mailbox";
import { LABELS, inboxSettings } from "../lab/inbox";
import { isConfigured } from "../lab/agents";

dotenv.config({ path: ".env.local" });
dotenv.config();

let failed = 0;
let ran = 0;

/** Runs one check, printing the outcome and never throwing. */
async function check<T>(label: string, run: () => Promise<T>): Promise<T | null> {
  ran++;
  process.stdout.write(`  ${label} … `);
  try {
    const value = await run();
    console.log("ok" + (typeof value === "string" && value ? ` — ${value}` : ""));
    return value as T;
  } catch (err: any) {
    failed++;
    console.log("FAILED");
    console.log(`      ${String(err?.message || err).split("\n").join("\n      ")}`);
    return null;
  }
}

async function main() {
  console.log("\nCoreOs inbox responder — checking against the real mailbox\n");

  /* ----------------------------------------------------------- configured */

  if (backendName() === "none") {
    console.error("No mailbox is configured.\n");
    console.error("  Either:  GMAIL_ADDRESS + GMAIL_APP_PASSWORD");
    console.error("      or:  GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN\n");
    console.error("Put them in .env.local. See README → The inbox responder.\n");
    process.exit(1);
  }

  console.log(`  backend: ${describeBackend()}`);
  if (!isConfigured()) {
    console.log("  note:    OPENROUTER_API_KEY / OPENROUTER_MODEL are not set — mailbox checks will");
    console.log("           still run, but the responder cannot draft replies without them.");
  }
  console.log("");

  /* ---------------------------------------------------------- the basics */

  const address = await check("signing in", async () => mailboxAddress());
  if (!address) {
    // Every check below reconnects, so without this the run becomes a slow
    // parade of the same failure.
    console.log("\nCan't continue without a working login. Nothing else was tried.\n");
    await closeMailbox().catch(() => undefined);
    process.exit(1);
  }

  await check("reading the inbox", async () => {
    const recent = await searchMessages("in:inbox newer_than:7d", 5);
    return `${recent.length} message${recent.length === 1 ? "" : "s"} in the last 7 days`;
  });

  await check("running a Gmail search query", async () => {
    // The triage queries lean on Gmail's own syntax. If X-GM-RAW is missing or
    // the operators behave differently, better to find out here.
    const count = await countMessages("in:inbox -in:chats newer_than:1d", 25);
    return `${count} matched`;
  });

  /* ---------------------------------------------------------- the labels */

  for (const [role, name] of Object.entries(LABELS)) {
    await check(`label ${name}`, async () => {
      await ensureLabel(name);
      return role === "off" ? "created if missing — apply this one yourself" : "created if missing";
    });
  }

  /* ------------------------------------------ a draft, made and unmade */

  const marker = `coreos-doctor-${Date.now()}`;
  const draftId = await check("creating a draft", async () => {
    const raw = buildRaw({
      to: address,
      subject: `CoreOs responder check (${marker})`,
      text: "This draft was created by npm run inbox:doctor and is about to be deleted.",
    });
    const draft = await createDraft(raw);
    if (!draft?.id) throw new Error("no draft id came back");
    return draft.id;
  });

  if (draftId) {
    await check("reading the draft back", async () => {
      const draft = await getDraft(draftId);
      const body = draft.message ? messageText(draft.message) : "";
      if (!body.includes("about to be deleted")) {
        throw new Error("the draft came back without the body that was written to it");
      }
      return "body matches";
    });

    await check("finding it in the drafts list", async () => {
      const drafts = await listDrafts("", 25);
      if (!drafts.some((d) => d.id === draftId)) {
        // The hold window depends on this: a pending draft that cannot be
        // found again is a reply that will never send.
        throw new Error("the draft was not in the list — the hold window would not work");
      }
      return `${drafts.length} draft${drafts.length === 1 ? "" : "s"} in the mailbox`;
    });

    await check("deleting the draft", async () => {
      await deleteDraft(draftId);
      const drafts = await listDrafts("", 25);
      if (drafts.some((d) => d.id === draftId)) throw new Error("the draft is still there after deleting it");
      return "gone";
    });
  }

  /* ------------------------------------------------------------- sending */

  const owner = inboxSettings().owner || address;
  await check(`sending a test email to ${owner}`, async () => {
    await sendRaw(
      buildRaw({
        to: owner,
        subject: "CoreOs responder — setup check passed",
        text: [
          "This is the CoreOs inbox responder checking that it can send.",
          "",
          "If you are reading this, the mailbox side of the setup works: it can",
          "sign in, read your inbox, manage its labels, write drafts and send.",
          "",
          "Notifications about pending auto-replies will arrive here, and each one",
          "will show you the full draft before anything goes to a customer.",
          "",
          "Nothing else was changed in your mailbox.",
        ].join("\n"),
      }),
    );
    return "check your inbox";
  });

  await closeMailbox();

  /* ---------------------------------------------------------------- done */

  console.log(`\n${"─".repeat(60)}`);
  if (failed) {
    console.log(`${ran - failed} of ${ran} checks passed, ${failed} failed.\n`);
    console.log("The responder is not ready. Fix the failures above and run this again.\n");
    process.exit(1);
  }

  const settings = inboxSettings();
  console.log(`All ${ran} checks passed. The mailbox side is ready.\n`);
  console.log(`  autosend:  ${settings.autoSend ? `on — replies send ${settings.holdMinutes} minutes after notifying you` : "OFF — it will draft and notify, but never send"}`);
  console.log(`  daily cap: ${settings.maxPerDay}`);
  console.log(`  notifies:  ${owner}`);
  console.log(`\nNext: npm run inbox:scan — one real cycle, printed as it decides.\n`);
}

main().catch(async (err) => {
  console.error("\nThe doctor itself fell over:", err?.message || err);
  await closeMailbox().catch(() => undefined);
  process.exit(1);
});
