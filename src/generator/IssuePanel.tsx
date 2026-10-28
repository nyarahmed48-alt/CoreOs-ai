/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Issuing licences: the owner's side of the whole scheme.
 *
 * Two things live here. The key box, which loads the private key from the
 * owner's own key file — nothing signs until it is loaded, and the file it is
 * loaded from is the only copy, so it is the thing to back up. And the issuing
 * form, which takes the code a shop sent and hands back the licence.
 *
 * The same panel is the Tablets tab of the owner's console and the whole of
 * the small code generator. One of those is convenient and one is the thing
 * to keep on a machine that never leaves the office; which to use is the
 * owner's call, and the code is identical either way.
 */

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  KeyRound,
  QrCode,
  Send,
  Snowflake,
  Trash2,
  Upload,
} from "lucide-react";
import {
  PUBLIC_KEY,
  describeDuration,
  groupCode,
  tillPart,
  type Duration,
} from "../activation";
import { buildStamp } from "../pos/report";
import {
  createKeypair,
  freezeCode,
  importPrivateKey,
  keyMatches,
  oldFreezeCodes,
  oldUnlockCode,
  unlockCode,
} from "./issue";
import { drawQr, type Drawn } from "./qr";

const REGISTER_KEY = "coreos.ceo.register.v1";
const KEY_KEY = "coreos.gen.key.v1";

const DURATIONS: Duration[] = [7, 30, 90, 365, 0];

interface Issued {
  request: string;
  shop: string;
  code: string;
  days: Duration;
  at: string;
  expires: number | null;
  /** Your own mark: when this one comes back asking, do not issue another.
      It is a note to yourself — the till cannot be told anything from here. */
  hold?: boolean;
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

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------- the key box */

type KeyState =
  | { kind: "none" }
  | { kind: "loaded"; key: CryptoKey; matches: boolean; remembered: boolean };

function KeyBox({
  state,
  onState,
}: {
  state: KeyState;
  onState: (next: KeyState) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [fresh, setFresh] = useState<{ publicKey: string } | null>(null);
  const [remember, setRemember] = useState(true);

  /* A key left on this machine last time. The generator is useless without
     one, and being asked for the file on every single code would get the file
     left open in a folder somewhere, which is worse. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = localStorage.getItem(KEY_KEY);
        if (!saved) return;
        const key = await importPrivateKey(JSON.parse(saved) as JsonWebKey);
        if (cancelled) return;
        onState({
          kind: "loaded",
          key,
          matches: await keyMatches(key, PUBLIC_KEY),
          remembered: true,
        });
      } catch {
        // A key that will not import is a key that is not there.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function take(text: string) {
    setError("");
    setFresh(null);
    try {
      const jwk = JSON.parse(text) as JsonWebKey;
      const key = await importPrivateKey(jwk);
      const matches = await keyMatches(key, PUBLIC_KEY);
      if (remember) {
        try {
          localStorage.setItem(KEY_KEY, JSON.stringify(jwk));
        } catch {
          // It still works for this session.
        }
      }
      onState({ kind: "loaded", key, matches, remembered: remember });
    } catch {
      setError(
        "That is not a CoreCashier key file. It is the .json file you saved when the key was made.",
      );
    }
  }

  async function makeKey() {
    const warning =
      "Make a brand new key?\n\nEvery licence already in a shop stops working the day those tablets get the new build. You would have to reissue all of them.\n\nOnly do this if the old key has leaked, or if you want a key nobody else has ever held.";
    if (!window.confirm(warning)) return;
    const pair = await createKeypair();
    download(
      "corecashier-private-key.json",
      JSON.stringify(pair.privateJwk, null, 2),
    );
    setFresh({ publicKey: pair.publicKey });
    await take(JSON.stringify(pair.privateJwk));
  }

  function forget() {
    try {
      localStorage.removeItem(KEY_KEY);
    } catch {
      // Nothing to forget.
    }
    onState({ kind: "none" });
  }

  return (
    <section
      className={`rounded-2xl border p-5 ${
        state.kind === "loaded" && state.matches
          ? "border-[#1f4034] bg-[#0b1120]"
          : "border-[#4a3a1a] bg-[#140f08]"
      }`}
    >
      <h2 className="flex items-center gap-2 font-display text-[16px] font-semibold text-white">
        <KeyRound size={17} className="text-[#6c7bf0]" /> Your signing key
      </h2>

      {state.kind === "none" ? (
        <>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[#c8a26a]">
            No key loaded, so nothing can be issued yet. Open your key file —
            the <span className="font-mono">corecashier-private-key.json</span>{" "}
            you keep off this machine. It never goes to a shop, and it is not
            in the till: a tablet can check a licence but cannot make one.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-[44px] items-center gap-2 rounded-xl bg-[#6c7bf0] px-4 text-[14px] font-semibold text-[#05060a] hover:bg-[#8390f4]"
            >
              <Upload size={16} /> Open my key file
            </button>
            <button
              type="button"
              onClick={() => void makeKey()}
              className="flex h-[44px] items-center gap-2 rounded-xl border border-[#232b40] px-4 text-[14px] font-semibold text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
            >
              Make a new key
            </button>
          </div>
          <label className="mt-3 flex items-center gap-2 text-[13px] text-[#7e87a5]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 accent-[#6c7bf0]"
            />
            Remember it on this device
          </label>
        </>
      ) : (
        <>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[13.5px] text-[#7e87a5]">
            {state.matches ? (
              <span className="flex items-center gap-1.5 text-[#8ee7bb]">
                <Check size={15} /> Loaded, and it matches the key the tills are
                carrying.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#f0c078]">
                <AlertTriangle size={15} /> Loaded — but this is not the key the
                shipped tills trust. Codes signed with it will be refused.
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={forget}
            className="mt-3 text-[13px] font-semibold text-[#6b7490] underline hover:text-[#f0879d]"
          >
            {state.remembered ? "Forget it on this device" : "Close the key"}
          </button>
        </>
      )}

      {fresh ? (
        <div className="mt-4 rounded-xl border border-[#4a3a1a] bg-[#1a1208] p-4">
          <p className="text-[13px] font-semibold text-[#f0c078]">
            New key made. Two things to do, in this order:
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#c8a26a]">
            1. Keep the file that just downloaded. It is the only copy — lose
            it and no tablet can ever be activated again.
            <br />
            2. Put this line in <span className="font-mono">
              src/activation.ts
            </span>{" "}
            and build the till again:
          </p>
          <p className="mt-2 overflow-x-auto rounded-lg bg-[#05060a] p-3 font-mono text-[11.5px] leading-relaxed text-[#8ee7bb]">
            "{fresh.publicKey}",
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-[13px] text-[#f0879d]">{error}</p>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json,.txt,text/plain"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) await take(await file.text());
        }}
      />
    </section>
  );
}

/* --------------------------------------------------------------- the panel */

export function IssuePanel() {
  const [keyState, setKeyState] = useState<KeyState>({ kind: "none" });
  const [request, setRequest] = useState("");
  const [days, setDays] = useState<Duration>(30);
  const [shop, setShop] = useState("");
  const [code, setCode] = useState("");
  const [older, setOlder] = useState<string[]>([]);
  const [mode, setMode] = useState<"grant" | "freeze">("grant");
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<Drawn | null>(null);
  const [rows, setRows] = useState<Issued[]>(loadRegister);

  const clean = request.trim().toUpperCase();
  /* Either number a shop might read out: the till number on its own, or the
     full request code off the locked screen. */
  const isTillNumber = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(clean);
  const isRequestCode = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{4}$/.test(clean);
  // Stopping needs only the till number; letting them sell needs the rotating
  // code, because an unlock has to be spendable.
  const looksRight = mode === "freeze" ? isTillNumber || isRequestCode : isRequestCode;
  const ready = keyState.kind === "loaded" && looksRight;

  /* The QR code is the point of the whole long-code design, so it is drawn as
     soon as there is something to draw rather than behind a button. */
  useEffect(() => {
    if (!code) {
      setQr(null);
      return;
    }
    let cancelled = false;
    void drawQr(code).then((drawn) => {
      if (!cancelled) setQr(drawn);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  function clear() {
    setCode("");
    setOlder([]);
    setCopied(false);
  }

  async function issue() {
    if (keyState.kind !== "loaded") return;
    const made =
      mode === "freeze"
        ? await freezeCode(keyState.key, clean)
        : await unlockCode(keyState.key, clean, days);
    setCode(made);
    setCopied(false);

    /* The short codes a tablet still running the pre-signature build will
       accept. Shown underneath rather than instead: almost every tablet
       should be on the new file, and the old shapes are the fallback for the
       one that is not. */
    setOlder(
      mode === "freeze"
        ? await oldFreezeCodes(clean)
        : isRequestCode
          ? [await oldUnlockCode(clean, days)]
          : [],
    );

    const row: Issued = {
      request: mode === "freeze" ? tillPart(clean) : clean,
      shop: shop.trim(),
      code: groupCode(made),
      days,
      at: new Date().toISOString(),
      expires:
        mode === "freeze"
          ? Date.now()
          : days === 0
            ? null
            : Date.now() + days * 86400000,
      hold: mode === "freeze",
    };
    const next = [row, ...rows.filter((existing) => existing.request !== row.request)];
    setRows(next);
    saveRegister(next);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(groupCode(code));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard refused; the code is on screen to be selected by hand.
    }
  }

  function sendIt() {
    const label =
      mode === "freeze"
        ? `Stop code for till ${tillPart(clean)}`
        : `CoreCashier licence for till ${tillPart(clean)} — ${describeDuration(days).toLowerCase()}`;
    const message = `${label}\n\n${groupCode(code)}\n\nPaste the whole thing into the till, or point its camera at the square on my screen.`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener",
    );
  }

  return (
    <div className="mt-6">
      <KeyBox state={keyState} onState={setKeyState} />

      <section className="mt-6 rounded-2xl border border-[#1e2740] bg-[#0b1120] p-5">
        <h2 className="font-display text-[16px] font-semibold text-white">
          Approve a tablet
        </h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[#7e87a5]">
          The shop sends you the code on their locked screen. Paste it here,
          choose how long they get, and send the licence back.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
              {mode === "freeze"
                ? "Their till number, or request code"
                : "Their request code"}
            </span>
            <input
              value={request}
              onChange={(event) => {
                setRequest(event.target.value.toUpperCase());
                clear();
              }}
              placeholder={mode === "freeze" ? "3NR-LET" : "3NR-LET-7K2Q"}
              className="h-[46px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] px-3 font-mono text-[17px] tracking-[0.1em] text-white outline-none placeholder:text-[#3a4460] focus:border-[#6c7bf0]"
            />
            <span className="mt-1.5 block text-[12px] text-[#6b7490]">
              {mode === "freeze"
                ? "Either works. The till number is on their support report and in Settings → Help."
                : "The three-part code on their locked screen, or in Settings → Licence."}
            </span>
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

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("grant");
              clear();
            }}
            className={`flex h-[44px] items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold transition-colors ${
              mode === "grant"
                ? "border-[#6c7bf0] bg-[#6c7bf0]/15 text-white"
                : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460]"
            }`}
          >
            <KeyRound size={16} /> Let them sell
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("freeze");
              clear();
            }}
            className={`flex h-[44px] items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold transition-colors ${
              mode === "freeze"
                ? "border-[#5d3346] bg-[#180f16] text-[#f0879d]"
                : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460]"
            }`}
          >
            <Snowflake size={16} /> Stop this tablet
          </button>
        </div>

        <div className={`mt-3 flex flex-wrap gap-2 ${mode === "freeze" ? "hidden" : ""}`}>
          {DURATIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setDays(option);
                clear();
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
          disabled={!ready}
          onClick={() => void issue()}
          className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#6c7bf0] text-[15.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4] disabled:bg-[#2b3350] disabled:text-[#6b7490]"
        >
          {mode === "freeze" ? <Snowflake size={17} /> : <KeyRound size={17} />}
          {keyState.kind !== "loaded"
            ? "Open your key file first"
            : looksRight
              ? mode === "freeze"
                ? "Make the stop code"
                : "Make the licence"
              : isTillNumber
                ? "A licence needs their three-part request code"
                : "Paste their code first"}
        </button>

        {code ? (
          <div
            className={`mt-4 rounded-xl border px-4 py-4 ${
              mode === "freeze"
                ? "border-[#3d2230] bg-[#180f16]"
                : "border-[#1f4034] bg-[#0d2119]"
            }`}
          >
            <p
              className={`text-center text-[12px] font-semibold uppercase tracking-[0.08em] ${
                mode === "freeze" ? "text-[#f0a3b5]" : "text-[#78c9a3]"
              }`}
            >
              {mode === "freeze"
                ? "Send this to stop the tablet"
                : `Send this back — ${describeDuration(days).toLowerCase()}`}
            </p>

            {qr ? (
              <div className="mt-4 flex justify-center">
                <div className="rounded-xl bg-white p-3">
                  <svg
                    viewBox={`0 0 ${qr.size} ${qr.size}`}
                    className="h-[204px] w-[204px]"
                    shapeRendering="crispEdges"
                    role="img"
                    aria-label="The licence as a QR code"
                  >
                    <path d={qr.path} fill="#05060a" />
                  </svg>
                </div>
              </div>
            ) : null}

            <p className="mt-3 text-center text-[12.5px] text-[#7e87a5]">
              <QrCode size={13} className="inline" /> Let them point the till's
              camera at this, or send the text below.
            </p>

            <p
              dir="ltr"
              className={`mt-3 break-all rounded-lg bg-[#05060a]/60 p-3 text-center font-mono text-[12.5px] leading-relaxed tracking-[0.04em] ${
                mode === "freeze" ? "text-[#f0879d]" : "text-[#8ee7bb]"
              }`}
            >
              {groupCode(code)}
            </p>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => void copy()}
                className="inline-flex items-center gap-2 rounded-lg border border-[#1f4034] px-3 py-2 text-[13px] font-semibold text-[#8ee7bb] hover:border-[#2c5a47]"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy it"}
              </button>
              <button
                type="button"
                onClick={sendIt}
                className="inline-flex items-center gap-2 rounded-lg border border-[#232b40] px-3 py-2 text-[13px] font-semibold text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
              >
                <Send size={15} /> Send on WhatsApp
              </button>
              <button
                type="button"
                onClick={() =>
                  download(`licence-${tillPart(clean) || "till"}.txt`, groupCode(code))
                }
                className="inline-flex items-center gap-2 rounded-lg border border-[#232b40] px-3 py-2 text-[13px] font-semibold text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
              >
                <Download size={15} /> Save as a file
              </button>
            </div>

            {older.length > 0 ? (
              <details className="mt-4 border-t border-[#1f4034]/50 pt-3">
                <summary className="cursor-pointer text-[12.5px] font-semibold text-[#7e87a5]">
                  Their tablet refuses it? It is on the old build
                </summary>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#6b7490]">
                  Tablets built before licences were signed only understand the
                  old short codes. Send one of these, then get the new build
                  onto that tablet — the old codes are a password anyone who
                  takes the app apart can find, which is the whole reason for
                  the change.
                </p>
                {older.map((one) => (
                  <p
                    key={one}
                    dir="ltr"
                    className="mt-2 font-mono text-[15px] tracking-[0.1em] text-[#f0c078]"
                  >
                    {one}
                  </p>
                ))}
              </details>
            ) : null}
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
            {[...rows]
              .sort((a, b) => (a.expires ?? Infinity) - (b.expires ?? Infinity))
              .map((row) => {
                const lapsed = row.expires !== null && row.expires < Date.now();
                const days =
                  row.expires === null
                    ? null
                    : Math.ceil((row.expires - Date.now()) / 86400000);
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
                        {row.hold
                          ? "stopped"
                          : row.expires === null
                            ? "lifetime"
                            : lapsed
                              ? `lapsed ${new Date(row.expires).toLocaleDateString("en-GB")}`
                              : `${days} day${days === 1 ? "" : "s"} left · ${new Date(row.expires).toLocaleDateString("en-GB")}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`${row.hold ? "Allow" : "Hold"} ${row.request}`}
                      title="Mark this one not to renew"
                      onClick={() => {
                        const next = rows.map((other) =>
                          other === row ? { ...other, hold: !other.hold } : other,
                        );
                        setRows(next);
                        saveRegister(next);
                      }}
                      className={`shrink-0 rounded-lg p-2 ${row.hold ? "text-[#f0879d]" : "text-[#6b7490] hover:text-[#f0c078]"}`}
                    >
                      <Snowflake size={15} />
                    </button>
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
        and a part that changes each time. The licence you send back is a
        signature over that one request, so it cannot be passed to another
        tablet or used twice. When the date runs out the till drops to read-only
        and asks again.
        <br />
        <br />
        Why the codes are long. A licence is signed with the key in your key
        file, and the till carries only the public half — it can check a
        licence, it cannot make one, and neither can anyone who takes the till
        apart. The price is length: a signature is 103 characters however it is
        written down, and no algorithm makes it shorter. That is what the QR
        code is for. Nobody should ever be reading one of these aloud.
        <br />
        <br />
        The two numbers: a tablet's <em>till number</em> (3NR-LET) never
        changes and is on its support report; its <em>request code</em>
        (3NR-LET-7K2Q) is that number plus a part that rotates every time it
        asks. Stopping a tablet takes either. Letting one sell takes the full
        request code, because that is what makes a licence spendable — it is
        the rotation that stops last month's licence opening it again.
        <br />
        <br />
        Two ways to stop a shop. The quiet one is to issue short licences and
        not renew — the till drops to read-only on the date, and the snowflake
        on a row is your own reminder not to issue another. The direct one is a
        stop code, which locks that tablet the moment it is pasted in. Both
        need the shop to be on the other end of a phone: a stop code they never
        paste does nothing, and nothing reaches a tablet that does not want to
        be reached until there is a server to reach it with.
        <br />
        <br />
        What it still is not: nothing stops somebody editing the till's own
        code to skip the check. No cryptography on the device can — only
        holding the data on a server could, which is the Cloud plan.
        <br />
        <br />
        Keep your key file somewhere safe, and not only on this machine.
        Without it no new tablet can ever be activated.
        <br />
        <br />
        <span className="font-mono">Build {buildStamp()}</span> — a tablet's
        build is on its support report. If a code is refused and the two are
        far apart, that is the first thing to check.
      </p>
    </div>
  );
}
