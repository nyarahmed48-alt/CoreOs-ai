/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The result: one code at the top, everything else underneath.
 *
 * The code is the biggest thing on the screen because it is the only thing
 * the shopkeeper has to get right. Everything below it is for them to read
 * while they wait, and for me to read when they send it.
 *
 * "Could not test" has its own section rather than being mixed in with the
 * passes. A browser that cannot see the battery is not a battery that is
 * fine, and putting the two in one list would be the exact dishonesty this
 * app is supposed to avoid.
 */

import { useState } from "react";
import { CheckCircle2, CircleHelp, Share2, TriangleAlert, XCircle } from "lucide-react";
import {
  ISSUES,
  PRIORITY_COLOUR,
  issueText,
  type IssueCode,
} from "../pos/issues";
import { Button } from "../pos/ui";
import { shareText, type Report } from "./reports";
import { say, type Lang } from "./words";

const MARK = {
  pass: { icon: CheckCircle2, colour: "#8ee7bb" },
  warn: { icon: TriangleAlert, colour: "#f0c078" },
  fail: { icon: XCircle, colour: "#f0879d" },
  untested: { icon: CircleHelp, colour: "#6b7490" },
};

export function Result({
  report,
  lang,
  nameOf,
  onAgain,
}: {
  report: Report;
  lang: Lang;
  nameOf: (id: string) => string;
  onAgain: () => void;
}) {
  const [note, setNote] = useState("");
  const main = report.main;
  const colour = main ? PRIORITY_COLOUR[ISSUES[main].priority] : PRIORITY_COLOUR.P3;
  const tested = report.lines.filter((line) => line.verdict !== "untested");
  const untested = report.lines.filter((line) => line.verdict === "untested");
  const alsoFound = report.lines
    .filter((line) => line.code && line.code !== main)
    .map((line) => line.code as IssueCode);

  async function share() {
    const text = shareText(report, nameOf);
    try {
      await navigator.clipboard.writeText(text);
      setNote(say(lang, "result.shared"));
    } catch {
      try {
        await navigator.share?.({ text });
      } catch {
        // Both refused; it is on screen to be read out.
      }
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      {main ? (
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: colour.border, backgroundColor: colour.bg }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98a0bb]">
            {say(lang, "result.main")}
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p
              dir="ltr"
              className="font-mono text-[40px] font-bold leading-none"
              style={{ color: colour.text }}
            >
              {main}
            </p>
            <span
              dir="ltr"
              className="rounded-md bg-black/30 px-2 py-1 font-mono text-[12px] font-bold"
              style={{ color: colour.text }}
            >
              {ISSUES[main].priority}
            </span>
          </div>
          <p className="mt-3 font-display text-[17px] font-semibold text-white">
            {issueText(main, lang).title}
          </p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[#c7cde0]">
            {issueText(main, lang).body}
          </p>

          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98a0bb]">
            {say(lang, "result.whatNow")}
          </p>
          <ol className="mt-2 space-y-1.5">
            {issueText(main, lang).steps.map((step, index) => (
              <li key={step} className="flex gap-2.5 text-[14px] leading-relaxed text-[#c7cde0]">
                <span
                  dir="ltr"
                  className="mt-0.5 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-black/30 text-[11.5px] font-bold"
                  style={{ color: colour.text }}
                >
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          {alsoFound.length > 0 ? (
            <p className="mt-4 text-[13px] text-[#98a0bb]">
              {say(lang, "result.alsoFound")}:{" "}
              <span dir="ltr" className="font-mono">
                {alsoFound.join(" · ")}
              </span>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#1f4034] bg-[#0d2119] p-5 text-center">
          <CheckCircle2 size={28} className="mx-auto text-[#8ee7bb]" />
          <p className="mt-3 font-display text-[18px] font-bold text-white">
            {say(lang, "result.allWell")}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[#78c9a3]">
            {say(lang, "result.allWellBody")}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button className="flex-1" onClick={() => void share()}>
          <Share2 size={16} /> {say(lang, "result.share")}
        </Button>
        <Button className="flex-1" onClick={onAgain}>
          {say(lang, "app.again")}
        </Button>
      </div>
      {note ? <p className="mt-2 text-[13px] text-[#8ee7bb]">{note}</p> : null}

      <ul className="mt-5 divide-y divide-[#141b2d] overflow-hidden rounded-xl border border-[#1e2740]">
        {tested.map((line) => {
          const mark = MARK[line.verdict];
          const Icon = mark.icon;
          return (
            <li key={line.id} className="flex items-start gap-3 bg-[#0b1120] px-4 py-3">
              <Icon size={17} className="mt-0.5 shrink-0" style={{ color: mark.colour }} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-[#e7eaf6]">
                  {nameOf(line.id)}
                  {line.code ? (
                    <span dir="ltr" className="ms-2 font-mono text-[12px]" style={{ color: mark.colour }}>
                      {line.code}
                    </span>
                  ) : null}
                </p>
                <p dir="ltr" className="mt-0.5 text-[12.5px] text-[#6b7490]">
                  {line.reading}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {untested.length > 0 ? (
        <>
          <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
            {say(lang, "result.notTested")}
          </p>
          <ul className="mt-2 divide-y divide-[#141b2d] overflow-hidden rounded-xl border border-dashed border-[#232b40]">
            {untested.map((line) => (
              <li key={line.id} className="bg-[#0a0f1c] px-4 py-2.5">
                <p className="text-[13.5px] text-[#98a0bb]">{nameOf(line.id)}</p>
                <p className="mt-0.5 text-[12.5px] text-[#6b7490]">
                  {say(lang, `why.${line.because ?? "noApi"}` as "why.noApi")}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-5 text-center text-[12px] text-[#4e576f]">
        <span dir="ltr">
          {report.tillId ? `${say(lang, "result.tillId")} ${report.tillId} · ` : ""}
          {report.device}
        </span>
      </p>
    </div>
  );
}
