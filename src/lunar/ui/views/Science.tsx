import { useState } from "react";
import { ExternalLink, ImageOff, Loader2, Search } from "lucide-react";
import { ASSUMPTIONS } from "../../engine/config";
import { GLOSSARY, SCIENCE_TOPICS } from "../../science/content";
import { searchNasaImages, type ImageResult } from "../../science/nasaImages";
import { SOURCES } from "../../science/sources";
import { Panel } from "../components/Panel";
import { SourceLinks } from "../components/Sources";
import type { ViewProps } from "./types";

const QUERIES = ["lunar south pole", "Shackleton crater", "lunar regolith", "Moon permanently shadowed region"];

function NasaGallery() {
  const [query, setQuery] = useState(QUERIES[0]);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<ImageResult | null>(null);

  const load = async (q: string) => {
    setQuery(q);
    setState("loading");
    setResult(await searchNasaImages(q));
    setState("done");
  };

  return (
    <Panel title="NASA reference imagery" eyebrow="Optional live data · NASA Image and Video Library">
      <p className="text-[13px] leading-relaxed text-lc-dim">
        Real imagery of the lunar south pole region from NASA's public Image and Video Library (no API key required). This is optional context: the simulation never depends on it and works offline. NASA imagery is shown with credit and does not imply NASA endorsement of this project.
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Image topics">
        {QUERIES.map((q) => (
          <button key={q} type="button" className={`lc-btn !min-h-8 text-[12px] ${query === q && state !== "idle" ? "lc-btn-primary" : ""}`} onClick={() => load(q)} disabled={state === "loading"}>
            <Search size={12} aria-hidden /> {q}
          </button>
        ))}
      </div>
      <div className="mt-4" aria-live="polite">
        {state === "idle" && <p className="text-[12.5px] text-lc-mute">Choose a topic to load images (requires an internet connection).</p>}
        {state === "loading" && (
          <p className="flex items-center gap-2 text-[13px] text-lc-dim">
            <Loader2 size={14} className="animate-spin" aria-hidden /> Contacting images-api.nasa.gov…
          </p>
        )}
        {state === "done" && result && !result.ok && (
          <div className="flex items-start gap-3 rounded-lg border border-lc-line2 bg-[#0b1322] p-3 text-[13px]">
            <ImageOff size={18} className="mt-0.5 shrink-0 text-lc-mute" aria-hidden />
            <div>
              <div className="text-lc-text">Demonstration mode — live imagery unavailable</div>
              <div className="mt-0.5 text-lc-dim">{result.message} The rest of the application is unaffected.</div>
              <button type="button" className="lc-btn mt-2 !min-h-8 text-[12px]" onClick={() => load(query)}>
                Try again
              </button>
            </div>
          </div>
        )}
        {state === "done" && result?.ok && (
          <>
            {result.images.length === 0 && <p className="text-[13px] text-lc-dim">No images found for this topic.</p>}
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.images.map((img) => (
                <li key={img.nasaId} className="overflow-hidden rounded-lg border border-lc-line bg-[#0b1322]">
                  <img src={img.thumbUrl} alt={img.title} loading="lazy" className="aspect-[4/3] w-full bg-black object-cover" />
                  <div className="p-2.5">
                    <div className="line-clamp-2 text-[12.5px] text-lc-text">{img.title}</div>
                    <div className="lc-mono mt-1 text-[10.5px] text-lc-mute">
                      Credit: NASA/{img.center} · {img.dateCreated} · {img.nasaId}
                    </div>
                    <a href={img.detailUrl} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-lc-dim hover:text-lc-cyan">
                      <ExternalLink size={11} aria-hidden /> View on images.nasa.gov
                    </a>
                  </div>
                </li>
              ))}
            </ul>
            {result.fromCache && <p className="mt-2 text-[11px] text-lc-mute">Loaded from local cache (refreshes after 24 h).</p>}
          </>
        )}
      </div>
    </Panel>
  );
}

export function Science(_: ViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {SCIENCE_TOPICS.map((t) => (
          <article key={t.id} className="lc-panel p-4">
            <h3 className="font-display text-[15.5px] font-semibold text-lc-text">{t.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-lc-dim">{t.body}</p>
            <SourceLinks ids={t.sourceIds} />
          </article>
        ))}
      </div>

      <Panel title="Simulation assumptions" eyebrow="What is real, what is physics, what is gameplay">
        <div className="lc-scroll overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="lc-label">
              <tr>
                <th className="py-2 pr-3 font-normal">Parameter</th>
                <th className="py-2 pr-3 font-normal">Value</th>
                <th className="py-2 pr-3 font-normal">Basis</th>
                <th className="py-2 font-normal">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ASSUMPTIONS.map((a) => (
                <tr key={a.key} className="border-t border-lc-line align-top">
                  <td className="py-2 pr-3 text-lc-text">{a.label}</td>
                  <td className="lc-mono py-2 pr-3 text-lc-text">
                    {a.value} {a.unit}
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`lc-mono rounded border px-1.5 text-[10.5px] tracking-wider ${a.source === "reference" ? "border-lc-green/50 text-lc-green" : a.source === "physics" ? "border-lc-cyan/50 text-lc-cyan" : "border-lc-caution/50 text-lc-caution"}`}>
                      {a.source === "reference" ? "SOURCED" : a.source === "physics" ? "PHYSICS" : "ILLUSTRATIVE"}
                    </span>
                  </td>
                  <td className="py-2 text-[12.5px] text-lc-dim">{a.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-lc-mute">
          All tunable values live in <code className="lc-mono">src/lunar/engine/config.ts</code>. ILLUSTRATIVE values are chosen for playability and are not real lunar-base specifications.
        </p>
      </Panel>

      <NasaGallery />

      <Panel title="Sources" eyebrow="References used in this application">
        <ol className="space-y-3">
          {SOURCES.map((src, i) => (
            <li key={src.id} className="text-[13px]">
              <a href={src.url} target="_blank" rel="noreferrer noopener" className="text-lc-text hover:text-lc-cyan">
                [{i + 1}] {src.title}
              </a>
              <div className="text-[12px] text-lc-mute">
                {src.authors ? `${src.authors}. ` : ""}
                {src.publisher}, {src.year}.
              </div>
              <div className="text-[12.5px] text-lc-dim">Used for: {src.usedFor}</div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Glossary">
        <dl className="grid gap-x-6 gap-y-2 text-[13px] md:grid-cols-2">
          {Object.entries(GLOSSARY).map(([k, v]) => (
            <div key={k}>
              <dt className="font-semibold text-lc-text">{k}</dt>
              <dd className="text-lc-dim">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <p className="text-[12px] text-lc-mute">LUNAR COMMAND is an independent educational project. It is not built, endorsed, certified by, or affiliated with NASA.</p>
    </div>
  );
}
