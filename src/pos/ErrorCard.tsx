/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * What the shop sees when something goes wrong.
 *
 * The code is the biggest thing on it, because the code is the whole point:
 * the shopkeeper does not have to understand what happened, only to read six
 * characters down a phone line. Everything else on the card is there to stop
 * them needing to make that call at all — what it means in their own
 * language, and one to three things to try first.
 *
 * What is deliberately not on it: stack traces, file names, English error
 * text, and the word "error" in any technical sense. The details a
 * technician needs are behind the technician key, and in the log.
 */

import { useSyncExternalStore } from "react";
import { PhoneCall, X } from "lucide-react";
import {
  ISSUES,
  PRIORITY_COLOUR,
  issueText,
  type IssueCode,
} from "./issues";
import { currentIssue, dismissIssue, subscribeShown } from "./reportIssue";
import { useT } from "./useT";
import { useTechnicianScope } from "./TechnicianPanel";
import { Button } from "./ui";

export function useShownIssue() {
  return useSyncExternalStore(subscribeShown, currentIssue, currentIssue);
}

export function IssueBody({
  code,
  details,
  onClose,
}: {
  code: IssueCode;
  details?: string;
  onClose?: () => void;
}) {
  const { t, lang, dir } = useT();
  const issue = ISSUES[code];
  const words = issueText(code, lang);
  const colour = PRIORITY_COLOUR[issue.priority];
  const seeDetails = useTechnicianScope("details");

  return (
    <div dir={dir} className="w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            dir="ltr"
            className="font-mono text-[34px] font-bold leading-none tracking-[0.06em]"
            style={{ color: colour.text }}
          >
            {code}
          </p>
          <p className="mt-2 font-display text-[17px] font-semibold text-white">
            {words.title}
          </p>
        </div>
        <span
          dir="ltr"
          className="shrink-0 rounded-md px-2 py-1 font-mono text-[12px] font-bold"
          style={{ backgroundColor: colour.bg, color: colour.text }}
        >
          {issue.priority}
        </span>
      </div>

      <p className="mt-3 text-[14.5px] leading-relaxed text-[#c7cde0]">
        {words.body}
      </p>

      {words.steps.length > 0 ? (
        <>
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
            {t("issue.tryThis")}
          </p>
          <ol className="mt-2 space-y-1.5">
            {words.steps.map((step, index) => (
              <li
                key={step}
                className="flex gap-2.5 text-[14px] leading-relaxed text-[#98a0bb]"
              >
                <span
                  dir="ltr"
                  className="mt-0.5 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold"
                  style={{ backgroundColor: colour.bg, color: colour.text }}
                >
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </>
      ) : null}

      <p
        className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold"
        style={{ backgroundColor: colour.bg, color: colour.text }}
      >
        <PhoneCall size={15} className="shrink-0" />
        {t("issue.call")}
      </p>

      {/* Only behind a technician key, and even then the shop can see that it
          is there — nothing on this tablet is hidden from its owner. */}
      {seeDetails && details ? (
        <p
          dir="ltr"
          className="mt-3 break-words rounded-lg bg-[#05060a] p-3 font-mono text-[11.5px] leading-relaxed text-[#6b7490]"
        >
          {details}
          <br />
          {issue.note}
        </p>
      ) : null}

      {onClose ? (
        <Button variant="primary" className="mt-5 h-[48px] w-full" onClick={onClose}>
          {t("issue.close")}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * The card itself, floating over whatever was on screen.
 *
 * Over, not instead of: an error at the counter must not take the basket away
 * with it. The cashier closes the card and the sale is still there.
 */
export function ErrorCard() {
  const shown = useShownIssue();
  const { t } = useT();
  if (!shown) return null;

  const colour = PRIORITY_COLOUR[ISSUES[shown.code].priority];

  return (
    <div className="pos-noprint fixed inset-0 z-[60] flex items-end justify-center bg-[#05060a]/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        role="alertdialog"
        aria-label={shown.code}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border bg-[#0b1120] p-5 sm:rounded-2xl"
        style={{ borderColor: colour.border }}
      >
        <button
          type="button"
          onClick={dismissIssue}
          aria-label={t("issue.close")}
          className="float-end -mt-1 rounded-lg p-1.5 text-[#6b7490] hover:text-white"
        >
          <X size={18} />
        </button>
        <IssueBody code={shown.code} details={shown.details} onClose={dismissIssue} />
      </div>
    </div>
  );
}
