/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The error log, as the shop owner sees it.
 *
 * Everything the till has had trouble with, newest first, each with the code
 * to read down the phone. The owner can see all of it — including every
 * technician session CoreOS has opened on their tablet. There is nothing on
 * this screen that is kept from them.
 *
 * The Share button is the one that matters in practice. A shopkeeper will not
 * read twenty codes out; they will paste them into WhatsApp, which is how
 * every other message in this business travels.
 */

import { useState } from "react";
import { AlertTriangle, Share2, Trash2, Wrench } from "lucide-react";
import {
  ALL_CODES,
  ISSUES,
  PRIORITY_COLOUR,
  issueText,
  type IssueCode,
} from "./issues";
import { clearLog, recordedErrors, type LoggedError } from "./report";
import { reportError } from "./reportIssue";
import { usePos } from "./store";
import { useT } from "./useT";
import { formatDateTime } from "./i18n";
import { useTechnicianScope } from "./TechnicianPanel";
import { Button } from "./ui";

/** The short text a shop pastes into WhatsApp. English, because a support
    desk reads it, and no trade in it. */
function shareText(
  tillId: string,
  shopName: string,
  rows: LoggedError[],
): string {
  const lines = [
    "CoreCashier — error log",
    `Till: ${tillId}`,
    `Shop: ${shopName}`,
    `Sent: ${new Date().toISOString()}`,
    "",
  ];
  for (const row of rows.slice(0, 20)) {
    lines.push(`${row.code ?? "—"}  ${row.at.replace("T", " ").slice(0, 19)}`);
  }
  if (rows.length === 0) lines.push("nothing recorded");
  return lines.join("\n");
}

export function ErrorLogPanel() {
  const data = usePos();
  const { t, lang } = useT();
  const [rows, setRows] = useState<LoggedError[]>(() => recordedErrors());
  const [note, setNote] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const seeDetails = useTechnicianScope("details");
  const canSimulate = useTechnicianScope("simulate");

  async function share() {
    const text = shareText(data.settings.tillId, data.settings.shopName, rows);
    try {
      await navigator.clipboard.writeText(text);
      setNote(t("log.shared"));
    } catch {
      /* Clipboard refused — common on a page opened from a file. Hand it to
         the share sheet instead, which is where it was going anyway. */
      try {
        await navigator.share?.({ text });
      } catch {
        // Both refused. The log is on screen to be read out.
      }
    }
  }

  const manual = ALL_CODES.filter((code) => ISSUES[code].manual);

  return (
    <>
      <p className="text-[13px] leading-relaxed text-[#7e87a5]">{t("log.hint")}</p>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void share()}>
          <Share2 size={16} /> {t("log.share")}
        </Button>
        {rows.length > 0 ? (
          <Button
            variant="quiet"
            onClick={() => {
              clearLog();
              setRows([]);
              setNote("");
            }}
          >
            <Trash2 size={15} /> {t("log.clear")}
          </Button>
        ) : null}
      </div>
      {note ? <p className="text-[13px] text-[#8ee7bb]">{note}</p> : null}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#232b40] px-4 py-6 text-center text-[13.5px] text-[#6b7490]">
          {t("log.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-[#141b2d] overflow-hidden rounded-xl border border-[#1e2740]">
          {rows.map((row, index) => {
            const code = row.code as IssueCode | undefined;
            const issue = code ? ISSUES[code] : undefined;
            const colour = issue ? PRIORITY_COLOUR[issue.priority] : PRIORITY_COLOUR.P3;
            const id = `${row.at}-${index}`;
            return (
              <li key={id} className="bg-[#0b1120] px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(open === id ? null : id)}
                  className="flex w-full items-center gap-3 text-start"
                >
                  <span
                    dir="ltr"
                    className="shrink-0 rounded-md px-2 py-1 font-mono text-[12.5px] font-bold"
                    style={{ backgroundColor: colour.bg, color: colour.text }}
                  >
                    {row.code ?? "·"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-[#e7eaf6]">
                      {code ? issueText(code, lang).title : row.what}
                    </span>
                    <span dir="ltr" className="block text-[12px] text-[#6b7490]">
                      {formatDateTime(row.at)}
                    </span>
                  </span>
                </button>

                {open === id ? (
                  <div className="mt-2 border-t border-[#141b2d] pt-2">
                    {code ? (
                      <p className="text-[13px] leading-relaxed text-[#98a0bb]">
                        {issueText(code, lang).body}
                      </p>
                    ) : null}
                    {/* The technical half, only with a technician key — and
                        the owner can see that the row is there either way. */}
                    {seeDetails ? (
                      <p
                        dir="ltr"
                        className="mt-2 break-words rounded-lg bg-[#05060a] p-2.5 font-mono text-[11px] leading-relaxed text-[#6b7490]"
                      >
                        {row.what}
                        {row.build ? ` · build ${row.build}` : ""}
                        {row.till ? ` · till ${row.till}` : ""}
                        {row.device ? ` · ${row.device}` : ""}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {/* Things no browser can detect, raised by the person who can see them.
          A jammed printer and a flat power bank are real support calls; the
          code is what makes them quick ones. */}
      <details className="rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3">
        <summary className="cursor-pointer text-[13.5px] font-semibold text-[#98a0bb]">
          <AlertTriangle size={14} className="inline" /> {t("log.raise")}
        </summary>
        <div className="mt-3 grid gap-2">
          {manual.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                reportError(code, "reported by the shop");
                setRows(recordedErrors());
              }}
              className="flex items-center gap-3 rounded-lg border border-[#232b40] px-3 py-2 text-start hover:border-[#3a4460]"
            >
              <span
                dir="ltr"
                className="shrink-0 font-mono text-[12.5px] font-bold"
                style={{ color: PRIORITY_COLOUR[ISSUES[code].priority].text }}
              >
                {code}
              </span>
              <span className="text-[13.5px] text-[#98a0bb]">
                {issueText(code, lang).title}
              </span>
            </button>
          ))}
        </div>
      </details>

      {/* Behind the technician key: one button per code, so every card can be
          checked on a real tablet in the shop's own language. */}
      {canSimulate ? (
        <details className="rounded-xl border border-[#4a3a1a] bg-[#140f08] px-4 py-3">
          <summary className="cursor-pointer text-[13.5px] font-semibold text-[#f0c078]">
            <Wrench size={14} className="inline" /> {t("log.simulate")}
          </summary>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ALL_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  reportError(code, `simulated from technician mode`);
                  setRows(recordedErrors());
                }}
                dir="ltr"
                className="rounded-md border border-[#3a4460] px-2 py-1.5 font-mono text-[12px] font-semibold text-[#e7eaf6] hover:border-[#6c7bf0]"
              >
                {code}
              </button>
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}
