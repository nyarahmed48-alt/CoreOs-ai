import { Moon, Rocket } from "lucide-react";
import { SCENARIOS } from "../engine/scenarios";

export function Setup({ onStart, loadIssue, onDismissIssue, onShowIntro }: { onStart: (id: string) => void; loadIssue: string | null; onDismissIssue: () => void; onShowIntro: () => void }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <div className="flex items-center gap-2 text-lc-cyan">
        <Moon size={18} aria-hidden />
        <span className="lc-label !text-lc-cyan">Lunar Command</span>
      </div>
      <h1 className="mt-3 max-w-3xl font-display text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-lc-text">Can you keep a lunar research base operational?</h1>
      <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-lc-dim">
        You command a four-person outpost on a sunlit ridge near the Moon's south pole. Balance power, oxygen, water and food, keep life support in its safe bands, respond to events, and complete your science objectives.
      </p>
      <button type="button" className="mt-4 text-[13px] text-lc-cyan underline-offset-2 hover:underline" onClick={onShowIntro}>
        How does it work? Show the briefing
      </button>

      {loadIssue && (
        <div className="mt-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-lc-amber/50 bg-[#1a1308] p-4 text-[13px] text-[#ffe2bf]" role="alert">
          <div>
            <strong>Your previous saved mission could not be restored.</strong> {loadIssue} A copy was kept in browser storage as a backup. Please start a new mission.
          </div>
          <button type="button" className="lc-btn !min-h-8" onClick={onDismissIssue}>
            Dismiss
          </button>
        </div>
      )}

      <h2 className="lc-label mt-10">Select a mission</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {SCENARIOS.map((sc) => (
          <article key={sc.id} className="lc-panel flex flex-col p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="lc-mono text-[11px] tracking-[0.14em] text-lc-mute">{sc.codename}</span>
              <span className={`lc-mono rounded border px-1.5 text-[10.5px] tracking-wider ${sc.difficulty === "Tutorial" ? "border-lc-green/50 text-lc-green" : sc.difficulty === "Standard" ? "border-lc-cyan/50 text-lc-cyan" : "border-lc-amber/50 text-lc-amber"}`}>{sc.difficulty.toUpperCase()}</span>
            </div>
            <h3 className="mt-2 font-display text-[19px] font-semibold text-lc-text">{sc.name}</h3>
            <p className="mt-1 flex-1 text-[13.5px] leading-relaxed text-lc-dim">{sc.summary}</p>
            <div className="lc-mono mt-3 text-[11.5px] text-lc-mute">
              {sc.durationHours / 24} days · {sc.objectives.length} objectives{sc.resupply ? " · 1 cargo lander" : ""}
            </div>
            <button type="button" className={`lc-btn mt-4 ${sc.difficulty === "Tutorial" ? "lc-btn-primary" : ""}`} onClick={() => onStart(sc.id)}>
              <Rocket size={14} aria-hidden /> Begin {sc.difficulty === "Tutorial" ? "tutorial" : "mission"}
            </button>
          </article>
        ))}
      </div>
      <p className="mt-10 text-[12px] text-lc-mute">An independent educational simulation built for the NASA Space Apps Challenge. Not built, endorsed, certified by, or affiliated with NASA. All values are simulated estimates.</p>
    </div>
  );
}
