/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The owner's console.
 *
 * One file, kept on one phone. It does two jobs: it opens everything CoreOs
 * runs, and it decides which tablets are allowed to run the till.
 *
 * It is deliberately not part of the website and never will be — no route, no
 * link, nothing to stumble on. Whoever holds this file holds the keys, which
 * is also the thing to be careful about: keep a copy somewhere safe, because
 * without it no new tablet can be activated.
 */

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  LayoutGrid,
  Lock,
  LockOpen,
  ShieldCheck,
} from "lucide-react";
import { GROUPS } from "./apps";
import { IssuePanel } from "../generator/IssuePanel";

const SALT = "coreos.ceo.v1";
const PIN_HASH = "e37b499a00f270bca960f2835fac1690343e228bc0091cdf341bf10dcdff944d";
const UNLOCKED_KEY = "coreos.ceo.unlocked";

async function hash(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function CeoApp() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(UNLOCKED_KEY) === "1") setUnlocked(true);
    } catch {
      // Private window: it will simply ask again.
    }
  }, []);

  return (
    <div dir="ltr" lang="en" className="min-h-[100dvh] bg-[#05060a] text-[#e7eaf6]">
      {unlocked ? (
        <Console
          onLock={() => {
            try {
              sessionStorage.removeItem(UNLOCKED_KEY);
            } catch {
              // Nothing to forget.
            }
            setUnlocked(false);
          }}
        />
      ) : (
        <PinGate
          onUnlock={() => {
            try {
              sessionStorage.setItem(UNLOCKED_KEY, "1");
            } catch {
              // Being asked twice is survivable.
            }
            setUnlocked(true);
          }}
        />
      )}
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

        <div className={`mt-7 flex justify-center gap-3 ${wrong ? "animate-pulse" : ""}`}>
          {[0, 1, 2, 3].map((slot) => (
            <span
              key={slot}
              className={`h-3 w-3 rounded-full transition-colors ${
                wrong ? "bg-[#f0879d]" : slot < pin.length ? "bg-[#6c7bf0]" : "bg-[#232b40]"
              }`}
            />
          ))}
        </div>

        {/* A keypad, not a text box: this is opened on a phone, and a keyboard
            would cover half of it. */}
        <div className="mt-8 grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <Key key={digit} onClick={() => press(digit)}>
              {digit}
            </Key>
          ))}
          <span />
          <Key onClick={() => press("0")}>0</Key>
          <Key quiet onClick={() => setPin((current) => current.slice(0, -1))}>
            ←
          </Key>
        </div>
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

function Console({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<"security" | "apps">("security");

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-[#6b7490]">
            CoreCashier
          </p>
          <h1 className="mt-2 font-brand text-[clamp(1.6rem,4vw,2.2rem)] font-extrabold tracking-[-0.03em] text-white">
            Owner's console
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

      <nav className="mt-6 flex gap-2">
        <Tab active={tab === "security"} onClick={() => setTab("security")}>
          <ShieldCheck size={16} /> Tablets
        </Tab>
        <Tab active={tab === "apps"} onClick={() => setTab("apps")}>
          <LayoutGrid size={16} /> Apps
        </Tab>
      </nav>

      {tab === "security" ? <IssuePanel /> : <Apps />}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[14px] font-semibold transition-colors ${
        active
          ? "border-[#6c7bf0] bg-[#6c7bf0]/15 text-white"
          : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/** Everything CoreOs runs, in one place to open from. */
function Apps() {
  return (
    <div className="mt-6">
      {GROUPS.map((group) => (
        <section key={group.title} className="mt-8 first:mt-0">
          <h2 className="font-display text-[15px] font-semibold text-white">
            {group.title}
          </h2>
          <p className="mt-1 text-[13.5px] text-[#7e87a5]">{group.blurb}</p>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {group.apps.map((app) => (
              <a
                key={app.name}
                href={app.to}
                target="_blank"
                rel="noreferrer noopener"
                className="block rounded-xl border border-[#1e2740] bg-[#0b1120] p-4 transition-colors hover:border-[#3a4460] hover:bg-[#111830]"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-[15.5px] font-semibold text-white">
                    {app.name}
                  </span>
                  <ArrowUpRight size={15} className="shrink-0 text-[#6b7490]" />
                </span>
                <span className="mt-1.5 block text-[13.5px] leading-relaxed text-[#98a0bb]">
                  {app.what}
                </span>
                {app.note ? (
                  <span className="mt-2 inline-block rounded-md bg-[#3a2c12] px-2 py-0.5 text-[11px] font-semibold text-[#f0c078]">
                    {app.note}
                  </span>
                ) : null}
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
