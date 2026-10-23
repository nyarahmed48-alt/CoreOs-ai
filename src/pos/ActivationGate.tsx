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
import { KeyRound, Send } from "lucide-react";
import { checkCode, randomPart, requestCode } from "../activation";
import { usePos } from "./store";
import { useT } from "./useT";
import { buildStamp, whatsappNumber } from "./report";
import { Button, Field } from "./ui";

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
}

/** A lapsed licence has to ask with a *different* request code, or the shop
    simply types last month's unlock code back in and keeps the till for ever
    — which would make the expiry date decorative. Rotating the request is what
    actually spends a code. */
function lapse(): Activation {
  return { nonce: randomPart(4), until: null, activated: false };
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
    grant: (until: number | null) => {
      publish({ ...current, until, activated: true, frozen: false });
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
      });
    },
    /** A fresh request, so the next code is a different one. */
    reset: () => {
      publish({ nonce: randomPart(4), until: null, activated: false });
    },
  };
}

export function ActivationGate({
  nonce,
  frozen,
  onGranted,
  onFrozen,
}: {
  nonce: string;
  frozen?: boolean;
  onGranted: (until: number | null) => void;
  onFrozen: () => void;
}) {
  const data = usePos();
  const { t, dir } = useT();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const request = requestCode(data.settings.tillId, nonce);

  async function submit() {
    setBusy(true);
    const verdict = await checkCode(request, code);
    setBusy(false);
    if (!verdict) {
      setError(t("activate.wrong"));
      return;
    }
    if (verdict.kind === "freeze") {
      onFrozen();
      return;
    }
    onGranted(verdict.until);
  }

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
          {frozen ? t("activate.frozenBody") : t("activate.body")}
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

        <div className="mt-6">
          <Field
            label={t("activate.enterCode")}
            dir="ltr"
            autoCapitalize="characters"
            value={code}
            placeholder="30-XXXX-XXXX"
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submit();
            }}
          />
        </div>

        {error ? (
          <p className="mt-3 text-center text-[13.5px] text-[#f0879d]">{error}</p>
        ) : null}

        <Button
          variant="primary"
          className="mt-3 h-[50px] w-full"
          disabled={busy || code.length < 6}
          onClick={() => void submit()}
        >
          {t("activate.unlock")}
        </Button>

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
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const request = requestCode(data.settings.tillId, activation.state.nonce);
  const until = activation.state.until;

  async function apply() {
    setBusy(true);
    const verdict = await checkCode(request, code);
    setBusy(false);
    if (!verdict) {
      setError(t("licence.wrong"));
      return;
    }
    setError("");
    setCode("");
    if (verdict.kind === "freeze") {
      activation.freeze();
      return;
    }
    activation.grant(verdict.until);
    setNote(
      verdict.until === null
        ? t("licence.appliedNever")
        : t("licence.applied", {
            date: new Date(verdict.until).toLocaleDateString("en-GB"),
          }),
    );
  }

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
            {until === null
              ? t("licence.never")
              : new Date(until).toLocaleDateString(lang === "en" ? "en-GB" : "en-GB")}
          </span>
          {until === null ? null : ` · ${daysLeftLabel(until, t)}`}
        </p>
      </div>

      <Button className="w-full" onClick={askRenewal}>
        <Send size={16} /> {t("licence.renew")}
      </Button>

      <Field
        label={t("licence.enterCode")}
        dir="ltr"
        value={code}
        placeholder="30-XXXX-XXXX"
        onChange={(event) => {
          setCode(event.target.value.toUpperCase());
          setError("");
          setNote("");
        }}
      />
      {note ? <p className="text-[13px] text-[#8ee7bb]">{note}</p> : null}
      {error ? <p className="text-[13px] text-[#f0879d]">{error}</p> : null}
      <Button
        variant="primary"
        disabled={busy || code.length < 6}
        onClick={() => void apply()}
      >
        {t("licence.apply")}
      </Button>
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
