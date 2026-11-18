/**
 * LUNAR COMMAND — application shell.
 * Mounted at /lunar by src/Root.tsx (lazy-loaded so the main site never downloads it).
 */
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  Building2,
  ClipboardList,
  Droplets,
  FastForward,
  FileText,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  SkipForward,
  Users,
  Wind,
  Zap,
  AlertTriangle,
  Save,
} from "lucide-react";
import "./lunar.css";
import { getScenario } from "./engine/scenarios";
import type { FacilityId } from "./engine/types";
import { useMission } from "./state/useMission";
import { EventDecision } from "./ui/components/EventDecision";
import { Modal } from "./ui/components/Modal";
import { StatusBadge } from "./ui/components/Status";
import { metLong } from "./ui/format";
import { Onboarding } from "./ui/Onboarding";
import { missionLevel, stationClock } from "./ui/selectors";
import { Setup } from "./ui/Setup";
import { Base } from "./ui/views/Base";
import { Crew } from "./ui/views/Crew";
import { Dashboard } from "./ui/views/Dashboard";
import { Events } from "./ui/views/Events";
import { FoodWater } from "./ui/views/FoodWater";
import { LifeSupport } from "./ui/views/LifeSupport";
import { Objectives } from "./ui/views/Objectives";
import { Power } from "./ui/views/Power";
import { Report } from "./ui/views/Report";
import { Resources } from "./ui/views/Resources";
import { Science } from "./ui/views/Science";
import { Timeline } from "./ui/views/Timeline";
import type { ViewId } from "./ui/views/types";

const NAV: { id: ViewId; label: string; icon: typeof Gauge }[] = [
  { id: "dashboard", label: "Mission Control", icon: LayoutDashboard },
  { id: "base", label: "Base", icon: Building2 },
  { id: "resources", label: "Resources", icon: Gauge },
  { id: "lifesupport", label: "Life Support", icon: Wind },
  { id: "power", label: "Power", icon: Zap },
  { id: "foodwater", label: "Food & Water", icon: Droplets },
  { id: "crew", label: "Crew", icon: Users },
  { id: "events", label: "Events", icon: Activity },
  { id: "objectives", label: "Objectives", icon: ListChecks },
  { id: "timeline", label: "Timeline", icon: ClipboardList },
  { id: "science", label: "Science & Sources", icon: BookOpen },
];

export default function LunarApp() {
  const api = useMission();
  const { state: s, settings, setSettings, running, setRunning, dispatch, blocked } = api;
  const [view, setView] = useState<ViewId>("dashboard");
  const [facility, setFacility] = useState<FacilityId | null>(null);
  const [showIntro, setShowIntro] = useState(() => !settings.onboardingDone);
  const [eventHiddenFor, setEventHiddenFor] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Page chrome: dark background, title, LTR — restored on leaving /lunar.
  useEffect(() => {
    const prev = { title: document.title, bg: document.body.style.background, dir: document.documentElement.dir, lang: document.documentElement.lang };
    document.title = "Lunar Command — lunar base mission simulator";
    document.body.style.background = "#04060b";
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
    return () => {
      document.title = prev.title;
      document.body.style.background = prev.bg;
      document.documentElement.dir = prev.dir;
      document.documentElement.lang = prev.lang;
    };
  }, []);

  const go = useCallback((v: ViewId, f?: FacilityId) => {
    setView(v);
    if (f) setFacility(f);
    window.scrollTo({ top: 0 });
  }, []);

  const ended = s?.status === "ended";
  useEffect(() => {
    if (ended) setView("report");
  }, [ended]);

  // Keyboard: Space = run/pause, "." = +1 h (ignored while typing or inside dialogs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A"].includes(t.tagName) || t.closest("[role=dialog]") || t.getAttribute("role") === "button") return;
      if (!s || ended) return;
      if (e.code === "Space") {
        e.preventDefault();
        setRunning((r) => !r);
      } else if (e.key === ".") {
        dispatch({ type: "advance", hours: 1 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s, ended, dispatch, setRunning]);

  const closeIntro = useCallback(() => {
    setShowIntro(false);
    setSettings({ onboardingDone: true });
  }, [setSettings]);

  if (!s) {
    return (
      <div className="lc-root min-h-[100dvh]" dir="ltr" lang="en">
        <Setup
          onStart={(id) => {
            api.startMission(id);
            setView("dashboard");
            setFacility(null);
          }}
          loadIssue={api.loadIssue}
          onDismissIssue={api.dismissLoadIssue}
          onShowIntro={() => setShowIntro(true)}
        />
        {showIntro && <Onboarding onClose={closeIntro} />}
      </div>
    );
  }

  const sc = getScenario(s.scenarioId);
  const lvl = missionLevel(s);
  const showEventModal = !!s.pendingEvent && eventHiddenFor !== s.pendingEvent.triggeredHour && view !== "events" && !ended;
  const viewProps = { s, api, go };

  return (
    <div className="lc-root min-h-[100dvh]" dir="ltr" lang="en">
      <a href="#lc-main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-lc-panel2 focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-lc-line bg-[#04060b]/92 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 lg:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-lc-line2 bg-[#0b1322] text-lc-cyan" aria-hidden>
              <Moon size={16} />
            </span>
            <div className="leading-tight">
              <div className="font-display text-[14px] font-bold tracking-[0.18em] text-lc-text">LUNAR COMMAND</div>
              <div className="lc-mono text-[10.5px] text-lc-mute">
                {sc.codename} · {sc.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:ml-2">
            <div className="leading-tight">
              <div className="lc-mono text-[13.5px] text-lc-text" aria-label="Mission elapsed time">
                {metLong(s.hour)}
              </div>
              <div className="lc-mono text-[10.5px] text-lc-mute">
                Station {stationClock(s.hour)} · Day {Math.floor(s.hour / 24) + 1}/{sc.durationHours / 24}
              </div>
            </div>
            <StatusBadge level={lvl} pulse />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1.5" role="group" aria-label="Simulation controls">
            <button
              type="button"
              className={`lc-btn ${running ? "" : "lc-btn-primary"}`}
              onClick={() => setRunning(!running)}
              disabled={ended}
              aria-pressed={running}
              title="Run / pause (Space)"
            >
              {running ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
              <span>{running ? (blocked ? "Waiting" : "Pause") : "Run"}</span>
            </button>
            <label className="sr-only" htmlFor="lc-speed">
              Simulation speed
            </label>
            <select id="lc-speed" value={settings.speed} onChange={(e) => setSettings({ speed: Number(e.target.value) as 1 | 2 | 4 })} className="lc-btn !px-2 lc-mono" title="Speed: simulated hours per 2 seconds">
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={4}>4×</option>
            </select>
            <button type="button" className="lc-btn" disabled={ended} onClick={() => dispatch({ type: "advance", hours: 1 })} title="Advance one hour (.)" aria-label="Advance one hour">
              <SkipForward size={15} aria-hidden /> 1 h
            </button>
            <button type="button" className="lc-btn" disabled={ended} onClick={() => dispatch({ type: "advance", hours: 24 })} title="Advance one day (stops at new events)" aria-label="Advance one day">
              <FastForward size={15} aria-hidden /> 1 day
            </button>
            <span className="mx-1 hidden h-6 w-px bg-lc-line sm:block" aria-hidden />
            <button type="button" className="lc-btn !px-2.5" onClick={() => setShowIntro(true)} aria-label="Show briefing">
              <HelpCircle size={15} />
            </button>
            <button type="button" className="lc-btn !px-2.5" onClick={() => setShowSettings(true)} aria-label="Settings">
              <SettingsIcon size={15} />
            </button>
            <button type="button" className="lc-btn !px-2.5" onClick={() => setConfirmReset(true)} aria-label="Restart mission">
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Tablet / mobile navigation */}
        <nav className="lc-scroll flex gap-1 overflow-x-auto border-t border-lc-line px-3 py-1.5 lg:hidden" aria-label="Sections">
          {[...NAV, ...(ended ? [{ id: "report" as ViewId, label: "Report", icon: FileText }] : [])].map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => go(n.id)}
              aria-current={view === n.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] ${view === n.id ? "bg-[#0f1f33] text-lc-cyan" : "text-lc-dim hover:text-lc-text"}`}
            >
              <n.icon size={14} aria-hidden />
              {n.label}
              {n.id === "events" && s.pendingEvent && <AlertTriangle size={12} className="text-lc-amber" aria-label="Decision required" />}
            </button>
          ))}
        </nav>
      </header>

      {s.pendingEvent && !showEventModal && view !== "events" && !ended && (
        <button type="button" onClick={() => setEventHiddenFor(null)} className="flex w-full items-center justify-center gap-2 border-b border-lc-amber/40 bg-[#1a1308] px-4 py-2 text-[13px] text-[#ffe2bf] hover:bg-[#221a0c]">
          <AlertTriangle size={14} aria-hidden /> Decision required — simulation {settings.autoPauseOnEvents ? "is holding" : "continues"} until you respond. Open decision
        </button>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <nav className="sticky top-[57px] hidden h-[calc(100dvh-57px)] w-56 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-lc-line px-3 py-4 lg:flex" aria-label="Sections">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => go(n.id)}
              aria-current={view === n.id ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors ${view === n.id ? "bg-[#0f1f33] text-lc-cyan" : "text-lc-dim hover:bg-[#0b1424] hover:text-lc-text"}`}
            >
              <n.icon size={15} aria-hidden />
              <span className="flex-1">{n.label}</span>
              {n.id === "events" && s.pendingEvent && <AlertTriangle size={13} className="text-lc-amber" aria-label="Decision required" />}
            </button>
          ))}
          {ended && (
            <button type="button" onClick={() => go("report")} aria-current={view === "report" ? "page" : undefined} className={`mt-2 flex items-center gap-2.5 rounded-lg border border-lc-cyan/40 px-3 py-2 text-[13.5px] ${view === "report" ? "bg-[#0f1f33] text-lc-cyan" : "text-lc-text"}`}>
              <FileText size={15} aria-hidden /> Mission report
            </button>
          )}
          <div className="mt-auto space-y-2 px-1 pt-6 text-[11px] leading-snug text-lc-mute">
            <div className="flex items-center gap-1.5">
              <Save size={11} aria-hidden /> {api.savedAt ? "Progress saved locally" : "Not saved yet"}
            </div>
            <p>Independent educational project — not affiliated with or endorsed by NASA. All values are simulated estimates.</p>
          </div>
        </nav>

        <main id="lc-main" className="min-w-0 flex-1 px-4 py-4 lg:px-6 lg:py-5">
          <h1 className="sr-only">{NAV.find((n) => n.id === view)?.label ?? "Mission report"}</h1>
          {view === "dashboard" && <Dashboard {...viewProps} />}
          {view === "base" && <Base {...viewProps} selected={facility} setSelected={setFacility} />}
          {view === "resources" && <Resources {...viewProps} />}
          {view === "lifesupport" && <LifeSupport {...viewProps} />}
          {view === "power" && <Power {...viewProps} />}
          {view === "foodwater" && <FoodWater {...viewProps} />}
          {view === "crew" && <Crew {...viewProps} />}
          {view === "events" && <Events {...viewProps} />}
          {view === "objectives" && <Objectives {...viewProps} />}
          {view === "timeline" && <Timeline {...viewProps} />}
          {view === "science" && <Science {...viewProps} />}
          {view === "report" && (ended ? <Report {...viewProps} onNewMission={() => api.abandonMission()} /> : <Dashboard {...viewProps} />)}
          <p className="mt-8 text-center text-[11px] text-lc-mute lg:hidden">Independent educational project — not affiliated with or endorsed by NASA. All values are simulated estimates.</p>
        </main>
      </div>

      {showEventModal && (
        <Modal labelledBy="lc-event-title" onClose={() => setEventHiddenFor(s.pendingEvent!.triggeredHour)} wide>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="lc-label !text-lc-amber">Decision required</span>
            <button type="button" className="text-[12.5px] text-lc-mute hover:text-lc-text" onClick={() => setEventHiddenFor(s.pendingEvent!.triggeredHour)}>
              Review systems first
            </button>
          </div>
          <EventDecision s={s} api={api} headingId="lc-event-title" />
        </Modal>
      )}

      {confirmReset && (
        <Modal labelledBy="lc-reset-title" onClose={() => setConfirmReset(false)}>
          <h2 id="lc-reset-title" className="font-display text-[19px] font-semibold">
            Restart the mission?
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-lc-dim">This permanently discards the current mission ({sc.codename}, day {Math.floor(s.hour / 24) + 1}) and its saved progress. You will choose a new mission next.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="lc-btn" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="lc-btn lc-btn-danger"
              onClick={() => {
                setConfirmReset(false);
                api.abandonMission();
                setView("dashboard");
                setFacility(null);
              }}
            >
              <RotateCcw size={14} aria-hidden /> Discard and restart
            </button>
          </div>
        </Modal>
      )}

      {showSettings && (
        <Modal labelledBy="lc-settings-title" onClose={() => setShowSettings(false)}>
          <h2 id="lc-settings-title" className="font-display text-[19px] font-semibold">
            Settings
          </h2>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[14px] text-lc-text">Pause when an event needs a decision</div>
              <div className="mt-0.5 text-[12.5px] text-lc-dim">If off, time keeps running and the default action is applied when the deadline passes.</div>
            </div>
            <button type="button" role="switch" aria-checked={settings.autoPauseOnEvents} aria-label="Pause on events" className={`lc-btn !min-h-8 w-16 ${settings.autoPauseOnEvents ? "lc-btn-primary" : ""}`} onClick={() => setSettings({ autoPauseOnEvents: !settings.autoPauseOnEvents })}>
              {settings.autoPauseOnEvents ? "ON" : "OFF"}
            </button>
          </div>
          <div className="mt-4 text-[12.5px] leading-relaxed text-lc-dim">
            <p>
              Keyboard: <kbd className="lc-mono rounded border border-lc-line2 px-1">Space</kbd> run/pause · <kbd className="lc-mono rounded border border-lc-line2 px-1">.</kbd> advance one hour · <kbd className="lc-mono rounded border border-lc-line2 px-1">Esc</kbd> close dialogs.
            </p>
            <p className="mt-2">Animations follow your system's reduced-motion setting. Progress is saved automatically in this browser (no account needed).</p>
          </div>
          <div className="mt-5 flex justify-end">
            <button type="button" className="lc-btn lc-btn-primary" onClick={() => setShowSettings(false)}>
              Done
            </button>
          </div>
        </Modal>
      )}

      {showIntro && <Onboarding onClose={closeIntro} />}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[65] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite" role="status">
        {api.toasts.map((t) => (
          <div key={t.id} className={`lc-fade-in pointer-events-auto rounded-lg border px-3.5 py-2.5 text-[13px] shadow-xl ${t.tone === "error" ? "border-lc-red/50 bg-[#1f0c10] text-[#ffd0d2]" : "border-lc-line2 bg-[#0d1626] text-lc-text"}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
