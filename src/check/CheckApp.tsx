/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CoreOS Device Check.
 *
 * A separate app on purpose. It is the thing to open when CoreCashier will
 * not, so it imports none of the till's state: no store, no boot, no licence,
 * no cloud. The only thing it borrows is the issue registry, because the
 * whole point is to hand back a code the support desk already knows, and a
 * read-only peek at the Till ID that is allowed to fail.
 *
 * Open to anyone. A shopkeeper can run the whole of Parts A to C alone and
 * read me one code down the phone — that is the entire design brief, and
 * putting any of it behind a key would defeat it. Only the used-tablet
 * inspection needs a technician key, because that one is for buying, not for
 * running a shop.
 */

import { useEffect, useMemo, useState } from "react";
import { Activity, ShieldCheck } from "lucide-react";
import { ISSUES, type IssueCode } from "../pos/issues";
import { LANGS } from "../pos/i18n";
import { Button } from "../pos/ui";
import { can } from "../pos/technician";
import {
  checkBattery,
  checkBluetooth,
  checkHardware,
  checkNetwork,
  checkStorage,
  deviceFacts,
  type Result as Probe,
} from "./probes";
import { runSpeed } from "./bench";
import {
  checkApis,
  checkBrowser,
  checkClock,
  checkPersistence,
  checkStorageSpeed,
  checkTill,
} from "./software";
import {
  checkMultiTouch,
  checkRefresh,
  checkScreen,
  checkTextScale,
} from "./display";
import { findShopName, findTillId } from "./tillId";
import { keep, mainCode, saved, type Line, type Report } from "./reports";
import { GUIDED, GuidedTest, type GuidedId } from "./Guided";
import { Result } from "./Result";
import { Inspection } from "./Inspection";
import { dirOf, say, type Key, type Lang } from "./words";

type Stage = "idle" | "running" | "guided" | "result" | "inspection";

/** The screen's own name for each line of the report. */
const NAMES: Record<string, Key> = {
  apis: "check.apis",
  browser: "check.browser",
  persist: "check.persist",
  diskspeed: "check.diskspeed",
  clock: "check.clock",
  till: "check.till",
  refresh: "check.refresh",
  screen: "check.screen",
  multitouch: "check.multitouch",
  textscale: "check.textscale",
  battery: "check.battery",
  network: "check.network",
  bluetooth: "check.bluetooth",
  storage: "check.storage",
  hardware: "check.hardware",
  speed: "check.speed",
  touch: "touch.title",
  colour: "colour.title",
  charge: "charge.title",
  scan: "scan.title",
  print: "print.title",
  sound: "sound.title",
  hot: "ask.hot",
  dropped: "ask.dropped",
  offs: "ask.offs",
};

export default function CheckApp() {
  const [lang, setLang] = useState<Lang>("ar");
  const [stage, setStage] = useState<Stage>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [step, setStep] = useState(0);
  const [guidedAt, setGuidedAt] = useState(0);
  const [till, setTill] = useState({ tillId: "", shopName: "" });
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<Report[]>(() => saved());

  const dir = dirOf(lang);
  const facts = useMemo(() => deviceFacts(), []);

  /* Best effort, and never waited on: if CoreCashier's database is broken —
     which is a very good reason to be running this — the check still runs,
     just without a till number on the report. */
  useEffect(() => {
    void (async () => {
      const [tillId, shopName] = await Promise.all([findTillId(), findShopName()]);
      setTill({ tillId, shopName });
    })();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const nameOf = (id: string) =>
    NAMES[id] ? say(lang, NAMES[id]) : id;

  async function runAutomatic() {
    setStage("running");
    setLines([]);
    setStep(0);
    const found: Probe[] = [];
    /* Software first. If the till cannot run on this tablet at all — no
       secure crypto, a browser three years out of date — that is the answer,
       and finding it before a two-minute speed test is the difference
       between a useful tool and a slow one. */
    const steps: (() => Promise<Probe> | Probe)[] = [
      checkApis,
      checkBrowser,
      checkPersistence,
      checkTill,
      checkScreen,
      checkMultiTouch,
      checkTextScale,
      checkBattery,
      checkNetwork,
      checkClock,
      checkBluetooth,
      checkStorage,
      checkHardware,
      checkRefresh,
      checkStorageSpeed,
      runSpeed,
    ];
    for (const run of steps) {
      found.push(await run());
      setStep(found.length);
      setLines([...found]);
    }
    setGuidedAt(0);
    setStage("guided");
  }

  function finishGuided(all: Line[]) {
    const made: Report = {
      at: new Date().toISOString(),
      tillId: till.tillId,
      shopName: till.shopName,
      device: `${facts.android}, ${facts.browser}, ${facts.screen}`,
      main: mainCode(all, (code: IssueCode) => ISSUES[code].priority),
      lines: all,
    };
    setReport(made);
    setHistory(keep(made));
    setStage("result");
  }

  function guidedDone(line: Line) {
    setLines((current) => {
      const next = [...current.filter((one) => one.id !== line.id), line];
      /* The questions screen answers three in a row from one component, so
         the next step is taken only once that screen says it is finished. */
      return next;
    });
    if (line.id === "offs" || guidedAt >= GUIDED.length - 1) {
      /* Last of the lot. Read the newest list rather than the captured one. */
      setLines((current) => {
        const all = [...current.filter((one) => one.id !== line.id), line];
        window.setTimeout(() => finishGuided(all), 0);
        return all;
      });
      return;
    }
    if (line.id === "hot" || line.id === "dropped") return; // same screen
    setGuidedAt((current) => current + 1);
  }

  function skipRest() {
    const all = [...lines];
    for (const id of GUIDED.slice(guidedAt)) {
      const ids = id === "questions" ? ["hot", "dropped", "offs"] : [id];
      for (const one of ids) {
        if (!all.some((line) => line.id === one)) {
          all.push({ id: one, verdict: "untested", reading: "—", because: "skipped" });
        }
      }
    }
    finishGuided(all);
  }

  return (
    <div
      dir={dir}
      lang={lang}
      className="min-h-[100dvh] bg-[#05060a] text-[#e7eaf6]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[#1b2337] px-4 py-3">
        <span className="flex items-center gap-2">
          <Activity size={18} className="text-[#6c7bf0]" />
          <span className="font-display text-[15.5px] font-semibold text-white">
            {say(lang, "app.title")}
          </span>
        </span>
        <div className="flex items-center gap-0.5 rounded-lg border border-[#1e2740] p-0.5">
          {LANGS.map((option) => (
            <button
              key={option.id}
              type="button"
              lang={option.id}
              onClick={() => setLang(option.id)}
              aria-pressed={lang === option.id}
              className={`rounded-md px-2 py-1 text-[12px] font-semibold ${
                lang === option.id
                  ? "bg-[#6c7bf0]/20 text-[#c6ccff]"
                  : "text-[#6b7490] hover:text-white"
              }`}
            >
              {option.id === "en" ? "EN" : option.name}
            </button>
          ))}
        </div>
      </header>

      {stage === "idle" ? (
        <div className="mx-auto max-w-md px-5 py-8">
          <p className="text-[14.5px] leading-relaxed text-[#98a0bb]">
            {say(lang, "app.what")}
          </p>
          <Button
            variant="primary"
            className="mt-6 h-[56px] w-full text-[16px]"
            onClick={() => void runAutomatic()}
          >
            {say(lang, "app.start")}
          </Button>

          <p dir="ltr" className="mt-6 text-center text-[12px] text-[#4e576f]">
            {till.tillId ? `${say(lang, "result.tillId")} ${till.tillId} · ` : ""}
            {facts.android} · {facts.browser} · {facts.screen}
          </p>

          <button
            type="button"
            onClick={() => setStage("inspection")}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-[#232b40] px-4 py-3 text-[13.5px] font-semibold text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
          >
            <ShieldCheck size={15} /> {say(lang, "insp.title")}
          </button>

          {history.length > 0 ? (
            <>
              <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
                {say(lang, "result.history")}
              </p>
              <ul className="mt-2 divide-y divide-[#141b2d] overflow-hidden rounded-xl border border-[#1e2740]">
                {history.map((one) => (
                  <li
                    key={one.at}
                    className="flex items-center gap-3 bg-[#0b1120] px-4 py-2.5"
                  >
                    <span
                      dir="ltr"
                      className="shrink-0 font-mono text-[12.5px] font-bold text-[#98a0bb]"
                    >
                      {one.main ?? "OK"}
                    </span>
                    <span dir="ltr" className="text-[12.5px] text-[#6b7490]">
                      {one.at.replace("T", " ").slice(0, 16)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      {stage === "running" ? (
        <div className="mx-auto max-w-md px-5 py-10 text-center">
          <p className="font-display text-[18px] font-semibold text-white">
            {say(lang, "app.running")}
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#111830]">
            <div
              className="h-full bg-[#6c7bf0] transition-all duration-300"
              style={{ width: `${(step / 16) * 100}%` }}
            />
          </div>
          <ul className="mt-5 space-y-1.5 text-start">
            {lines.map((line) => (
              <li key={line.id} className="text-[13.5px] text-[#98a0bb]">
                {nameOf(line.id)} — {line.verdict === "untested" ? say(lang, "v.untested") : line.reading}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {stage === "guided" ? (
        <>
          <GuidedTest
            which={GUIDED[guidedAt] as GuidedId}
            lang={lang}
            done={guidedDone}
            settings={{ tillId: till.tillId, shopName: till.shopName, lang }}
          />
          <div className="mx-auto max-w-md px-5 pb-8">
            <button
              type="button"
              onClick={skipRest}
              className="w-full text-center text-[13px] text-[#6b7490] underline"
            >
              {say(lang, "app.skipAll")}
            </button>
          </div>
        </>
      ) : null}

      {stage === "result" && report ? (
        <Result
          report={report}
          lang={lang}
          nameOf={nameOf}
          onAgain={() => setStage("idle")}
        />
      ) : null}

      {stage === "inspection" ? (
        <Inspection
          lang={lang}
          unlocked={can("device")}
          facts={facts}
          tillId={till.tillId}
          onBack={() => setStage("idle")}
        />
      ) : null}
    </div>
  );
}
