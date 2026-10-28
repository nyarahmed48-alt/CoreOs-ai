/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The screen a new tablet opens on.
 *
 * It shows what the shop has to send — the request code — and takes back the
 * unlock code the office returns. One WhatsApp button does the sending, since
 * that is how a shop in Baghdad reaches anyone, and the code is big enough to
 * read down a phone line if the message does not go through.
 *
 * Nothing behind this screen runs until it passes: no selling, no reports, no
 * settings. The one thing it never blocks is the shop's own data — a till that
 * has lapsed still holds its sales, and activating it again brings them back
 * untouched.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { ClipboardPaste, KeyRound, ScanLine, Send } from "lucide-react";
import {
  canVerify,
  checkCode,
  randomPart,
  requestCode,
  type Verdict,
} from "../activation";
import { CameraScanner } from "./CameraScanner";
import { cached, standing, watchLicence, type Known } from "./licenceServer";
import { usePos } from "./store";
import { useT } from "./useT";
import { buildStamp, whatsappNumber } from "./report";
import { Button } from "./ui";

const STATE_KEY = "coreos.pos.activation.v1";

interface Activation {
  /** The random part of the current request. Changes each time the till has to
      ask again, so an old unlock code cannot be reused. */
  nonce: string;
  until: number | null;
  activated: boolean;
  /** Set when the office froze this tablet, so the locked screen can say so
      rather than letting the shop think the till has broken. */
  frozen?: boolean;
  /** The offline plan, bought outright. No expiry, and nothing to do with
      checking in with anybody: a shop that paid once is not a shop to lock
      because a server somewhere cannot be reached. */
  lifetime?: boolean;
}

/** A lapsed licence has to ask with a *different* request code, or the shop
    simply types last month's unlock code back in and keeps the till for ever
    — which would make the expiry date decorative. Rotating the request is what
    actually spends a code. */
function lapse(): Activation {
  return { nonce: randomPart(4), until: null, activated: false, lifetime: false };
}

function load(): Activation {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const state = JSON.parse(raw) as Activation;
      const expired =
        state.activated && state.until !== null && state.until <= Date.now();
      if (!expired) return state;
      const lapsed = lapse();
      save(lapsed);
      return lapsed;
    }
  } catch {
    // Blocked storage means the till asks on every launch. That is the right
    // way round: a till that cannot remember being activated should not
    // assume it was.
  }
  /* Written out the moment it is made. A request code that changed every time
     the tablet was switched on would mean the code the office just issued
     stopped matching before the shop could type it in. */
  const fresh = { nonce: randomPart(4), until: null, activated: false };
  save(fresh);
  return fresh;
}

function save(state: Activation) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // See above.
  }
}

/** True while the till is allowed to work. */
export function isActive(state: Activation): boolean {
  if (!state.activated) return false;
  return state.until === null || state.until > Date.now();
}

/** True for a till on the lifetime offline plan, which never lapses. */
export function isLifetime(state: Activation): boolean {
  return state.activated && state.lifetime === true && state.until === null;
}

/* One copy of this for the whole app, not one per component. The licence
   panel in Settings and the gate that covers the screen are different
   components reading the same fact, and when a stop code is typed into the
   first the second has to know immediately — with a copy each, the code was
   accepted and nothing happened. */
let current: Activation = load();
const listeners = new Set<() => void>();

function publish(next: Activation) {
  current = next;
  save(next);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** What the office last said, if it has said anything. */
let remote: Known = cached();
const remoteListeners = new Set<() => void>();

export function publishRemote(next: Known) {
  remote = next;
  for (const listener of remoteListeners) listener();
}

export function useRemote(): Known {
  return useSyncExternalStore(
    (listener) => {
      remoteListeners.add(listener);
      return () => remoteListeners.delete(listener);
    },
    () => remote,
    () => remote,
  );
}

export function useActivation() {
  const state = useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );

  // A code that runs out while the till is open should lock it at the counter,
  // not quietly keep working until someone reloads.
  useEffect(() => {
    if (!state.activated || state.until === null) return;
    const left = state.until - Date.now();
    if (left <= 0) return;
    const timer = window.setTimeout(
      () => publish(lapse()),
      Math.min(left, 2 ** 31 - 1),
    );
    return () => window.clearTimeout(timer);
  }, [state.activated, state.until]);

  return {
    state,
    active: isActive(state),
    grant: (until: number | null, lifetime = false) => {
      publish({ ...current, until, activated: true, frozen: false, lifetime });
    },
    /** The office pulled this tablet. The request rotates with it, so the code
        that froze it cannot be run backwards and nothing but a new code from
        the office will open it. */
    freeze: () => {
      publish({
        nonce: randomPart(4),
        until: null,
        activated: false,
        frozen: true,
        lifetime: false,
      });
    },
    /** A fresh request, so the next code is a different one. */
    reset: () => {
      publish(lapse());
    },
  };
}


/**
 * Taking a licence code in, however it arrives.
 *
 * A licence is a signature, so it is a hundred-odd characters long — there is
 * no public-key scheme that fits one into something a shop can read down a
 * phone line, and this is the honest consequence of not having a password
 * hidden in the app. So the shop almost never types it:
 *
 *  - **Scan** the square on the owner's screen. One tap, nothing typed, and
 *    the camera is already in the till for barcodes.
 *  - **Paste** it out of WhatsApp, which is how the message arrived.
 *  - **Type** it, which works, and is the last resort.
 *
 * Dashes, spaces, line breaks and the letters people get wrong off a screen
 * are all forgiven by the checker, so a code that has been through three apps
 * and a notepad still goes in.
 */
function CodeEntry({
  request,
  label,
  onVerdict,
}: {
  request: string;
  label: string;
  onVerdict: (verdict: Verdict) => void;
}) {
  const { t } = useT();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const secure = canVerify();

  async function submit(text: string) {
    setBusy(true);
    const verdict = await checkCode(request, text);
    setBusy(false);
    if (verdict.kind === "noCrypto") {
      setError(t("activate.noCrypto"));
      return;
    }
    if (verdict.kind === "bad") {
      setError(t("activate.wrong"));
      return;
    }
    setError("");
    setCode("");
    onVerdict(verdict);
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      setCode(text.trim());
      await submit(text);
    } catch {
      /* Clipboard read refused — common on a page opened from a file. The
         box is right there to paste into by hand. */
      setError(t("activate.pasteBlocked"));
    }
  }

  /* Said up front, not after a code has been typed in and rejected. A till
     that cannot check a signature will never accept any code, and the shop
     needs to know that before they start reading one out. */
  if (!secure) {
    return (
      <p className="rounded-xl border border-[#5d3346] bg-[#180f16] px-4 py-3 text-[13.5px] leading-relaxed text-[#f0a3b5]">
        {t("activate.noCrypto")}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Button className="h-[46px]" onClick={() => setScanning(true)}>
          <ScanLine size={16} /> {t("activate.scan")}
        </Button>
        <Button className="h-[46px]" onClick={() => void paste()}>
          <ClipboardPaste size={16} /> {t("activate.paste")}
        </Button>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-[#98a0bb]">
          {label}
        </span>
        <textarea
          dir="ltr"
          rows={3}
          spellCheck={false}
          autoCapitalize="characters"
          value={code}
          placeholder="30-XXXXXX-XXXXXX-…"
          onChange={(event) => {
            setCode(event.target.value);
            setError("");
          }}
          className="w-full resize-none rounded-xl border border-[#232b40] bg-[#0a0f1c] px-3 py-2.5 font-mono text-[13px] leading-relaxed tracking-[0.04em] text-white outline-none placeholder:text-[#3a4460] focus:border-[#6c7bf0]"
        />
        <span className="mt-1.5 block text-[12px] leading-relaxed text-[#6b7490]">
          {t("activate.codeHelp")}
        </span>
      </label>

      {error ? (
        <p className="text-[13.5px] leading-relaxed text-[#f0879d]">{error}</p>
      ) : null}

      <Button
        variant="primary"
        className="h-[50px] w-full"
        disabled={busy || code.trim().length < 20}
        onClick={() => void submit(code)}
      >
        {t("activate.unlock")}
      </Button>

      {scanning ? (
        <CameraScanner
          title={t("activate.scanTitle")}
          mode="once"
          symbols="qr"
          onCode={(scanned) => {
            setCode(scanned);
            setScanning(false);
            void submit(scanned);
            return t("activate.scanned");
          }}
          onClose={() => setScanning(false)}
        />
      ) : null}
    </>
  );
}

export function ActivationGate({
  nonce,
  frozen,
  officeMessage,
  onGranted,
  onFrozen,
}: {
  nonce: string;
  frozen?: boolean;
  /** Why the office locked it, where the office said. */
  officeMessage?: string;
  onGranted: (until: number | null, lifetime: boolean) => void;
  onFrozen: () => void;
}) {
  const data = usePos();
  const { t, dir } = useT();

  const request = requestCode(data.settings.tillId, nonce);

  function ask() {
    const message = `${t("activate.message")}\n\n${request}\n\n${data.settings.shopName}`;
    const number = whatsappNumber(data.settings.supportPhone);
    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <div
      dir={dir}
      className="flex min-h-[100dvh] items-center justify-center bg-[#05060a] px-5 py-10 text-[#e7eaf6]"
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#232b40] text-[#6c7bf0]">
            <KeyRound size={20} />
          </span>
        </div>

        <h1 className="mt-5 text-center font-display text-[20px] font-bold text-white">
          {frozen ? t("activate.frozenTitle") : t("activate.title")}
        </h1>
        <p className="mt-2 text-center text-[14px] leading-relaxed text-[#98a0bb]">
          {officeMessage ?? (frozen ? t("activate.frozenBody") : t("activate.body"))}
        </p>

        <div className="mt-6 rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-4 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
            {t("activate.yourCode")}
          </p>
          <p
            dir="ltr"
            className="mt-2 font-mono text-[24px] font-semibold tracking-[0.14em] text-white"
          >
            {request}
          </p>
        </div>

        <Button variant="primary" className="mt-3 h-[50px] w-full" onClick={ask}>
          <Send size={16} /> {t("activate.send")}
        </Button>

        <div className="mt-6 grid gap-3">
          <CodeEntry
            request={request}
            label={t("activate.enterCode")}
            onVerdict={(verdict) => {
              if (verdict.kind === "freeze") {
                onFrozen();
                return;
              }
              onGranted(verdict.until, verdict.lifetime);
            }}
          />
        </div>

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-[#6b7490]">
          {t("activate.dataSafe")}
        </p>
      </div>
    </div>
  );
}


/**
 * The licence, seen from inside a working till.
 *
 * A shop cannot ask for a renewal if the only place its code appears is the
 * screen it gets *after* being locked out, so it is here too, with the date it
 * runs out and one button to ask for more. The same box takes a freeze code:
 * that is how a tablet is handed back or a licence moved to a new one.
 */
export function LicencePanel() {
  const data = usePos();
  const { t, lang } = useT();
  const activation = useActivation();
  const [note, setNote] = useState("");

  const request = requestCode(data.settings.tillId, activation.state.nonce);
  const until = activation.state.until;
  const lifetime = isLifetime(activation.state);

  function askRenewal() {
    const message = `${t("licence.renewMessage")}\n\n${request}\n\n${data.settings.shopName}`;
    const number = whatsappNumber(data.settings.supportPhone);
    window.open(
      number
        ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener",
    );
  }

  return (
    <>
      <div className="rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
          {t("licence.code")}
        </p>
        <p dir="ltr" className="mt-1 font-mono text-[20px] tracking-[0.12em] text-white">
          {request}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#6b7490]">
          {t("licence.codeHint")}
        </p>
        <p dir="ltr" className="mt-2 font-mono text-[11.5px] text-[#4e576f]">
          build {buildStamp()}
        </p>
        <p className="mt-2 text-[13px] text-[#98a0bb]">
          {t("licence.expires")}:{" "}
          <span dir="ltr">
            {lifetime
              ? t("licence.lifetime")
              : until === null
                ? t("licence.never")
                : new Date(until).toLocaleDateString(lang === "en" ? "en-GB" : "en-GB")}
          </span>
          {until === null ? null : ` · ${daysLeftLabel(until, t)}`}
        </p>
      </div>

      <Button className="w-full" onClick={askRenewal}>
        <Send size={16} /> {t("licence.renew")}
      </Button>

      <CodeEntry
        request={request}
        label={t("licence.enterCode")}
        onVerdict={(verdict) => {
          setNote("");
          if (verdict.kind === "freeze") {
            activation.freeze();
            return;
          }
          activation.grant(verdict.until, verdict.lifetime);
          setNote(
            verdict.lifetime
              ? t("licence.appliedLifetime")
              : verdict.until === null
                ? t("licence.appliedNever")
                : t("licence.applied", {
                    date: new Date(verdict.until).toLocaleDateString("en-GB"),
                  }),
          );
        }}
      />
      {note ? <p className="text-[13px] text-[#8ee7bb]">{note}</p> : null}
    </>
  );
}

function daysLeftLabel(until: number, t: (key: "licence.daysLeft" | "licence.lastDay", vars?: Record<string, string | number>) => string): string {
  const days = Math.ceil((until - Date.now()) / 86400000);
  return days <= 1 ? t("licence.lastDay") : t("licence.daysLeft", { n: days });
}

/** How many days are left, for the warning strip in the header. */
export function daysLeft(until: number | null): number | null {
  if (until === null) return null;
  return Math.ceil((until - Date.now()) / 86400000);
}
