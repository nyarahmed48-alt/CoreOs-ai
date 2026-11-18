import { ExternalLink } from "lucide-react";
import { SOURCE_MAP } from "../../science/sources";

export function SourceLinks({ ids }: { ids: string[] }) {
  if (ids.length === 0) return <p className="mt-2 text-[11.5px] text-lc-mute">General engineering principle — no single source.</p>;
  return (
    <ul className="mt-2 space-y-1">
      {ids.map((id) => {
        const src = SOURCE_MAP[id];
        if (!src) return null;
        return (
          <li key={id} className="text-[11.5px] leading-snug text-lc-mute">
            <a href={src.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-start gap-1 text-lc-dim hover:text-lc-cyan">
              <ExternalLink size={11} className="mt-[3px] shrink-0" aria-hidden />
              <span>
                {src.title} — {src.publisher}, {src.year}
                <span className="sr-only"> (opens in a new tab)</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
