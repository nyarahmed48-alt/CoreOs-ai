"use client";

import { usePreferences } from "@/components/PreferencesProvider";
import {
  formatApprox,
  formatMoney,
  type CurrencyCode,
} from "@/lib/currency";

/**
 * Amount in its own currency, with an "≈ base currency" hint underneath when
 * the two differ.
 */
export function Money({
  amount,
  currency,
  className = "",
}: {
  amount: number;
  currency: CurrencyCode;
  className?: string;
}) {
  const { currency: base } = usePreferences();
  const approx = formatApprox(amount, currency, base);

  return (
    <span className={`inline-block ${className}`}>
      <span className="text-success">{formatMoney(amount, currency)}</span>
      {approx ? (
        <span className="mt-0.5 block text-[11px] text-muted">{approx}</span>
      ) : null}
    </span>
  );
}
