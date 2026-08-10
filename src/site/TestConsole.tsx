/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, EyeOff, RotateCcw } from "lucide-react";
import type { PublicAgent } from "./catalog";
import { useLang } from "./i18n";
import { fill } from "./strings";

interface Turn {
  role: "user" | "agent";
  text: string;
}

const MAX_CHARS = 500;

export function TestConsole({
  agent,
  onClose,
}: {
  agent: PublicAgent;
  onClose: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t, lang, pick } = useLang();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;

    const history = turns.slice(-8);
    setTurns((t) => [...t, { role: "user", text: message }]);
    setInput("");
    setBusy(true);
    setError(null);

    // Never spin forever: a host that swallows the request (a misconfigured
    // proxy, a serverless function that never returns) would otherwise leave
    // the console stuck on "thinking".
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 90_000);

    try {
      const res = await fetch("/api/lab/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // lang tells the agent which language to answer in, so an Arabic
        // visitor is not replied to in English.
        body: JSON.stringify({ slug: agent.slug, message, history, lang }),
        signal: abort.signal,
      });

      // A host serving only the static build has no sandbox endpoint, so the
      // SPA fallback answers with index.html. Say so plainly instead of
      // failing on a JSON parse error the visitor can't interpret.
      if (!res.headers.get("content-type")?.includes("application/json")) {
        throw new Error(t("console.errNoSandbox"));
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.error || t("console.errFailed"));
      }
      setTurns((prev) => [...prev, { role: "agent", text: data.text }]);
    } catch (err: any) {
      setError(
        err?.name === "AbortError"
          ? fill(t("console.errSlow"), { name: agent.name })
          : err?.message || t("console.errGeneric"),
      );
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#03040799] p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${t("card.test")} ${agent.name}`}
        className="site-rise flex h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[#232b40] bg-[#0a0d16] shadow-2xl sm:h-[min(720px,88dvh)] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#171d2d] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#141a2c] font-display text-[15px] font-bold text-[#6c7bf0]">
              {agent.monogram}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-[17px] font-semibold text-white">
                {agent.name}
              </h3>
              <p className="truncate text-[13px] text-[#8c93ac]">
                {pick(agent.tagline)}
              </p>
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
                aria-label={t("console.clear")}
                className="rounded-lg p-2 text-[#8c93ac] transition-colors hover:bg-[#141a2c] hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label={t("console.close")}
              className="rounded-lg p-2 text-[#8c93ac] transition-colors hover:bg-[#141a2c] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
          {turns.length === 0 ? (
            <div className="mx-auto max-w-md py-6 text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#232b40] bg-[#0d1220] px-3 py-1.5 text-[12px] text-[#8c93ac]">
                <EyeOff className="h-3.5 w-3.5 text-[#6c7bf0]" />
                {t("console.hidden")}
              </div>
              <p className="text-[14px] leading-relaxed text-[#98a0bb]">
                {fill(t("console.prompt"), { name: agent.name })}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {agent.uses.slice(0, 3).map((use) => (
                  <button
                    key={use.en}
                    type="button"
                    onClick={() => send(pick(use))}
                    dir="auto"
                    className="rounded-xl border border-[#1e2537] bg-[#0d1220] px-4 py-3 text-start text-[13.5px] text-[#c3c9dd] transition-colors hover:border-[#3a4460] hover:text-white"
                  >
                    {pick(use)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {turns.map((turn, i) => (
                <div
                  key={i}
                  className={
                    turn.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  {/* dir="auto" per bubble: a conversation can mix languages
                      freely, and a bubble must run in the direction of its own
                      text or trailing punctuation jumps to the wrong end. */}
                  <div
                    dir="auto"
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                      turn.role === "user"
                        ? "rounded-ee-md bg-[#6c7bf0] text-[#05060a]"
                        : "rounded-es-md border border-[#1e2537] bg-[#0d1220] text-[#dfe4f2]"
                    }`}
                  >
                    {turn.text}
                  </div>
                </div>
              ))}
              {busy ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-es-md border border-[#1e2537] bg-[#0d1220] px-4 py-3 text-[13.5px] text-[#8c93ac]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#6c7bf0]" />
                    {fill(t("console.thinking"), { name: agent.name })}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {error ? (
            <div dir="auto" className="mt-4 rounded-xl border border-[#5b2434] bg-[#2a0f18] px-4 py-3 text-[13px] text-[#ffb3c0]">
              {error}
            </div>
          ) : null}
        </div>

        {/* Composer */}
        <div className="border-t border-[#171d2d] px-5 py-4">
          <div className="flex items-end gap-2 rounded-xl border border-[#232b40] bg-[#0d1220] p-2 focus-within:border-[#4a5677]">
            {/* Deliberately no dir="auto": an empty field has no content to
                detect from, so it would fall back to LTR and left-align the
                Arabic placeholder — the state every visitor sees first. */}
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
              placeholder={fill(t("console.placeholder"), { name: agent.name })}
              className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[14px] text-[#e7eaf6] outline-none placeholder:text-[#5e677f]"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              aria-label={t("console.send")}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6c7bf0] text-[#05060a] transition-opacity disabled:opacity-35"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 rtl:-scale-x-100" />
              )}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11.5px] text-[#5e677f]">
            <span>{t("console.foot")}</span>
            <span dir="ltr">
              {input.length}/{MAX_CHARS}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
