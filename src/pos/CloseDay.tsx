/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The end of the day, on one screen.
 *
 * An owner asks one question at closing time — is the money in the drawer the
 * money the till says it took — and then, if the answer is no, asks why. So
 * the difference is the biggest thing here, and everything that could explain
 * it sits underneath: discounts given, sales voided, goods that left on the
 * book rather than for cash.
 *
 * It needs the owner's PIN, because a cashier who can sign off their own
 * drawer is a cashier whose drawer is never short.
 */

import { useState } from "react";
import { closeDay, closeFor, figuresFor, today, usePos } from "./store";
import { amount, parseAmount } from "./money";
import { useT } from "./useT";
import { ApprovalPrompt } from "./ApprovalPrompt";
import { Button, Field, Modal } from "./ui";
import { formatTime } from "./i18n";

export function CloseDayModal({ onClose }: { onClose: () => void }) {
  const data = usePos();
  const { t, m } = useT();
  const day = today();
  const figures = figuresFor(data, day);
  const already = closeFor(data, day);

  const [counted, setCounted] = useState(already?.countedCash ?? 0);
  const [approving, setApproving] = useState(false);
  const [done, setDone] = useState(false);

  const difference = counted - figures.expectedCash;

  return (
    <Modal title={t("close.title")} onClose={onClose} wide>
      {already ? (
        <p className="mb-3 rounded-xl border border-[#1f4034] bg-[#0d2119] px-4 py-2.5 text-[13px] text-[#8ee7bb]">
          {t("close.already", {
            time: formatTime(already.closedAt),
            amount: m(already.countedCash),
          })}
        </p>
      ) : null}

      <div className="rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3">
        <Row label={t("close.salesCount")} value={String(figures.sales)} />
        <Row label={t("close.cash")} value={m(figures.cash)} />
        <Row label={t("close.card")} value={m(figures.card)} />
        {figures.onBook > 0 ? (
          <Row label={t("close.onBook")} value={m(figures.onBook)} />
        ) : null}
        <Row label={t("close.gross")} value={m(figures.gross)} strong />
      </div>

      <div className="mt-2 rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3">
        <Row label={t("close.discounts")} value={m(figures.discounts)} />
        <Row
          label={t("close.voids")}
          value={`${figures.voids}${figures.voids ? ` · ${m(figures.voidedValue)}` : ""}`}
        />
        <Row label={t("close.float")} value={m(figures.openingFloat)} />
      </div>

      <div className="mt-4">
        <Field
          label={t("close.counted")}
          inputMode="numeric"
          autoFocus
          value={counted ? amount(counted) : ""}
          placeholder="0"
          onChange={(event) => setCounted(parseAmount(event.target.value))}
        />
      </div>

      <div className="mt-3 rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3">
        <Row label={t("close.expected")} value={m(figures.expectedCash)} />
        <p
          className={`mt-2 text-center font-display text-[22px] font-bold ${
            difference === 0
              ? "text-[#8ee7bb]"
              : difference > 0
                ? "text-[#f0c078]"
                : "text-[#f0879d]"
          }`}
        >
          {difference === 0
            ? t("close.exact")
            : difference > 0
              ? t("close.over", { amount: m(difference) })
              : t("close.short", { amount: m(-difference) })}
        </p>
      </div>

      {done ? (
        <p className="mt-3 text-center text-[13.5px] text-[#8ee7bb]">{t("close.saved")}</p>
      ) : (
        <Button
          variant="primary"
          className="mt-4 h-[50px] w-full"
          onClick={() => setApproving(true)}
        >
          {t("close.save")}
        </Button>
      )}

      {approving ? (
        <ApprovalPrompt
          title={t("close.title")}
          needReason={false}
          onClose={() => setApproving(false)}
          onApproved={(approvedBy) => {
            closeDay(day, counted, approvedBy);
            setApproving(false);
            setDone(true);
          }}
        />
      ) : null}
    </Modal>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between py-0.5 text-[14px]">
      <span className="text-[#98a0bb]">{label}</span>
      <span className={strong ? "font-semibold text-white" : "text-[#e7eaf6]"}>
        {value}
      </span>
    </div>
  );
}
