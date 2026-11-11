/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Used-tablet inspection.
 *
 * For buying, not for running a shop — which is why this one half needs a
 * technician key. A shopkeeper has no reason to be here, and the questions
 * below ("can the seller prove they own it") are asked on a market stall, not
 * at a counter.
 *
 * The key must carry the `device` scope. It is checked against the session
 * CoreCashier opened, because the two share an origin: scan the key once in
 * the till and this is open too.
 *
 * Everything here is a question, because every one of these is something a
 * browser cannot see and a person can: a crack, a swollen back, whether the
 * battery really lasted yesterday, whether the account lock is off.
 */

import { useState } from "react";
import { ArrowLeft, Lock, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "../pos/ui";
import { STANDARD, STANDARD_REF } from "./standard";
import { checkHardware } from "./probes";
import { say, type Key, type Lang } from "./words";

/** Each one must be answered the right way for the tablet to pass. `wantYes`
    says which way that is. */
const QUESTIONS: { id: string; ask: Key; wantYes: boolean }[] = [
  { id: "cracks", ask: "insp.q.cracks", wantYes: false },
  { id: "dents", ask: "insp.q.dents", wantYes: false },
  { id: "battery", ask: "insp.q.battery", wantYes: true },
  { id: "reset", ask: "insp.q.reset", wantYes: true },
  { id: "proof", ask: "insp.q.proof", wantYes: true },
];

export function Inspection({
  lang,
  unlocked,
  facts,
  tillId,
  onBack,
}: {
  lang: Lang;
  unlocked: boolean;
  facts: { android: string; browser: string; screen: string };
  tillId: string;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [at, setAt] = useState(-1);
  const hardware = checkHardware();

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="rounded-2xl border border-[#4a3a1a] bg-[#140f08] p-5 text-center">
          <Lock size={24} className="mx-auto text-[#f0c078]" />
          <p className="mt-3 font-display text-[17px] font-semibold text-white">
            {say(lang, "insp.title")}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[#c8a26a]">
            {say(lang, "insp.locked")}
          </p>
        </div>
        <Button className="mt-5 w-full" onClick={onBack}>
          <ArrowLeft size={16} /> {say(lang, "app.title")}
        </Button>
      </div>
    );
  }

  const question = QUESTIONS[at];
  const finished = at >= QUESTIONS.length;

  if (finished) {
    const failedQuestions = QUESTIONS.filter(
      (one) => answers[one.id] !== one.wantYes,
    );
    /* The hardware floor counts too: a 2GB tablet in perfect condition is
       still not a tablet we can sell a till on. */
    const hardwareShort = hardware.verdict === "fail";
    const meets = failedQuestions.length === 0 && !hardwareShort;

    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <div
          className={`rounded-2xl border p-5 text-center ${
            meets
              ? "border-[#1f4034] bg-[#0d2119]"
              : "border-[#5d3346] bg-[#180f16]"
          }`}
        >
          {meets ? (
            <ShieldCheck size={28} className="mx-auto text-[#8ee7bb]" />
          ) : (
            <XCircle size={28} className="mx-auto text-[#f0879d]" />
          )}
          <p
            className={`mt-3 font-display text-[18px] font-bold ${
              meets ? "text-[#8ee7bb]" : "text-[#f0879d]"
            }`}
          >
            {say(lang, meets ? "insp.meets" : "insp.fails")}
          </p>
          <p dir="ltr" className="mt-2 text-[12.5px] text-[#6b7490]">
            {say(lang, "insp.standard", { ref: STANDARD_REF })}
          </p>
        </div>

        {!meets ? (
          <>
            <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
              {say(lang, "insp.failed")}
            </p>
            <ul className="mt-2 space-y-2">
              {hardwareShort ? (
                <li className="rounded-xl border border-[#3d2230] bg-[#180f16] px-4 py-2.5 text-[13.5px] text-[#f0a3b5]">
                  {say(lang, "check.hardware")} — <span dir="ltr">{hardware.reading}</span>
                  <span dir="ltr">
                    {" "}
                    (min {STANDARD.minimumMemoryGb} GB, {STANDARD.minimumCores} cores)
                  </span>
                </li>
              ) : null}
              {failedQuestions.map((one) => (
                <li
                  key={one.id}
                  className="rounded-xl border border-[#3d2230] bg-[#180f16] px-4 py-2.5 text-[13.5px] text-[#f0a3b5]"
                >
                  {say(lang, one.ask)}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <p dir="ltr" className="mt-5 text-center text-[12px] text-[#4e576f]">
          {tillId ? `${tillId} · ` : ""}
          {facts.android} · {facts.screen}
        </p>

        <Button className="mt-5 w-full" onClick={onBack}>
          <ArrowLeft size={16} /> {say(lang, "app.title")}
        </Button>
      </div>
    );
  }

  if (at === -1) {
    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <h2 className="font-display text-[20px] font-bold text-white">
          {say(lang, "insp.title")}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#98a0bb]">
          {say(lang, "insp.hint")}
        </p>
        <div className="mt-5 rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3">
          <p className="text-[13.5px] text-[#98a0bb]">
            {say(lang, "check.hardware")}
          </p>
          <p dir="ltr" className="mt-1 text-[13px] text-[#6b7490]">
            {hardware.verdict === "untested"
              ? say(lang, "why.noApi")
              : hardware.reading}
          </p>
        </div>
        <Button
          variant="primary"
          className="mt-5 h-[52px] w-full"
          onClick={() => setAt(0)}
        >
          {say(lang, "insp.run")}
        </Button>
        <Button variant="quiet" className="mt-3 w-full" onClick={onBack}>
          <ArrowLeft size={16} /> {say(lang, "app.title")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
        {at + 1} / {QUESTIONS.length}
      </p>
      <p className="mt-3 text-[18px] font-semibold leading-relaxed text-white">
        {say(lang, question.ask)}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          variant="primary"
          className="h-[56px]"
          onClick={() => {
            setAnswers((current) => ({ ...current, [question.id]: true }));
            setAt(at + 1);
          }}
        >
          {say(lang, "guided.yes")}
        </Button>
        <Button
          className="h-[56px]"
          onClick={() => {
            setAnswers((current) => ({ ...current, [question.id]: false }));
            setAt(at + 1);
          }}
        >
          {say(lang, "guided.no")}
        </Button>
      </div>
    </div>
  );
}
