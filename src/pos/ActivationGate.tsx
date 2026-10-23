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

import { useEffect, useState } from "react";
import { KeyRound, Send } from "lucide-react";
import { checkUnlock, randomPart, requestCode } from "../activation";
import { usePos } from "./store";
import { useT } from "./useT";
import { whatsappNumber } from "./report";
import { Button, Field } from "./ui";

const STATE_KEY = "coreos.pos.activation.v1";

interface Activation {
  /** The random part of the current request. Changes each time the till has to
      ask again, so an old unlock code cannot be reused. */
  nonce: string;
  until: number | null;
  activated: boolean;
}

/** A lapsed licence has to ask with a *different* request code, or the shop
    simply types last month's unlock code back in and keeps the till for ever
    — which would make the expiry date decorative. Rotating the request is what
    actually spends a code. */
function lapse(): Activation {
  const fresh = { nonce: randomPart(4), until: null, activated: false };
  save(fresh);
  return fresh;
}

function load(): Activation {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const state = JSON.parse(raw) as Activation;
      const expired =
        state.activated && state.until !== null && state.until <= Date.now();
      return expired ? lapse() : state;
    }
  } catch {
    // Blocked storage means the till asks on every launch. That is the right
    // way round: a till that cannot remember being activated should not
    // assume it was.
  }
  return { nonce: randomPart(4), until: null, activated: false };
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

export function useActivation() {
  const [state, setState] = useState<Activation>(load);

  // A code that runs out while the till is open should lock it at the counter,
  // not quietly keep working until someone reloads.
  useEffect(() => {
    if (!state.activated || state.until === null) return;
    const left = state.until - Date.now();
    if (left <= 0) return;
    const timer = window.setTimeout(
      () => setState(lapse()),
      Math.min(left, 2 ** 31 - 1),
    );
    return () => window.clearTimeout(timer);
  }, [state.activated, state.until]);

  return {
    state,
    active: isActive(state),
    grant: (until: number | null) => {
      const next = { ...state, until, activated: true };
      save(next);
      setState(next);
    },
    /** A fresh request, so the next code is a different one. */
    reset: () => {
      const next = { nonce: randomPart(4), until: null, activated: false };
      save(next);
      setState(next);
    },
  };
}

export function ActivationGate({
  nonce,
  onGranted,
}: {
  nonce: string;
  onGranted: (until: number | null) => void;
}) {
  const data = usePos();
  const { t, dir } = useT();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const request = requestCode(data.settings.tillId, nonce);

  async function submit() {
    setBusy(true);
    const granted = await checkUnlock(request, code);
    setBusy(false);
    if (!granted) {
      setError(t("activate.wrong"));
      return;
    }
    onGranted(granted.until);
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
          {t("activate.title")}
        </h1>
        <p className="mt-2 text-center text-[14px] leading-relaxed text-[#98a0bb]">
          {t("activate.body")}
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
