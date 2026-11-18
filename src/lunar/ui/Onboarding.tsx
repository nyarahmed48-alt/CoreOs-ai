import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Gauge, Moon, Target, Zap } from "lucide-react";

const STEPS = [
  {
    icon: Moon,
    title: "You are the mission commander",
    body: "Ridge Station is a fictional four-person research outpost near the Moon's south pole. Your job is to keep the crew safe and the base productive under tight limits on power, consumables and spare parts.",
  },
  {
    icon: Gauge,
    title: "The base and its resources",
    body: "Eight facilities turn power into what the crew needs: oxygen from water, recycled water, fresh food, research data. Each one wears down, can fail, and needs crew time and spare parts to service or repair. Click any facility on the schematic to inspect it.",
  },
  {
    icon: Zap,
    title: "Power is everything",
    body: "Solar arrays track the Sun as it skims the horizon. Terrain shadows cut generation — sometimes for a day or more. Set power priorities and a battery reserve, and shed loads before a shadow arrives. The Power page shows a 72-hour forecast.",
  },
  {
    icon: Clock,
    title: "How time works",
    body: "The simulation runs in one-hour steps. Press Run to let time flow (1×, 2× or 4×), or step manually with +1 h and +1 day. The clock pauses automatically when an event needs your decision. Pause any time with the Space key.",
  },
  {
    icon: Target,
    title: "Objectives and evaluation",
    body: "Sustain operations for the planned duration, keep life support in its safe bands, complete research, and maintain the base. At the end you'll receive a mission report explaining the outcome. All values are simulated estimates for learning, not real engineering data.",
  },
];

export function Onboarding({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const step = STEPS[i];
  const Icon = step.icon;

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="lc-onb-title">
      <div ref={ref} tabIndex={-1} className="lc-panel lc-fade-in w-full max-w-lg p-6 outline-none">
        <div className="flex items-center justify-between">
          <span className="lc-label">
            Briefing {i + 1} / {STEPS.length}
          </span>
          <button type="button" className="text-[12.5px] text-lc-mute hover:text-lc-text" onClick={onClose}>
            Skip briefing
          </button>
        </div>
        <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl border border-lc-line2 bg-[#0d1729] text-lc-cyan">
          <Icon size={20} aria-hidden />
        </div>
        <h2 id="lc-onb-title" className="mt-4 font-display text-[22px] font-semibold text-lc-text">
          {step.title}
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-lc-dim">{step.body}</p>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full ${k === i ? "w-6 bg-lc-cyan" : "w-1.5 bg-lc-line2"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className="lc-btn" disabled={i === 0} onClick={() => setI(i - 1)}>
              <ChevronLeft size={14} aria-hidden /> Back
            </button>
            {i < STEPS.length - 1 ? (
              <button type="button" className="lc-btn lc-btn-primary" onClick={() => setI(i + 1)}>
                Next <ChevronRight size={14} aria-hidden />
              </button>
            ) : (
              <button type="button" className="lc-btn lc-btn-primary" onClick={onClose}>
                Take command
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
