/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * الدفتر — the book.
 *
 * Neighbourhood shops in Iraq sell on credit and keep it in a notebook: a name,
 * a running total, and whatever was paid off on Thursday. The notebook gets
 * lost, argued with, and read by whoever picks it up. This is the same thing,
 * with the arithmetic done for you and every line stamped with who wrote it.
 *
 * Deliberately not a ledger with accounts and journals. It answers the three
 * questions a shopkeeper actually asks — who owes me, how much, and what did
 * they pay — and nothing else.
 */

import { useMemo, useState } from "react";
import { Phone, Plus, Search, UserPlus } from "lucide-react";
import {
  balanceOf,
  totalOwed,
  recordPayment,
  saveCustomer,
  usePos,
  useReadOnly,
} from "./store";
import { amount, parseAmount } from "./money";
import { useT } from "./useT";
import { Button, Empty, Field, Modal } from "./ui";
import { formatDateTime } from "./i18n";
import type { Customer } from "./types";

export function DebtView() {
  const data = usePos();
  const { t, m } = useT();
  const readOnly = useReadOnly();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Customer | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.customers
      .map((customer) => ({ customer, balance: balanceOf(data, customer.id) }))
      .filter(
        ({ customer }) =>
          !needle ||
          customer.name.toLowerCase().includes(needle) ||
          customer.phone.includes(needle),
      )
      // Biggest debt first: that is the list an owner wants to work down.
      .sort((a, b) => b.balance - a.balance);
  }, [data, query]);

  const owed = totalOwed(data);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-5">
        <div className="rounded-2xl border border-[#1e2740] bg-[#0b1120] px-4 py-4 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
            {t("debt.owedTotal")}
          </p>
          <p className="mt-1 font-display text-[30px] font-bold text-[#f0c078]">
            {m(owed)}
          </p>
          <p className="mt-1 text-[13px] text-[#7e87a5]">
            {t("debt.customers", { n: data.customers.length })}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-[#5b6480]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("debt.search")}
              aria-label={t("debt.search")}
              className="h-[42px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] ps-10 pe-3 text-[15px] text-[#e7eaf6] outline-none placeholder:text-[#5b6480] focus:border-[#6c7bf0]"
            />
          </div>
          {readOnly ? null : (
            <Button variant="primary" onClick={() => setAdding(true)}>
              <UserPlus size={16} /> {t("debt.add")}
            </Button>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[#1e2740]">
          {rows.length === 0 ? (
            <Empty>{t("debt.none")}</Empty>
          ) : (
            <ul className="divide-y divide-[#141b2d]">
              {rows.map(({ customer, balance }) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(customer)}
                    className="flex w-full items-center gap-3 bg-[#0b1120] px-4 py-3 text-start hover:bg-[#111830]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-medium text-[#e7eaf6]">
                        {customer.name}
                      </p>
                      {customer.phone ? (
                        <p
                          dir="ltr"
                          className="mt-0.5 flex items-center gap-1 text-[12.5px] text-[#6b7490]"
                        >
                          <Phone size={12} /> {customer.phone}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 font-display text-[15px] font-semibold ${
                        balance > 0 ? "text-[#f0c078]" : "text-[#6b7490]"
                      }`}
                    >
                      {balance > 0 ? m(balance) : t("debt.settled")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {adding ? (
        <CustomerForm onClose={() => setAdding(false)} onSaved={() => setAdding(false)} />
      ) : null}
      {open ? <CustomerPage customer={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

export function CustomerForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  return (
    <Modal title={t("debt.add")} onClose={onClose}>
      <div className="space-y-3">
        <Field
          label={t("debt.name")}
          autoFocus
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
        />
        <Field
          label={t("debt.phone")}
          inputMode="tel"
          dir="ltr"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      {error ? <p className="mt-3 text-[13.5px] text-[#f0879d]">{error}</p> : null}
      <Button
        variant="primary"
        className="mt-4 h-[48px] w-full"
        onClick={() => {
          if (!name.trim()) {
            setError(t("debt.needsName"));
            return;
          }
          onSaved(saveCustomer({ name, phone }));
        }}
      >
        {t("editor.save")}
      </Button>
    </Modal>
  );
}

/** One name's page: what they owe, what they have paid, and the button that
    changes it. */
function CustomerPage({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const data = usePos();
  const { t, m } = useT();
  const readOnly = useReadOnly();
  const [paying, setPaying] = useState(0);
  const balance = balanceOf(data, customer.id);
  const history = data.debts
    .filter((entry) => entry.customerId === customer.id)
    .slice(0, 40);

  return (
    <Modal title={customer.name} onClose={onClose}>
      <div className="rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3 text-center">
        <p className="font-display text-[26px] font-bold text-[#f0c078]">
          {balance > 0 ? t("debt.balance", { amount: m(balance) }) : t("debt.settled")}
        </p>
        {customer.phone ? (
          <p dir="ltr" className="mt-1 text-[13px] text-[#7e87a5]">
            {customer.phone}
          </p>
        ) : null}
      </div>

      {balance > 0 ? (
        <div className="mt-4">
          <Field
            label={t("debt.payAmount")}
            inputMode="numeric"
            value={paying ? amount(paying) : ""}
            placeholder="0"
            onChange={(event) => setPaying(parseAmount(event.target.value))}
          />
          <div className="mt-2 flex gap-2">
            <Button className="flex-1" onClick={() => setPaying(balance)}>
              {t("debt.payAll", { amount: m(balance) })}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={paying <= 0 || readOnly}
              onClick={() => {
                recordPayment(customer.id, Math.min(paying, balance));
                setPaying(0);
              }}
            >
              {readOnly ? t("licence.readOnlyShort") : t("debt.pay")}
            </Button>
          </div>
        </div>
      ) : null}

      <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
        {t("debt.history")}
      </p>
      <ul className="mt-2 divide-y divide-[#141b2d] overflow-hidden rounded-xl border border-[#1e2740]">
        {history.length === 0 ? (
          <li className="px-4 py-6 text-center text-[13.5px] text-[#6b7490]">
            {t("audit.none")}
          </li>
        ) : (
          history.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 bg-[#0b1120] px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] text-[#e7eaf6]">
                  {entry.kind === "owed"
                    ? t("debt.owedLine", { no: entry.receiptNo ?? entry.saleNo ?? "" })
                    : t("debt.paidLine")}
                </p>
                <p dir="ltr" className="mt-0.5 text-[12px] text-[#6b7490]">
                  {formatDateTime(entry.at)}
                  {entry.staffName ? ` · ${entry.staffName}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 font-display text-[14px] font-semibold ${
                  entry.kind === "owed" ? "text-[#f0c078]" : "text-[#8ee7bb]"
                }`}
              >
                {entry.kind === "owed" ? "+" : "−"}
                {m(entry.amount)}
              </span>
            </li>
          ))
        )}
      </ul>
    </Modal>
  );
}
