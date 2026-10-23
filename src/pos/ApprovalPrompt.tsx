/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The owner's PIN, and the reason.
 *
 * Voids and discounts are where a till leaks. Neither is wrong — a customer
 * changes their mind, a box is dented — so the answer is not to forbid them
 * but to make each one cost an owner's PIN and a sentence. Both go into the
 * log, and the sentence is the part an owner actually reads at the end of the
 * week.
 */

import { useState } from "react";
import { findOwnerByPin, usePos } from "./store";
import { useT } from "./useT";
import { Button, Field, Modal } from "./ui";

export function ApprovalPrompt({
  title,
  needReason = true,
  onApproved,
  onClose,
}: {
  title: string;
  needReason?: boolean;
  /** Hands back the owner who approved, and why, for the log. */
  onApproved: (approvedBy: string, reason: string) => void;
  onClose: () => void;
}) {
  const data = usePos();
  const { t } = useT();
  const [pin, setPin] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  /* A shop that has not set up staff yet still gets the question about why —
     the reason is for the owner's own reading — but there is no PIN to ask
     for, because there is nobody to ask. */
  const hasOwners = data.staff.some((person) => person.role === "owner" && person.active);

  async function go() {
    if (needReason && !reason.trim()) {
      setError(t("approve.needReason"));
      return;
    }
    if (!hasOwners) {
      onApproved("", reason.trim());
      return;
    }
    setBusy(true);
    const owner = await findOwnerByPin(pin);
    setBusy(false);
    if (!owner) {
      setError(t("approve.wrong"));
      setPin("");
      return;
    }
    onApproved(owner.name, reason.trim());
  }

  return (
    <Modal title={title} onClose={onClose}>
      {needReason ? (
        <Field
          label={t("approve.why")}
          autoFocus
          value={reason}
          placeholder={t("approve.whyPlaceholder")}
          onChange={(event) => {
            setReason(event.target.value);
            setError("");
          }}
        />
      ) : null}

      {hasOwners ? (
        <div className={needReason ? "mt-3" : ""}>
          <Field
            label={t("approve.pin")}
            type="password"
            inputMode="numeric"
            autoFocus={!needReason}
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/[^0-9]/g, "").slice(0, 8));
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void go();
            }}
          />
        </div>
      ) : null}

      {error ? <p className="mt-3 text-[13.5px] text-[#f0879d]">{error}</p> : null}

      <Button
        variant="primary"
        className="mt-4 h-[50px] w-full"
        disabled={busy || (hasOwners && pin.length < 4)}
        onClick={() => void go()}
      >
        {t("approve.go")}
      </Button>
    </Modal>
  );
}
