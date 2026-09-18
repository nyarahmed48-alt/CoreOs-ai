"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { usePreferences } from "@/components/PreferencesProvider";
import {
  CURRENCIES,
  CURRENCY_CODES,
  coerceCurrency,
  convert,
  formatMoney,
  type CurrencyCode,
} from "@/lib/currency";

export function SettingsPanel({ userEmail }: { userEmail: string }) {
  const { currency, setCurrency } = usePreferences();
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState<CurrencyCode>(currency);
  const [to, setTo] = useState<CurrencyCode>("USD");

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return CURRENCY_CODES;
    return CURRENCY_CODES.filter((code) =>
      `${code} ${CURRENCIES[code].name}`.toLowerCase().includes(needle),
    );
  }, [search]);

  const numericAmount = Number(amount || 0);
  const result = convert(
    Number.isFinite(numericAmount) ? numericAmount : 0,
    from,
    to,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card space-y-4">
        <div>
          <h2 className="page-title text-lg">Currency</h2>
          <p className="mt-2 text-sm text-muted">
            Pick your base currency. Stats and totals are shown in this currency.
          </p>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            className="field pl-11"
            placeholder="Search currency…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search currency"
          />
        </div>

        <ul className="max-h-[420px] divide-y divide-line overflow-y-auto rounded-xl border border-line">
          {matches.map((code) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => setCurrency(code)}
                className={`flex w-full items-center justify-between px-4 py-3 text-sm transition ${
                  code === currency ? "bg-accent-soft text-ink" : "hover:bg-surface-2"
                }`}
              >
                <span>
                  <span className="font-medium text-accent-ink">{code}</span>
                  <span className="text-muted"> — {CURRENCIES[code].name}</span>
                </span>
                <span className="flex items-center gap-2 text-muted">
                  {CURRENCIES[code].symbol}
                  {code === currency ? (
                    <Check className="h-4 w-4 text-accent" aria-hidden />
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-6">
        <section className="card space-y-4">
          <div>
            <h2 className="page-title text-lg">Currency converter</h2>
            <p className="mt-2 text-sm text-muted">
              Quick conversion using the built-in mid-market rates.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="label">Amount</span>
            <input
              className="field"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">From</span>
              <select
                className="field"
                value={from}
                onChange={(event) => setFrom(coerceCurrency(event.target.value))}
              >
                {CURRENCY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code} — {CURRENCIES[code].name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="label">To</span>
              <select
                className="field"
                value={to}
                onChange={(event) => setTo(coerceCurrency(event.target.value))}
              >
                {CURRENCY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code} — {CURRENCIES[code].name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-line bg-surface-2 px-5 py-6 text-center">
            <p className="label">Result</p>
            <p
              className="mt-2 text-3xl font-semibold text-accent-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formatMoney(result, to)}
            </p>
          </div>
        </section>

        <section className="card space-y-2">
          <h2 className="label">Account</h2>
          <p className="text-sm">{userEmail}</p>
          <p className="text-xs text-muted">
            Display preferences (currency, theme) are stored in this browser
            only; entry data lives in the database.
          </p>
        </section>
      </div>
    </div>
  );
}
