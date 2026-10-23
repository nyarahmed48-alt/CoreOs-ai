/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Signing on, and counting the drawer at the end.
 *
 * A shop with nobody on its staff list never sees this: a one-person market is
 * not going to type a PIN to sell its own bread. The moment a second person
 * is added it appears, because from then on "who rang this up" has an answer
 * worth recording.
 *
 * Signing in opens a shift and asks what is in the drawer. That number is half
 * of the only calculation an owner really wants from a till — what the drawer
 * holds at closing time against what the day says it should.
 */

import { useState } from "react";
import { closeShift, expectedCash, signIn, usePos, useSession } from "./store";
import { amount, parseAmount } from "./money";
import { useT } from "./useT";
import { Button, Field, Modal } from "./ui";
import { formatTime } from "./i18n";

export function LockScreen() {
  const data = usePos();
  const { t, m } = useT();
  const people = data.staff.filter((person) => person.active);
  const [staffId, setStaffId] = useState(people[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [float, setFloat] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    const ok = await signIn(staffId, pin, float);
    setBusy(false);
    if (!ok) {
      setError(t("lock.wrongPin"));
      setPin("");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-[20px] font-bold text-white">
          {t("lock.title")}
        </h1>

        {people.length === 0 ? (
          <p className="mt-6 text-center text-[14px] text-[#98a0bb]">
            {t("lock.noStaff")}
          </p>
        ) : (
          <>
            <div className="mt-5 grid gap-2">
              {people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    setStaffId(person.id);
                    setError("");
                  }}
                  className={`flex h-[52px] items-center justify-between rounded-xl border px-4 text-[15px] font-semibold transition-colors ${
                    staffId === person.id
                      ? "border-[#6c7bf0] bg-[#6c7bf0]/15 text-white"
                      : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460]"
                  }`}
                >
                  <span>{person.name}</span>
                  <span className="text-[12px] font-medium text-[#6b7490]">
                    {t(person.role === "owner" ? "staff.owner" : "staff.cashier").split("—")[0]}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <Field
                label={t("lock.pin")}
                type="password"
                inputMode="numeric"
                autoFocus
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value.replace(/[^0-9]/g, "").slice(0, 8));
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && pin.length >= 4) void go();
                }}
              />
              <Field
                label={t("lock.float")}
                inputMode="numeric"
                value={float ? amount(float) : ""}
                placeholder="0"
                onChange={(event) => setFloat(parseAmount(event.target.value))}
              />
            </div>

            {error ? (
              <p className="mt-3 text-center text-[13.5px] text-[#f0879d]">{error}</p>
            ) : null}

            <Button
              variant="primary"
              className="mt-4 h-[52px] w-full text-[16px]"
              disabled={busy || pin.length < 4 || !staffId}
              onClick={() => void go()}
            >
              {t("lock.signIn")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/** Closing time: count the drawer, see the difference, sign out. */
export function CloseShiftModal({ onClose }: { onClose: () => void }) {
  const data = usePos();
  const { shift } = useSession();
  const { t, m } = useT();
  const [counted, setCounted] = useState(0);
  const expected = shift ? expectedCash(shift.id) : 0;
  const difference = counted - expected;

  if (!shift) return null;

  return (
    <Modal title={t("shift.close")} onClose={onClose}>
      <p className="text-[14px] text-[#98a0bb]">
        {t("shift.openedBy", {
          name: shift.staffName,
          time: formatTime(shift.openedAt),
        })}
      </p>

      <div className="mt-4">
        <Field
          label={t("shift.counted")}
          inputMode="numeric"
          autoFocus
          value={counted ? amount(counted) : ""}
          placeholder="0"
          onChange={(event) => setCounted(parseAmount(event.target.value))}
        />
      </div>

      <div className="mt-4 rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3">
        <div className="flex justify-between text-[14px] text-[#98a0bb]">
          <span>{t("shift.expected")}</span>
          <span className="text-[#e7eaf6]">{m(expected)}</span>
        </div>
        <p
          className={`mt-2 text-center font-display text-[20px] font-bold ${
            difference === 0
              ? "text-[#8ee7bb]"
              : difference > 0
                ? "text-[#f0c078]"
                : "text-[#f0879d]"
          }`}
        >
          {difference === 0
            ? t("shift.exact")
            : difference > 0
              ? t("shift.over", { amount: m(difference) })
              : t("shift.short", { amount: m(-difference) })}
        </p>
      </div>

      <Button
        variant="primary"
        className="mt-5 h-[50px] w-full"
        onClick={() => {
          closeShift(counted);
          onClose();
        }}
      >
        {t("shift.done")}
      </Button>
    </Modal>
  );
}
