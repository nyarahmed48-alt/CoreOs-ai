/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Letting CoreOS in, and showing the shop exactly who is in.
 *
 * This panel is deliberately in the shop's own Settings rather than behind
 * anything: the owner is the one who can see that a session is open, who
 * opened it and when it closes, and the one who can close it. There is no
 * PIN here and there is not going to be one — a PIN gets shared, watched over
 * a shoulder and never expires, which is the whole reason for the key.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { ScanLine, ShieldCheck, Wrench } from "lucide-react";
import { CameraScanner } from "./CameraScanner";
import { usePos } from "./store";
import { useT } from "./useT";
import { formatTime } from "./i18n";
import { Button, Field } from "./ui";
import {
  can,
  finish,
  session,
  subscribe,
  unlock,
  watchSession,
} from "./technician";
import type { Scope } from "./techkey";

/** The open session, if there is one, kept in step across every screen. */
export function useTechnician() {
  return useSyncExternalStore(subscribe, session, session);
}

export function useTechnicianScope(scope: Scope): boolean {
  useTechnician();
  return can(scope);
}

const SCOPE_LABEL = {
  details: "tech.scope.details",
  simulate: "tech.scope.simulate",
  device: "tech.scope.device",
  settings: "tech.scope.settings",
} as const satisfies Record<Scope, string>;

export function TechnicianPanel() {
  const data = usePos();
  const { t } = useT();
  const open = useTechnician();
  const [text, setText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);

  /* Watch the clock while this screen is up. The session also closes itself
     from the shell, so leaving Settings does not keep it alive. */
  useEffect(() => watchSession(), []);

  /* A key can arrive as a link: everything after the # stays in the browser
     and never reaches a server, which is the point of putting it there. */
  useEffect(() => {
    const hash = typeof location === "undefined" ? "" : location.hash;
    const match = hash.match(/[#&]tk=([^&]+)/);
    if (!match) return;
    const carried = decodeURIComponent(match[1]);
    history.replaceState(null, "", location.href.split("#")[0]);
    void submit(carried);
    // Once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(key: string) {
    if (!key.trim()) return;
    setBusy(true);
    setProblem("");
    const verdict = await unlock(key, data.settings.tillId);
    setBusy(false);
    /* Narrowed on the field rather than on `ok`: this project compiles
       without `strict`, and without strictNullChecks TypeScript will not
       narrow a union on a boolean discriminant. */
    if (!("why" in verdict)) {
      setText("");
      return;
    }
    /* A plain sentence for each refusal, in the shop's own language. The
       owner is standing there too, and "this key was not issued by CoreOS"
       is something they are entitled to understand. */
    setProblem(t(`tech.bad.${verdict.why}` as "tech.bad.signature"));
  }

  if (open) {
    return (
      <>
        <div className="rounded-xl border border-[#1f4034] bg-[#0d2119] px-4 py-3">
          <p className="flex items-center gap-2 text-[14.5px] font-semibold text-[#8ee7bb]">
            <ShieldCheck size={16} />
            {t("tech.in", { name: open.technician || "CoreOS" })}
          </p>
          <p className="mt-1.5 text-[13px] text-[#78c9a3]">
            {t("tech.unlocked", {
              list: open.scopes.map((scope) => t(SCOPE_LABEL[scope])).join("، "),
            })}
          </p>
          <p className="mt-1 text-[13px] text-[#78c9a3]">
            {t("tech.until", { time: formatTime(new Date(open.expires).toISOString()) })}
          </p>
        </div>
        <Button variant="quiet" onClick={() => finish("ended")}>
          {t("tech.end")}
        </Button>
      </>
    );
  }

  return (
    <>
      <p className="text-[13px] leading-relaxed text-[#7e87a5]">{t("tech.hint")}</p>

      <Button onClick={() => setScanning(true)}>
        <ScanLine size={16} /> {t("tech.scan")}
      </Button>

      <Field
        label={t("tech.pasteLabel")}
        dir="ltr"
        value={text}
        placeholder="TK-…"
        onChange={(event) => {
          setText(event.target.value);
          setProblem("");
        }}
      />
      {problem ? (
        <p className="text-[13px] leading-relaxed text-[#f0879d]">{problem}</p>
      ) : null}
      <Button
        variant="primary"
        disabled={busy || text.trim().length < 20}
        onClick={() => void submit(text)}
      >
        <Wrench size={16} /> {t("tech.open")}
      </Button>

      {scanning ? (
        <CameraScanner
          title={t("tech.scanTitle")}
          mode="once"
          symbols="qr"
          onCode={(scanned) => {
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
