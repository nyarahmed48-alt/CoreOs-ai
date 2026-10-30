/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Cloud edition's front door, and the loop behind it.
 *
 * A Cloud till is locked in the only way a subscription can honestly be
 * locked: it has to sign in to a CoreOs account before it will sell anything.
 * There is no offline fallback into a free till, because that is exactly the
 * thing the subscription is instead of.
 *
 * After that it behaves like a shop, not like a web page. It sells with the
 * wifi out, all day if need be, and pushes the books up whenever the network
 * comes back. The office can stop it from a desk, and the stop lands within a
 * couple of minutes of the tablet next seeing the internet. If the tablet has
 * not seen the office for longer than the grace period, it stops selling on
 * its own — otherwise unplugging the wifi would be a way to keep a frozen
 * till working for ever.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { CloudOff, LogIn } from "lucide-react";
import {
  CloudError,
  checkStanding,
  knownShop,
  pushBook,
  refreshShop,
  session,
  signIn,
  signOut,
  type CloudFault,
  type Shop,
} from "./cloud";
import { CHECK_IN_MS } from "./cloudConfig";
import { scoped } from "./edition";
import { exportSnapshot, flushed, usePos } from "./store";
import { useT } from "./useT";
import { buildStamp } from "./report";
import { Button, Field } from "./ui";

const SEEN_KEY = scoped("coreos.pos.cloud.seen.v1");

export interface CloudState {
  shop: Shop | null;
  /** When the office last answered. */
  lastSeen: number | null;
  /** What the last push or check-in ran into, if anything. */
  trouble: CloudFault | null;
  busy: boolean;
}

function lastSeen(): number | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function sawOffice() {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {
    // A till that cannot remember is a till that asks again.
  }
}

let current: CloudState = {
  shop: knownShop(),
  lastSeen: lastSeen(),
  trouble: null,
  busy: false,
};
const listeners = new Set<() => void>();

function publish(next: Partial<CloudState>) {
  current = { ...current, ...next };
  for (const listener of listeners) listener();
}

export function useCloud(): CloudState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => current,
  );
}

export function signedIn(): boolean {
  return session() !== null && knownShop() !== null;
}

/** What the office's answer means for this till right now. */
export type CloudVerdict =
  | { state: "fine" }
  | { state: "frozen"; message: string }
  | { state: "lapsed" }
  | { state: "outOfTouch"; days: number };

export function verdict(state: CloudState, now = Date.now()): CloudVerdict {
  const { shop } = state;
  if (!shop) return { state: "fine" };
  if (shop.frozen) return { state: "frozen", message: shop.frozenMessage };
  if (shop.until !== null && shop.until <= now) return { state: "lapsed" };
  if (state.lastSeen !== null && shop.graceDays > 0) {
    const days = Math.floor((now - state.lastSeen) / 86_400_000);
    if (days > shop.graceDays) return { state: "outOfTouch", days };
  }
  return { state: "fine" };
}

/**
 * One trip to the office: push whatever is waiting, then ask where we stand.
 *
 * Never throws. Everything it can run into is a thing the shop carries on
 * through, and the one that is not — being signed out — is handled by putting
 * the sign-in screen back rather than by an exception nobody catches.
 */
export async function syncNow(everything = false): Promise<void> {
  if (!signedIn()) return;
  publish({ busy: true });
  try {
    /* Sales that are still in the write queue are sales the office should
       have. Waiting for the disk costs milliseconds and saves a round. */
    await flushed();
    await pushBook(exportSnapshot(), everything);
    const standing = await checkStanding();
    sawOffice();
    publish({
      shop: knownShop()
        ? { ...knownShop()!, frozen: standing.frozen, frozenMessage: standing.message, until: standing.until, graceDays: standing.graceDays }
        : null,
      lastSeen: Date.now(),
      trouble: null,
      busy: false,
    });
  } catch (problem) {
    const fault = problem instanceof CloudError ? problem.fault : "server";
    if (fault === "signedOut") signOut();
    publish({
      trouble: fault,
      busy: false,
      shop: fault === "signedOut" ? null : current.shop,
    });
  }
}

/** Starts the conversation and keeps it going while the till is open. */
export function watchCloud(): () => void {
  let stopped = false;
  const tick = () => {
    if (!stopped) void syncNow();
  };
  tick();
  const timer = window.setInterval(tick, CHECK_IN_MS);
  /* A tablet that has been asleep on a counter all night, or one whose wifi
     just came back, asks at once rather than waiting out the interval. */
  window.addEventListener("online", tick);
  document.addEventListener("visibilitychange", tick);
  return () => {
    stopped = true;
    window.clearInterval(timer);
    window.removeEventListener("online", tick);
    document.removeEventListener("visibilitychange", tick);
  };
}

/* ----------------------------------------------------------- the sign-in */

export function CloudGate({ onIn }: { onIn: () => void }) {
  const { t, dir } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!email.trim() || !password) return;
    setBusy(true);
    setError("");
    try {
      const shop = await signIn(email, password);
      publish({ shop, trouble: null });
      sawOffice();
      publish({ lastSeen: Date.now() });
      onIn();
    } catch (problem) {
      const fault = problem instanceof CloudError ? problem.fault : "server";
      setError(t(`cloud.${fault}` as "cloud.server"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      dir={dir}
      className="flex min-h-[100dvh] items-center justify-center bg-[#05060a] px-5 py-10 text-[#e7eaf6]"
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#232b40] text-[#6c7bf0]">
            <LogIn size={20} />
          </span>
        </div>

        <h1 className="mt-5 text-center font-display text-[20px] font-bold text-white">
          {t("cloud.title")}
        </h1>
        <p className="mt-2 text-center text-[14px] leading-relaxed text-[#98a0bb]">
          {t("cloud.body")}
        </p>

        <div className="mt-6 grid gap-3">
          <Field
            label={t("cloud.email")}
            dir="ltr"
            type="email"
            autoCapitalize="none"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />
          <Field
            label={t("cloud.password")}
            dir="ltr"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submit();
            }}
          />
          {error ? (
            <p className="text-[13.5px] leading-relaxed text-[#f0879d]">{error}</p>
          ) : null}
          <Button
            variant="primary"
            className="h-[50px] w-full"
            disabled={busy || !email.trim() || !password}
            onClick={() => void submit()}
          >
            {busy ? t("cloud.signingIn") : t("cloud.signIn")}
          </Button>
        </div>

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-[#6b7490]">
          {t("cloud.noAccount")}
        </p>
        <p dir="ltr" className="mt-3 text-center font-mono text-[11.5px] text-[#4e576f]">
          build {buildStamp()}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------- the panel in Settings */

export function CloudPanel() {
  const data = usePos();
  const { t } = useT();
  const state = useCloud();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const who = session();

  async function pushEverything() {
    setBusy(true);
    setNote("");
    try {
      await flushed();
      const counts = await pushBook(data, true);
      await refreshShop();
      sawOffice();
      publish({ lastSeen: Date.now(), trouble: null });
      setNote(
        t("cloud.pushed", {
          sales: counts.sales,
          products: counts.products,
        }),
      );
    } catch (problem) {
      const fault = problem instanceof CloudError ? problem.fault : "server";
      setNote(t(`cloud.${fault}` as "cloud.server"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
          {t("cloud.shop")}
        </p>
        <p className="mt-1 text-[16px] font-semibold text-white">
          {state.shop?.name ?? "—"}
        </p>
        <p dir="ltr" className="mt-1 text-[12.5px] text-[#6b7490]">
          {who?.email ?? ""}
        </p>
        <p className="mt-2 text-[13px] text-[#98a0bb]">
          {t("cloud.lastSync")}:{" "}
          {state.lastSeen
            ? new Date(state.lastSeen).toLocaleString("en-GB")
            : t("cloud.never")}
        </p>
        {state.trouble ? (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#f0c078]">
            <CloudOff size={14} /> {t(`cloud.${state.trouble}` as "cloud.server")}
          </p>
        ) : null}
      </div>

      <p className="text-[13px] leading-relaxed text-[#7e87a5]">
        {t("cloud.pushAllHint")}
      </p>
      <Button disabled={busy} onClick={() => void pushEverything()}>
        {busy ? t("cloud.pushing") : t("cloud.pushAll")}
      </Button>
      {note ? <p className="text-[13px] text-[#8ee7bb]">{note}</p> : null}

      <Button
        variant="quiet"
        onClick={() => {
          signOut();
          publish({ shop: null, lastSeen: null, trouble: null });
        }}
      >
        {t("cloud.signOut")}
      </Button>
    </>
  );
}
