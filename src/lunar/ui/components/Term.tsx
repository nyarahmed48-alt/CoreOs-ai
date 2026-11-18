import { useId, useState, type ReactNode } from "react";
import { GLOSSARY } from "../../science/content";

/**
 * A glossary term with an accessible tooltip: opens on hover and on keyboard
 * focus, closes on Escape/blur. The definition is also exposed via aria-describedby.
 */
export function Term({ term, children }: { term: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const def = GLOSSARY[term];
  if (!def) return <>{children ?? term}</>;
  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="cursor-help border-b border-dotted border-lc-mute text-inherit"
        aria-describedby={id}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        onClick={() => setOpen((o) => !o)}
      >
        {children ?? term}
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 rounded-lg border border-lc-line2 bg-[#0d1626] p-2.5 text-left text-[12px] font-normal normal-case leading-snug tracking-normal text-lc-dim shadow-xl ${open ? "block" : "hidden"}`}
      >
        <strong className="text-lc-text">{term}:</strong> {def}
      </span>
    </span>
  );
}
