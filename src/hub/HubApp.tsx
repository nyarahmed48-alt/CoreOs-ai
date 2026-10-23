/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The launcher.
 *
 * One page that opens everything this project has built, behind a PIN, so a
 * phone on a counter in Baghdad can reach the right screen without anyone
 * remembering a path.
 *
 * About that PIN: it is a curtain, not a lock. The page is ordinary JavaScript
 * served to anyone who asks for the address, so anybody who opens the
 * developer tools, reads the bundle, or simply types one of the paths below
 * walks straight past it. What it does buy is that a phone left on a table
 * does not show this list to whoever picks it up, and that the address alone
 * is not an index of everything we run.
 *
 * So: it keeps the launcher private, and nothing behind it is protected by it.
 * Anything that needs real protection — the lab admin below — keeps its own
 * server-side token, which this does not replace.
 */

import { useEffect, useState } from "react";
import { ArrowUpRight, Lock, LockOpen } from "lucide-react";
import { Link } from "../site/router";
import { GROUPS } from "./apps";

/* The PIN is kept as a hash so it is not sitting in the bundle in plain sight.
   That raises the effort from "read the source" to "run the hash yourself",
   which is the honest limit of what a page like this can do. */
const SALT = "coreos.hub.v1";
const PIN_HASH = "1fb4d94e93a5468b77226902b157f71bab8452ea6309b14ed0bbd4a8f3c01044";
const UNLOCKED_KEY = "coreos.hub.unlocked";

async function hash(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function HubApp() {
  const [unlocked, setUnlocked] = useState(false);

  /* Remembered for the session only: closing the tab locks it again, which is
     the right trade for something opened on a phone that gets handed around. */
  useEffect(() => {
    try {
      if (sessionStorage.getItem(UNLOCKED_KEY) === "1") setUnlocked(true);
    } catch {
      // Private window, or storage blocked. The PIN screen simply returns.
    }
  }, []);

  function unlock() {
    try {
      sessionStorage.setItem(UNLOCKED_KEY, "1");
    } catch {
      // Not being able to remember it is survivable; being asked twice is not
      // a failure.
    }
    setUnlocked(true);
  }

  function lock() {
    try {
      sessionStorage.removeItem(UNLOCKED_KEY);
    } catch {
      // Nothing to forget.
    }
    setUnlocked(false);
  }

  return (
    <div
      dir="ltr"
      lang="en"
      className="min-h-[100dvh] bg-[#05060a] text-[#e7eaf6]"
    >
      {unlocked ? <Shelf onLock={lock} /> : <PinGate onUnlock={unlock} />}
    </div>
  );
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);

  async function submit(candidate: string) {
    if ((await hash(candidate)) === PIN_HASH) {
      onUnlock();
      return;
    }
    setWrong(true);
    setPin("");
    window.setTimeout(() => setWrong(false), 600);
  }

  function press(digit: string) {
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    if (next.length === 4) void submit(next);
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5">
      <div className="w-full max-w-[280px]">
        <div className="flex justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#232b40] text-[#6c7bf0]">
            <Lock size={19} />
          </span>
        </div>

        <div
          className={`mt-7 flex justify-center gap-3 ${wrong ? "animate-pulse" : ""}`}
        >
          {[0, 1, 2, 3].map((slot) => (
            <span
              key={slot}
              className={`h-3 w-3 rounded-full transition-colors ${
                wrong
                  ? "bg-[#f0879d]"
                  : slot < pin.length
                    ? "bg-[#6c7bf0]"
                    : "bg-[#232b40]"
              }`}
            />
          ))}
        </div>

        {/* A keypad rather than a text field: this is opened on a phone, and a
            keypad does not bring up a keyboard that covers half the screen. */}
        <div className="mt-8 grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <Key key={digit} onClick={() => press(digit)}>
              {digit}
            </Key>
          ))}
          <span />
          <Key onClick={() => press("0")}>0</Key>
          <Key onClick={() => setPin((current) => current.slice(0, -1))} quiet>
            ←
          </Key>
        </div>

        <input
          type="password"
          inputMode="numeric"
          aria-label="PIN"
          value={pin}
          onChange={(event) => {
            const next = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
            setPin(next);
            if (next.length === 4) void submit(next);
          }}
          className="sr-only"
        />
      </div>
    </div>
  );
}

function Key({
  children,
  onClick,
  quiet,
}: {
  children: React.ReactNode;
  onClick: () => void;
  quiet?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[62px] rounded-xl border text-[21px] font-semibold transition-colors ${
        quiet
          ? "border-transparent text-[#6b7490] hover:text-white"
          : "border-[#1e2740] bg-[#0d1220] text-white hover:border-[#3a4460] hover:bg-[#111830]"
      }`}
    >
      {children}
    </button>
  );
}

function Shelf({ onLock }: { onLock: () => void }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-[#6b7490]">
            CoreOs
          </p>
          <h1 className="mt-2 font-brand text-[clamp(1.7rem,4vw,2.4rem)] font-extrabold tracking-[-0.03em] text-white">
            Everything we run
          </h1>
        </div>
        <button
          type="button"
          onClick={onLock}
          className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg border border-[#232b40] px-3 py-2 text-[12.5px] font-medium text-[#98a0bb] transition-colors hover:border-[#3a4460] hover:text-white"
        >
          <LockOpen size={14} /> Lock
        </button>
      </header>

      {GROUPS.map((group) => (
        <section key={group.title} className="mt-10">
          <h2 className="font-display text-[15px] font-semibold text-white">
            {group.title}
          </h2>
          <p className="mt-1 text-[13.5px] text-[#7e87a5]">{group.blurb}</p>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {group.apps.map((app) => {
              const inside = (
                <>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-[15.5px] font-semibold text-white">
                      {app.name}
                    </span>
                    {app.external ? (
                      <ArrowUpRight size={15} className="shrink-0 text-[#6b7490]" />
                    ) : null}
                  </span>
                  <span className="mt-1.5 block text-[13.5px] leading-relaxed text-[#98a0bb]">
                    {app.what}
                  </span>
                  {app.note ? (
                    <span className="mt-2 inline-block rounded-md bg-[#3a2c12] px-2 py-0.5 text-[11px] font-semibold text-[#f0c078]">
                      {app.note}
                    </span>
                  ) : null}
                </>
              );

              const className =
                "block rounded-xl border border-[#1e2740] bg-[#0b1120] p-4 transition-colors hover:border-[#3a4460] hover:bg-[#111830]";

              return app.external ? (
                <a
                  key={app.name}
                  href={app.to}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={className}
                >
                  {inside}
                </a>
              ) : (
                <Link key={app.name} to={app.to} className={className}>
                  {inside}
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <p className="mt-12 border-t border-[#161d2f] pt-5 text-[12.5px] leading-relaxed text-[#6b7490]">
        The PIN keeps this list off a screen someone else picks up. It is not a
        lock: the paths above work whether or not anyone comes through here, and
        anything that needs real protection keeps its own password.
      </p>
    </div>
  );
}
