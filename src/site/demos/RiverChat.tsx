/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * RiverAi — the chat assistant on the Book River demo.
 *
 * Same endpoint and error handling as the testing console (TestConsole.tsx),
 * dressed as a shop's own help widget: a launcher in the corner and a panel
 * that sits over the page on desktop and fills the screen on a phone. It
 * talks to /api/lab/chat as slug "riverai", whose brief lives in
 * lab/agents.ts.
 *
 * The page can open it with a question already asked (`seed`) — the "Ask
 * about it" buttons on each book do this.
 */

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, X, RotateCcw, Sparkles } from "lucide-react";
import { BR } from "./bookRiver";
import { RiverMark } from "./RiverMark";
import { useCopy } from "./shared";
import { useLang } from "../i18n";
import { fill } from "../strings";

interface Turn {
  role: "user" | "agent";
  text: string;
}

const MAX_CHARS = 500;
const NAME = "RiverAi";

const NIGHT = "#0b1120";
const PANEL = "#111a2e";
const EDGE = "#22304d";
const RIVER = "#7fb0e8";
const MUTED = "#8b98b4";

export function RiverChat({
  open,
  onOpenChange,
  seed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A question to ask as soon as the panel opens. `id` makes repeats fire. */
  seed: { id: number; text: string } | null;
}) {
  const c = useCopy();
  const { t, lang } = useLang();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSeed = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy, open]);

  useEffect(() => {
    if (open && seed && seed.id !== lastSeed.current) {
      lastSeed.current = seed.id;
      void send(seed.text);
    }
    // Only a new seed should fire; send is deliberately left out of the deps.
  }, [open, seed]);

  async function send(text: string) {
    const message = text.trim().slice(0, MAX_CHARS);
    if (!message || busy) return;

    const history = turns.slice(-8);
    setTurns((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setBusy(true);
    setError(null);

    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 90_000);

    try {
      const res = await fetch("/api/lab/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "riverai", message, history, lang }),
        signal: abort.signal,
      });
      // Static-only hosts answer with index.html — see TestConsole.
      if (!res.headers.get("content-type")?.includes("application/json")) {
        throw new Error(t("console.errNoSandbox"));
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || t("console.errFailed"));
      setTurns((prev) => [...prev, { role: "agent", text: data.text }]);
    } catch (err: any) {
      setError(
        err?.name === "AbortError"
          ? fill(t("console.errSlow"), { name: NAME })
          : err?.message || t("console.errGeneric"),
      );
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher. Hidden while open on phones, where the panel is full screen. */}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={open ? c(BR.chatClose) : c(BR.chatOpen)}
        aria-expanded={open}
        className={`fixed bottom-5 end-5 z-40 items-center gap-2 rounded-full py-3 pe-5 ps-3 text-[14.5px] font-bold shadow-[0_10px_40px_rgba(0,0,0,0.45)] transition-transform hover:-translate-y-0.5 ${open ? "hidden sm:inline-flex" : "inline-flex"}`}
        style={{ background: RIVER, color: NIGHT }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: NIGHT }}>
          {open ? <X className="h-4 w-4" style={{ color: RIVER }} /> : <RiverMark className="h-5 w-5" color={RIVER} />}
        </span>
        {NAME}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={NAME}
          className="site-rise fixed inset-0 z-50 flex flex-col overflow-hidden sm:inset-auto sm:bottom-24 sm:end-5 sm:h-[min(620px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          style={{ background: NIGHT, borderColor: EDGE, color: "#e6ecf7" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: EDGE, background: PANEL }}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: NIGHT, border: `1px solid ${EDGE}` }}>
                <RiverMark className="h-6 w-6" color={RIVER} />
                <span className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2" style={{ background: "#4ade80", borderColor: PANEL }} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-[15.5px] font-bold">{NAME}</p>
                <p className="truncate text-[12px]" style={{ color: MUTED }}>{c(BR.chatOnline)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {turns.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setTurns([]);
                    setError(null);
                  }}
                  aria-label={c(BR.chatClear)}
                  className="rounded-lg p-2 transition-colors hover:bg-white/5"
                  style={{ color: MUTED }}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={c(BR.chatClose)}
                className="rounded-lg p-2 transition-colors hover:bg-white/5"
                style={{ color: MUTED }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Transcript */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              <Bubble role="agent">{c(BR.chatHello)}</Bubble>

              {turns.length === 0 ? (
                <div className="mt-1 flex flex-col gap-2">
                  {BR.chatStarters.map((s) => (
                    <button
                      key={s.en}
                      type="button"
                      onClick={() => send(c(s))}
                      dir="auto"
                      className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-start text-[13.5px] transition-colors hover:bg-white/5"
                      style={{ borderColor: EDGE, color: "#cfd8ea" }}
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: RIVER }} />
                      {c(s)}
                    </button>
                  ))}
                </div>
              ) : null}

              {turns.map((turn, i) => (
                <Bubble key={i} role={turn.role}>{turn.text}</Bubble>
              ))}

              {busy ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-es-md px-4 py-3 text-[13px]" style={{ background: PANEL, color: MUTED }}>
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: RIVER }} />
                    {c(BR.chatThinking)}
                  </div>
                </div>
              ) : null}

              {error ? (
                <div dir="auto" className="rounded-xl border border-[#5b2434] bg-[#2a0f18] px-4 py-3 text-[13px] text-[#ffb3c0]">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t px-3 pb-3 pt-3" style={{ borderColor: EDGE }}>
            <div className="flex items-end gap-2 rounded-xl border p-1.5" style={{ borderColor: EDGE, background: PANEL }}>
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                maxLength={MAX_CHARS}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={c(BR.chatPlaceholder)}
                className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[14px] outline-none placeholder:text-[#5f6c88]"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={busy || !input.trim()}
                aria-label={c(BR.chatSend)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-35"
                style={{ background: RIVER, color: NIGHT }}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:-scale-x-100" />}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px]" style={{ color: "#5f6c88" }}>
              {c(BR.chatFoot)}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Bubble({ role, children }: { role: Turn["role"]; children: string }) {
  const mine = role === "user";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      {/* dir="auto" per bubble so mixed-language chats keep punctuation in place. */}
      <div
        dir="auto"
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${mine ? "rounded-ee-md" : "rounded-es-md"}`}
        style={mine ? { background: RIVER, color: NIGHT } : { background: PANEL, color: "#dfe6f3" }}
      >
        {children}
      </div>
    </div>
  );
}
