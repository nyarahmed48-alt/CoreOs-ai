/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The tests that need a person.
 *
 * One at a time, each skippable, each with one big thing to do. A shopkeeper
 * running this is usually already annoyed and often holding a queue, so
 * nothing here asks two questions on one screen.
 *
 * Every one of these exists because no API can answer it. The browser cannot
 * see a dead patch of digitiser, a line of dead pixels, a charger that does
 * nothing, or whether a beep was audible over a shop. A person can, in about
 * ten seconds each.
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "../pos/ui";
import { beep } from "../pos/beep";
import { useWedgeScanner } from "../pos/wedge";
import { PrintError, printTestPage, rememberedPrinter } from "../pos/printer";
import { watchCharging } from "./probes";
import { say, type Key, type Lang } from "./words";
import type { Line } from "./reports";

type Done = (line: Line) => void;

/** Each guided test, in the order the screens run. */
export const GUIDED = [
  "touch",
  "colour",
  "charge",
  "scan",
  "print",
  "sound",
  "questions",
] as const;
export type GuidedId = (typeof GUIDED)[number];

function Shell({
  title,
  hint,
  onSkip,
  children,
  lang,
}: {
  title: string;
  hint: string;
  onSkip: () => void;
  children: React.ReactNode;
  lang: Lang;
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-6">
      <h2 className="font-display text-[20px] font-bold text-white">{title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#98a0bb]">{hint}</p>
      <div className="mt-5">{children}</div>
      <Button variant="quiet" className="mt-5 w-full" onClick={onSkip}>
        {say(lang, "guided.skip")}
      </Button>
    </div>
  );
}

/** Yes / no, the only shape half these answers need. */
function Choice({
  lang,
  onYes,
  onNo,
}: {
  lang: Lang;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="primary" className="h-[52px]" onClick={onYes}>
        {say(lang, "guided.yes")}
      </Button>
      <Button className="h-[52px]" onClick={onNo}>
        {say(lang, "guided.no")}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------ the touch */

/**
 * A grid of squares to tap.
 *
 * Five by eight, which on a 10-inch tablet is squares about a thumb across —
 * small enough to find a dead patch, large enough that a shopkeeper will
 * finish. The squares that never turn green are the dead ones, and their
 * count goes in the reading.
 */
function TouchTest({ lang, done }: { lang: Lang; done: Done }) {
  const COLUMNS = 5;
  const ROWS = 8;
  const total = COLUMNS * ROWS;
  const [hit, setHit] = useState<Set<number>>(new Set());

  function touch(index: number) {
    setHit((current) => {
      const next = new Set(current);
      next.add(index);
      if (next.size === total) {
        done({
          id: "touch",
          verdict: "pass",
          reading: `all ${total} squares answered`,
        });
      }
      return next;
    });
  }

  return (
    <Shell
      lang={lang}
      title={say(lang, "touch.title")}
      hint={say(lang, "touch.hint")}
      onSkip={() =>
        done({
          id: "touch",
          verdict: hit.size === 0 ? "untested" : "fail",
          reading: `${total - hit.size} of ${total} squares did not answer`,
          because: hit.size === 0 ? "skipped" : undefined,
          code: hit.size === 0 ? undefined : "TB-03",
        })
      }
    >
      <p className="mb-3 text-center text-[14px] font-semibold text-[#f0c078]">
        {say(lang, "touch.left", { n: total - hit.size })}
      </p>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: total }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`square ${index + 1}`}
            onPointerDown={() => touch(index)}
            className={`aspect-square rounded-lg border transition-colors ${
              hit.has(index)
                ? "border-[#1f4034] bg-[#2ba36b]"
                : "border-[#232b40] bg-[#111830]"
            }`}
          />
        ))}
      </div>
    </Shell>
  );
}

/* ----------------------------------------------------------- the screen */

const COLOURS = ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000"];

function ColourTest({ lang, done }: { lang: Lang; done: Done }) {
  const [showing, setShowing] = useState(-1);

  if (showing >= 0 && showing < COLOURS.length) {
    return (
      <button
        type="button"
        onClick={() => setShowing(showing + 1)}
        className="fixed inset-0 z-50 flex items-end justify-center pb-10"
        style={{ backgroundColor: COLOURS[showing] }}
      >
        <span className="rounded-lg bg-black/50 px-3 py-1.5 text-[13px] text-white">
          {say(lang, "colour.tap")}
        </span>
      </button>
    );
  }

  return (
    <Shell
      lang={lang}
      title={say(lang, "colour.title")}
      hint={say(lang, "colour.hint")}
      onSkip={() =>
        done({ id: "colour", verdict: "untested", reading: "—", because: "skipped" })
      }
    >
      {showing === -1 ? (
        <Button variant="primary" className="h-[52px] w-full" onClick={() => setShowing(0)}>
          {say(lang, "colour.start")}
        </Button>
      ) : (
        <>
          <p className="mb-3 text-[15px] font-semibold text-white">
            {say(lang, "colour.ask")}
          </p>
          <Choice
            lang={lang}
            onYes={() =>
              done({
                id: "colour",
                verdict: "fail",
                reading: "spots or lines on the screen",
                code: "TB-03",
              })
            }
            onNo={() =>
              done({ id: "colour", verdict: "pass", reading: "screen looks clean" })
            }
          />
        </>
      )}
    </Shell>
  );
}

/* ---------------------------------------------------------- the charger */

function ChargeTest({ lang, done }: { lang: Lang; done: Done }) {
  const [waiting, setWaiting] = useState(false);
  const [left, setLeft] = useState(20);
  const [failed, setFailed] = useState(false);

  async function start() {
    setWaiting(true);
    const answer = await watchCharging(20, setLeft);
    setWaiting(false);
    if (answer === "untested") {
      done({ id: "charge", verdict: "untested", reading: "—", because: "noApi" });
      return;
    }
    if (answer === "charging") {
      done({ id: "charge", verdict: "pass", reading: "the tablet started charging" });
      return;
    }
    /* It did not start. Whether that is the tablet or the charger is the one
       thing the person can tell us and the tablet cannot. */
    setFailed(true);
  }

  return (
    <Shell
      lang={lang}
      title={say(lang, "charge.title")}
      hint={say(lang, "charge.hint")}
      onSkip={() =>
        done({ id: "charge", verdict: "untested", reading: "—", because: "skipped" })
      }
    >
      {failed ? (
        <>
          <p className="mb-3 text-[15px] font-semibold text-[#f0879d]">
            {say(lang, "charge.none")}
          </p>
          <p className="mb-3 text-[14px] text-[#98a0bb]">{say(lang, "charge.other")}</p>
          <Choice
            lang={lang}
            onYes={() =>
              done({
                id: "charge",
                verdict: "fail",
                reading: "another device charges from the same charger — the tablet does not",
                code: "TB-02",
              })
            }
            onNo={() =>
              done({
                id: "charge",
                verdict: "fail",
                reading: "the charger does not charge anything",
                code: "AC-05",
              })
            }
          />
        </>
      ) : waiting ? (
        <p className="text-center text-[16px] font-semibold text-[#f0c078]">
          {say(lang, "charge.waiting", { n: left })}
        </p>
      ) : (
        <Button variant="primary" className="h-[52px] w-full" onClick={() => void start()}>
          {say(lang, "charge.start")}
        </Button>
      )}
    </Shell>
  );
}

/* ---------------------------------------------------------- the scanner */

function ScanTest({ lang, done }: { lang: Lang; done: Done }) {
  const [left, setLeft] = useState(15);
  const settled = useRef(false);

  /* The same wedge listener the till uses, so what passes here is what will
     work at the counter — not a text box that any keyboard could satisfy. */
  useWedgeScanner({
    enabled: true,
    onScan: (code, info) => {
      if (settled.current) return;
      settled.current = true;
      done({
        id: "scan",
        verdict: "pass",
        reading: `read ${code.length} characters in ${Math.round(info.ms)}ms, ${info.suffix} at the end`,
      });
    },
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          if (!settled.current) {
            settled.current = true;
            done({
              id: "scan",
              verdict: "fail",
              reading: "nothing was scanned in 15 seconds",
              code: rememberedPrinter() ? "AC-04" : "AC-01",
            });
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // Once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Shell
      lang={lang}
      title={say(lang, "scan.title")}
      hint={say(lang, "scan.hint")}
      onSkip={() => {
        settled.current = true;
        done({ id: "scan", verdict: "untested", reading: "—", because: "skipped" });
      }}
    >
      <p className="text-center text-[16px] font-semibold text-[#f0c078]">
        {say(lang, "scan.waiting", { n: left })}
      </p>
    </Shell>
  );
}

/* ---------------------------------------------------------- the printer */

function PrintTest({
  lang,
  done,
  settings,
}: {
  lang: Lang;
  done: Done;
  settings: { tillId: string; shopName: string; lang: Lang };
}) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      await printTestPage(
        {
          lang: settings.lang,
          shopName: settings.shopName || "CoreOS",
          tillId: settings.tillId,
        } as never,
        58,
      );
      setSent(true);
    } catch (problem) {
      const fault = problem instanceof PrintError ? problem.fault : "lost";
      if (fault === "cancelled") {
        done({ id: "print", verdict: "untested", reading: "—", because: "skipped" });
        return;
      }
      done({
        id: "print",
        verdict: "fail",
        reading: `printer: ${fault}`,
        code: fault === "noChannel" ? "AC-04" : "AC-02",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      lang={lang}
      title={say(lang, "print.title")}
      hint={say(lang, "print.hint")}
      onSkip={() =>
        done({ id: "print", verdict: "untested", reading: "—", because: "skipped" })
      }
    >
      {sent ? (
        <>
          <p className="mb-3 text-[15px] font-semibold text-white">
            {say(lang, "print.ask")}
          </p>
          <div className="grid gap-2">
            <Button
              variant="primary"
              className="h-[48px]"
              onClick={() =>
                done({ id: "print", verdict: "pass", reading: "printed clearly" })
              }
            >
              {say(lang, "print.clear")}
            </Button>
            <Button
              className="h-[48px]"
              onClick={() =>
                done({
                  id: "print",
                  verdict: "warn",
                  reading: "printed faded, or the paper jammed",
                  code: "AC-03",
                })
              }
            >
              {say(lang, "print.faded")}
            </Button>
            <Button
              className="h-[48px]"
              onClick={() =>
                done({
                  id: "print",
                  verdict: "fail",
                  reading: "nothing came out",
                  code: "AC-02",
                })
              }
            >
              {say(lang, "print.nothing")}
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="primary"
          className="h-[52px] w-full"
          disabled={busy}
          onClick={() => void send()}
        >
          {say(lang, "print.send")}
        </Button>
      )}
    </Shell>
  );
}

/* ----------------------------------------------------------- the beeper */

function SoundTest({ lang, done }: { lang: Lang; done: Done }) {
  const [played, setPlayed] = useState(false);
  return (
    <Shell
      lang={lang}
      title={say(lang, "sound.title")}
      hint={say(lang, "sound.hint")}
      onSkip={() =>
        done({ id: "sound", verdict: "untested", reading: "—", because: "skipped" })
      }
    >
      {played ? (
        <>
          <p className="mb-3 text-[15px] font-semibold text-white">
            {say(lang, "sound.ask")}
          </p>
          <Choice
            lang={lang}
            onYes={() => done({ id: "sound", verdict: "pass", reading: "the beep was heard" })}
            onNo={() =>
              done({
                id: "sound",
                verdict: "fail",
                reading: "the beep could not be heard",
                code: "TB-09",
              })
            }
          />
        </>
      ) : (
        <Button
          variant="primary"
          className="h-[52px] w-full"
          onClick={() => {
            beep();
            setPlayed(true);
          }}
        >
          {say(lang, "sound.play")}
        </Button>
      )}
    </Shell>
  );
}

/* --------------------------------------------------------- the questions */

const QUESTIONS: { id: string; ask: Key; code: "TB-06" | "TB-07" | "TB-01"; reading: string }[] = [
  { id: "hot", ask: "ask.hot", code: "TB-06", reading: "the shop says it gets very hot" },
  { id: "dropped", ask: "ask.dropped", code: "TB-07", reading: "the shop says it was dropped or got wet" },
  { id: "offs", ask: "ask.offs", code: "TB-01", reading: "the shop says it turns itself off" },
];

function Questions({ lang, done }: { lang: Lang; done: Done }) {
  const [at, setAt] = useState(0);
  const question = QUESTIONS[at];

  function answer(yes: boolean) {
    done(
      yes
        ? {
            id: question.id,
            verdict: "fail",
            reading: question.reading,
            code: question.code,
          }
        : { id: question.id, verdict: "pass", reading: "no" },
    );
    setAt((current) => current + 1);
  }

  if (!question) return null;

  return (
    <Shell
      lang={lang}
      title={say(lang, "ask.title")}
      hint=""
      onSkip={() => {
        for (const left of QUESTIONS.slice(at)) {
          done({ id: left.id, verdict: "untested", reading: "—", because: "skipped" });
        }
        setAt(QUESTIONS.length);
      }}
    >
      <p className="mb-4 text-[17px] font-semibold leading-relaxed text-white">
        {say(lang, question.ask)}
      </p>
      <Choice lang={lang} onYes={() => answer(true)} onNo={() => answer(false)} />
    </Shell>
  );
}

/* ------------------------------------------------------------- the host */

export function GuidedTest({
  which,
  lang,
  done,
  settings,
}: {
  which: GuidedId;
  lang: Lang;
  done: Done;
  settings: { tillId: string; shopName: string; lang: Lang };
}) {
  if (which === "touch") return <TouchTest lang={lang} done={done} />;
  if (which === "colour") return <ColourTest lang={lang} done={done} />;
  if (which === "charge") return <ChargeTest lang={lang} done={done} />;
  if (which === "scan") return <ScanTest lang={lang} done={done} />;
  if (which === "print") return <PrintTest lang={lang} done={done} settings={settings} />;
  if (which === "sound") return <SoundTest lang={lang} done={done} />;
  return <Questions lang={lang} done={done} />;
}
