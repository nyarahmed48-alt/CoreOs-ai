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
  Check,
  Copy,
  KeyRound,
  LayoutGrid,
  Lock,
  LockOpen,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { GROUPS } from "./apps";
import {
  checkUnlock,
  describeDuration,
  unlockCode,
  type Duration,
} from "../activation";

const SALT = "coreos.ceo.v1";
const PIN_HASH = "e37b499a00f270bca960f2835fac1690343e228bc0091cdf341bf10dcdff944d";
const UNLOCKED_KEY = "coreos.ceo.unlocked";
const REGISTER_KEY = "coreos.ceo.register.v1";

async function hash(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

interface Issued {
  request: string;
  shop: string;
  code: string;
  days: Duration;
  at: string;
  expires: number | null;
}

function loadRegister(): Issued[] {
  try {
    return JSON.parse(localStorage.getItem(REGISTER_KEY) ?? "[]") as Issued[];
  } catch {
    return [];
  }
}

function saveRegister(rows: Issued[]) {
  try {
    localStorage.setItem(REGISTER_KEY, JSON.stringify(rows.slice(0, 200)));
  } catch {
    // A console that cannot remember what it issued still issues correctly;
    // the codes are computed, not looked up.
  }
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
            CoreOs
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

      {tab === "security" ? <Security /> : <Apps />}
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

const DURATIONS: Duration[] = [7, 30, 90, 365, 0];

/** Approving a tablet, and the list of the ones already approved. */
function Security() {
  const [request, setRequest] = useState("");
  const [days, setDays] = useState<Duration>(30);
  const [shop, setShop] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [rows, setRows] = useState<Issued[]>(loadRegister);

  const clean = request.trim().toUpperCase();
  const looksRight = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{4}$/.test(clean);

  async function approve() {
    const issued = await unlockCode(clean, days);
    setCode(issued);
    setCopied(false);
    const row: Issued = {
      request: clean,
      shop: shop.trim(),
      code: issued,
      days,
      at: new Date().toISOString(),
      expires: days === 0 ? null : Date.now() + days * 86400000,
    };
    const next = [row, ...rows.filter((existing) => existing.request !== clean)];
    setRows(next);
    saveRegister(next);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard refused; the code is on screen to be read out.
    }
  }

  return (
    <div className="mt-6">
      <section className="rounded-2xl border border-[#1e2740] bg-[#0b1120] p-5">
        <h2 className="font-display text-[16px] font-semibold text-white">
          Approve a tablet
        </h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[#7e87a5]">
          The shop sends you the code on their locked screen. Paste it here,
          choose how long they get, and send back the unlock code.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
              Their request code
            </span>
            <input
              value={request}
              onChange={(event) => {
                setRequest(event.target.value.toUpperCase());
                setCode("");
              }}
              placeholder="3NR-LET-7K2Q"
              className="h-[46px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] px-3 font-mono text-[17px] tracking-[0.1em] text-white outline-none placeholder:text-[#3a4460] focus:border-[#6c7bf0]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
              Which shop (for your own list)
            </span>
            <input
              value={shop}
              onChange={(event) => setShop(event.target.value)}
              placeholder="Abu Ahmed, Karrada"
              className="h-[46px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] px-3 text-[15px] text-[#e7eaf6] outline-none placeholder:text-[#3a4460] focus:border-[#6c7bf0]"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {DURATIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setDays(option);
                setCode("");
              }}
              className={`rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${
                days === option
                  ? "border-[#6c7bf0] bg-[#6c7bf0]/15 text-white"
                  : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460]"
              }`}
            >
              {describeDuration(option)}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!looksRight}
          onClick={() => void approve()}
          className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#6c7bf0] text-[15.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4] disabled:bg-[#2b3350] disabled:text-[#6b7490]"
        >
          <KeyRound size={17} />
          {looksRight ? "Make the unlock code" : "Paste their code first"}
        </button>

        {code ? (
          <div className="mt-4 rounded-xl border border-[#1f4034] bg-[#0d2119] px-4 py-4 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#78c9a3]">
              Send this back — {describeDuration(days).toLowerCase()}
            </p>
            <p className="mt-2 font-mono text-[26px] font-bold tracking-[0.12em] text-[#8ee7bb]">
              {code}
            </p>
            <button
              type="button"
              onClick={() => void copy()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#1f4034] px-3 py-2 text-[13px] font-semibold text-[#8ee7bb] hover:border-[#2c5a47]"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy it"}
            </button>
          </div>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="font-display text-[15px] font-semibold text-white">
          Tablets you have approved
        </h2>
        <p className="mt-1 text-[13.5px] text-[#7e87a5]">
          Your own record. The till enforces the date on its own — it does not
          ask this list, and cannot be reached from here.
        </p>

        {rows.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-[#232b40] px-4 py-6 text-center text-[13.5px] text-[#6b7490]">
            Nothing approved yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#141b2d] overflow-hidden rounded-xl border border-[#1e2740]">
            {rows.map((row) => {
              const lapsed = row.expires !== null && row.expires < Date.now();
              return (
                <li
                  key={row.request + row.at}
                  className="flex items-center gap-3 bg-[#0b1120] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[14px] tracking-[0.08em] text-[#e7eaf6]">
                      {row.request}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-[#6b7490]">
                      {row.shop ? `${row.shop} · ` : ""}
                      {row.expires === null
                        ? "no expiry"
                        : `${lapsed ? "lapsed" : "until"} ${new Date(row.expires).toLocaleDateString("en-GB")}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 font-mono text-[12px] ${
                      lapsed
                        ? "bg-[#3a1622] text-[#f0879d]"
                        : "bg-[#0d2119] text-[#8ee7bb]"
                    }`}
                  >
                    {row.code}
                  </span>
                  <button
                    type="button"
                    aria-label={`Forget ${row.request}`}
                    onClick={() => {
                      const next = rows.filter((other) => other !== row);
                      setRows(next);
                      saveRegister(next);
                    }}
                    className="shrink-0 rounded-lg p-2 text-[#6b7490] hover:text-[#f0879d]"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-8 border-t border-[#161d2f] pt-5 text-[12.5px] leading-relaxed text-[#6b7490]">
        How this works: the tablet makes a request code from its own till number
        and a part that changes each time. The unlock code you send back only
        fits that one request, so it cannot be passed to another tablet or used
        twice. When the date runs out the till locks itself and asks again.
        <br />
        <br />
        What it is not: the secret that makes these codes is inside both files,
        so somebody who takes the app apart could mint their own. It stops a
        shop copying the till to a second tablet or carrying on after they stop
        paying. It does not stop an engineer — that needs the server, and these
        same codes will come from it when it exists.
        <br />
        <br />
        Keep a copy of this file somewhere safe. Without it, no new tablet can
        be activated.
      </p>
    </div>
  );
}

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
