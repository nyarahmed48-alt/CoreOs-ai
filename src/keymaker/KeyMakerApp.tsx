/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CoreOS Key Maker.
 *
 * One file, kept on the technician's own phone and laptop. It is never
 * hosted, never inside CoreCashier, and it is the only thing in the world
 * that can make a technician key — because it is the only thing that has the
 * private half.
 *
 * The file itself is not the secret: the private key is stored encrypted
 * under a password, so a copy of this page without the password makes
 * nothing. The key file that was imported is the thing to keep safe.
 */

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Lock,
  LockOpen,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react";
import { ALL_SCOPES, type Scope } from "../pos/techkey";
import { drawQr, type Drawn } from "../generator/qr";
import { buildStamp } from "../pos/report";
import {
  createKeypair,
  makeKey,
  DEFAULT_HOURS,
  MAX_HOURS,
  MAX_HOURS_ALL_TILLS,
} from "./sign";
import { forgetVault, hasVault, lockAway, openVault } from "./vault";

const MADE_KEY = "coreos.keymaker.log.v1";
const TILLS_KEY = "coreos.keymaker.tills.v1";
const APP_URL_KEY = "coreos.keymaker.appurl.v1";

interface Made {
  at: string;
  till: string;
  scopes: Scope[];
  hours: number;
  nonce: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The key still works; only the record of it is lost.
  }
}

const SCOPE_WORDS: Record<Scope, string> = {
  details: "See full error details",
  simulate: "Trigger test errors",
  device: "Device checks and inspection",
  settings: "Technician-only settings",
};

export default function KeyMakerApp() {
  const [signing, setSigning] = useState<CryptoKey | null>(null);

  return (
    <div dir="ltr" lang="en" className="min-h-[100dvh] bg-[#05060a] text-[#e7eaf6]">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <header>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-[#6b7490]">
            CoreOS
          </p>
          <h1 className="mt-2 font-brand text-[clamp(1.6rem,4vw,2.2rem)] font-extrabold tracking-[-0.03em] text-white">
            Key Maker
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#98a0bb]">
            Makes one-time technician keys. Keep this file off the internet and
            off any tablet that goes to a shop.
          </p>
        </header>

        {signing ? (
          <Maker signing={signing} onLock={() => setSigning(null)} />
        ) : (
          <Unlock onOpen={setSigning} />
        )}

        <p className="mt-10 border-t border-[#161d2f] pt-5 text-[12.5px] leading-relaxed text-[#6b7490]">
          The private key is stored on this device encrypted under your
          password, and is never readable by this page even while unlocked — it
          can sign and nothing else. Losing the password means importing the
          key file again, so keep that file somewhere safe and separate (a
          password manager is the right place).
          <br />
          <br />
          <span className="font-mono">Build {buildStamp()}</span>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- unlocking */

function Unlock({ onOpen }: { onOpen: (key: CryptoKey) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(!hasVault());
  const [pendingJwk, setPendingJwk] = useState<JsonWebKey | null>(null);
  const [fresh, setFresh] = useState<string>("");

  async function unlock() {
    setBusy(true);
    setProblem("");
    const key = await openVault(password);
    setBusy(false);
    if (!key) {
      setProblem("That password does not open the key.");
      return;
    }
    onOpen(key);
  }

  async function store() {
    if (!pendingJwk) return;
    if (password.length < 8) {
      setProblem("Use at least eight characters.");
      return;
    }
    if (password !== confirm) {
      setProblem("The two passwords are not the same.");
      return;
    }
    setBusy(true);
    await lockAway(pendingJwk, password);
    const key = await openVault(password);
    setBusy(false);
    if (key) onOpen(key);
  }

  async function makeFresh() {
    const pair = await createKeypair();
    const file = new Blob([JSON.stringify(pair.privateJwk, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "coreos-technician-private-key.json";
    link.click();
    URL.revokeObjectURL(url);
    setPendingJwk(pair.privateJwk);
    setFresh(pair.publicKey);
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#1e2740] bg-[#0b1120] p-5">
      <h2 className="flex items-center gap-2 font-display text-[16px] font-semibold text-white">
        <Lock size={17} className="text-[#6c7bf0]" />
        {importing ? "Set up this device" : "Unlock"}
      </h2>

      {importing ? (
        <>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[#7e87a5]">
            Import your technician private key once. It is stored here
            encrypted under a password you choose, and never leaves this
            device.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <label className="flex h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[#232b40] px-4 text-[14px] font-semibold text-[#98a0bb] hover:border-[#3a4460] hover:text-white">
              <Upload size={16} /> Open my key file
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  try {
                    setPendingJwk(JSON.parse(await file.text()) as JsonWebKey);
                    setProblem("");
                  } catch {
                    setProblem("That is not a key file.");
                  }
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => void makeFresh()}
              className="flex h-[44px] items-center gap-2 rounded-xl border border-[#232b40] px-4 text-[14px] font-semibold text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
            >
              <Download size={16} /> Make a new key
            </button>
          </div>

          {fresh ? (
            <div className="mt-4 rounded-xl border border-[#4a3a1a] bg-[#1a1208] p-4">
              <p className="text-[13px] font-semibold text-[#f0c078]">
                New key made. The file downloaded — back it up now.
              </p>
              <p className="mt-2 text-[13px] text-[#c8a26a]">
                Put this line in <span className="font-mono">src/pos/techkey.ts</span>{" "}
                and rebuild CoreCashier, or no tablet will accept your keys:
              </p>
              <p className="mt-2 overflow-x-auto rounded-lg bg-[#05060a] p-3 font-mono text-[11.5px] text-[#8ee7bb]">
                "{fresh}",
              </p>
            </div>
          ) : null}

          {pendingJwk ? (
            <div className="mt-4 grid gap-3">
              <Box
                label="Choose a password"
                type="password"
                value={password}
                onChange={setPassword}
              />
              <Box
                label="Again"
                type="password"
                value={confirm}
                onChange={setConfirm}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void store()}
                className="h-[48px] rounded-xl bg-[#6c7bf0] text-[15px] font-semibold text-[#05060a] hover:bg-[#8390f4] disabled:bg-[#2b3350]"
              >
                Lock it on this device
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-4 grid gap-3">
          <Box
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            onEnter={() => void unlock()}
          />
          <button
            type="button"
            disabled={busy || !password}
            onClick={() => void unlock()}
            className="flex h-[48px] items-center justify-center gap-2 rounded-xl bg-[#6c7bf0] text-[15px] font-semibold text-[#05060a] hover:bg-[#8390f4] disabled:bg-[#2b3350] disabled:text-[#6b7490]"
          >
            <LockOpen size={17} /> Unlock
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Remove the stored key from this device?")) {
                forgetVault();
                setImporting(true);
              }
            }}
            className="text-[13px] font-semibold text-[#6b7490] underline hover:text-[#f0879d]"
          >
            Forget the key on this device
          </button>
        </div>
      )}

      {problem ? (
        <p className="mt-3 text-[13px] text-[#f0879d]">{problem}</p>
      ) : null}
    </section>
  );
}

/* ---------------------------------------------------------- making a key */

function Maker({ signing, onLock }: { signing: CryptoKey; onLock: () => void }) {
  const [till, setTill] = useState("");
  const [allTills, setAllTills] = useState(false);
  const [technician, setTechnician] = useState("Nyar");
  const [scopes, setScopes] = useState<Scope[]>(["details", "simulate"]);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [made, setMade] = useState<{ text: string; expires: number } | null>(null);
  const [qr, setQr] = useState<Drawn | null>(null);
  const [copied, setCopied] = useState("");
  const [log, setLog] = useState<Made[]>(() => readJson<Made[]>(MADE_KEY, []));
  const [tills, setTills] = useState<string[]>(() => readJson<string[]>(TILLS_KEY, []));
  const [appUrl, setAppUrl] = useState(() => readJson<string>(APP_URL_KEY, ""));

  /* The cap follows the checkbox, not the text box. Reading it off an empty
     Till ID meant a key looked like an every-till key before the technician
     had finished typing, and quietly clamped the default two hours to one. */
  const cap = allTills ? MAX_HOURS_ALL_TILLS : MAX_HOURS;
  const clean = till.trim().toUpperCase();
  const ready = (allTills || /^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(clean)) && scopes.length > 0;

  useEffect(() => {
    if (hours > cap) setHours(cap);
  }, [cap, hours]);

  useEffect(() => {
    if (!made) {
      setQr(null);
      return;
    }
    let cancelled = false;
    void drawQr(made.text).then((drawn) => {
      if (!cancelled) setQr(drawn);
    });
    return () => {
      cancelled = true;
    };
  }, [made]);

  async function build() {
    const key = await makeKey(signing, {
      till: allTills ? "" : clean,
      technician: technician.trim(),
      scopes,
      hours,
    });
    setMade({ text: key.text, expires: key.expires });
    setCopied("");

    const row: Made = {
      at: new Date().toISOString(),
      till: allTills ? "every till" : clean,
      scopes,
      hours,
      nonce: key.nonce,
    };
    const next = [row, ...log].slice(0, 200);
    setLog(next);
    writeJson(MADE_KEY, next);

    if (!allTills && !tills.includes(clean)) {
      const kept = [clean, ...tills].slice(0, 100);
      setTills(kept);
      writeJson(TILLS_KEY, kept);
    }
  }

  const link = made ? `${appUrl || ""}#tk=${encodeURIComponent(made.text)}` : "";

  async function copy(what: string, label: string) {
    try {
      await navigator.clipboard.writeText(what);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      // On screen to be selected by hand.
    }
  }

  return (
    <>
      <section className="mt-6 rounded-2xl border border-[#1e2740] bg-[#0b1120] p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-[16px] font-semibold text-white">
            <Wrench size={17} className="text-[#6c7bf0]" /> Make a key
          </h2>
          <button
            type="button"
            onClick={onLock}
            className="rounded-lg border border-[#232b40] px-3 py-1.5 text-[12.5px] font-medium text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
          >
            <Lock size={13} className="inline" /> Lock
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Box
              label="Till ID"
              value={till}
              placeholder="3NR-LET"
              disabled={allTills}
              onChange={(value) => {
                setTill(value.toUpperCase());
                setMade(null);
              }}
            />
            {tills.length > 0 && !allTills ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tills.slice(0, 12).map((one) => (
                  <button
                    key={one}
                    type="button"
                    onClick={() => {
                      setTill(one);
                      setMade(null);
                    }}
                    className="rounded-md border border-[#232b40] px-2 py-1 font-mono text-[12px] text-[#98a0bb] hover:border-[#6c7bf0] hover:text-white"
                  >
                    {one}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <Box label="Technician name" value={technician} onChange={setTechnician} />
        </div>

        <label className="mt-3 flex items-center gap-2 text-[13.5px] text-[#98a0bb]">
          <input
            type="checkbox"
            checked={allTills}
            onChange={(event) => {
              setAllTills(event.target.checked);
              setMade(null);
            }}
            className="h-4 w-4 accent-[#6c7bf0]"
          />
          A key for every till — capped at {MAX_HOURS_ALL_TILLS} hour
        </label>

        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
          Unlocks
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {ALL_SCOPES.map((scope) => (
            <label
              key={scope}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[13.5px] ${
                scopes.includes(scope)
                  ? "border-[#6c7bf0] bg-[#6c7bf0]/10 text-white"
                  : "border-[#232b40] text-[#98a0bb]"
              }`}
            >
              <input
                type="checkbox"
                checked={scopes.includes(scope)}
                onChange={(event) => {
                  setScopes((current) =>
                    event.target.checked
                      ? [...current, scope]
                      : current.filter((one) => one !== scope),
                  );
                  setMade(null);
                }}
                className="h-4 w-4 accent-[#6c7bf0]"
              />
              {SCOPE_WORDS[scope]}
            </label>
          ))}
        </div>

        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
          Lasts
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[0.5, 1, 2, 4, 8, 24].filter((h) => h <= cap).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setHours(option);
                setMade(null);
              }}
              className={`rounded-lg border px-3 py-2 text-[13px] font-semibold ${
                hours === option
                  ? "border-[#6c7bf0] bg-[#6c7bf0]/15 text-white"
                  : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460]"
              }`}
            >
              {option < 1 ? `${option * 60} min` : `${option} h`}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!ready}
          onClick={() => void build()}
          className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#6c7bf0] text-[15.5px] font-semibold text-[#05060a] hover:bg-[#8390f4] disabled:bg-[#2b3350] disabled:text-[#6b7490]"
        >
          <KeyRound size={17} /> Make key
        </button>

        {made ? (
          <div className="mt-4 rounded-xl border border-[#1f4034] bg-[#0d2119] px-4 py-4">
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-[#78c9a3]">
              Good until {new Date(made.expires).toLocaleString("en-GB")}
            </p>
            {qr ? (
              <div className="mt-4 flex justify-center">
                <div className="rounded-xl bg-white p-3">
                  <svg
                    viewBox={`0 0 ${qr.size} ${qr.size}`}
                    className="h-[230px] w-[230px]"
                    shapeRendering="crispEdges"
                    role="img"
                    aria-label="The technician key as a QR code"
                  >
                    <path d={qr.path} fill="#05060a" />
                  </svg>
                </div>
              </div>
            ) : null}
            <p className="mt-3 text-center text-[12.5px] text-[#7e87a5]">
              Hold this up to the tablet's camera.
            </p>
            <p className="mt-3 break-all rounded-lg bg-[#05060a]/60 p-3 text-center font-mono text-[11.5px] leading-relaxed text-[#8ee7bb]">
              {made.text}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Pill onClick={() => void copy(made.text, "key")}>
                {copied === "key" ? <Check size={14} /> : <Copy size={14} />} Copy key
              </Pill>
              <Pill onClick={() => void copy(link, "link")}>
                {copied === "link" ? <Check size={14} /> : <Copy size={14} />} Copy link
              </Pill>
            </div>
            <div className="mt-3">
              <Box
                label="Tablet app address (for the link)"
                value={appUrl}
                placeholder="https://… or leave empty"
                onChange={(value) => {
                  setAppUrl(value);
                  writeJson(APP_URL_KEY, value);
                }}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="font-display text-[15px] font-semibold text-white">
          Keys you have made
        </h2>
        {log.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-[#232b40] px-4 py-6 text-center text-[13.5px] text-[#6b7490]">
            None yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#141b2d] overflow-hidden rounded-xl border border-[#1e2740]">
            {log.slice(0, 40).map((row) => (
              <li
                key={row.nonce}
                className="flex items-center gap-3 bg-[#0b1120] px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[13.5px] text-[#e7eaf6]">{row.till}</p>
                  <p className="mt-0.5 text-[12px] text-[#6b7490]">
                    {new Date(row.at).toLocaleString("en-GB")} · {row.hours}h ·{" "}
                    {row.scopes.join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Forget ${row.till}`}
                  onClick={() => {
                    const next = log.filter((one) => one.nonce !== row.nonce);
                    setLog(next);
                    writeJson(MADE_KEY, next);
                  }}
                  className="shrink-0 rounded-lg p-2 text-[#6b7490] hover:text-[#f0879d]"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Pill({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-[#1f4034] px-3 py-2 text-[13px] font-semibold text-[#8ee7bb] hover:border-[#2c5a47]"
    >
      {children}
    </button>
  );
}

function Box({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  onEnter,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  onEnter?: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onEnter?.();
        }}
        className="h-[46px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] px-3 text-[15px] text-white outline-none placeholder:text-[#3a4460] focus:border-[#6c7bf0] disabled:opacity-50"
      />
    </label>
  );
}
