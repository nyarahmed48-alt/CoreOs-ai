/**
 * Currency helpers.
 *
 * Rates are built-in, mid-market approximations expressed as "units per 1 USD".
 * They are used for the settings converter and for the "≈ $x" hints next to
 * entry amounts; they are not a pricing source of truth.
 */
export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCIES = {
  USD: { name: "US Dollar", symbol: "$", perUsd: 1 },
  IQD: { name: "Iraqi Dinar", symbol: "ع.د", perUsd: 1310 },
  EUR: { name: "Euro", symbol: "€", perUsd: 0.92 },
  GBP: { name: "British Pound", symbol: "£", perUsd: 0.78 },
  JPY: { name: "Japanese Yen", symbol: "¥", perUsd: 151 },
  CNY: { name: "Chinese Yuan", symbol: "¥", perUsd: 7.24 },
  AED: { name: "UAE Dirham", symbol: "د.إ", perUsd: 3.67 },
  SAR: { name: "Saudi Riyal", symbol: "﷼", perUsd: 3.75 },
  TRY: { name: "Turkish Lira", symbol: "₺", perUsd: 32.4 },
  INR: { name: "Indian Rupee", symbol: "₹", perUsd: 83.3 },
  CAD: { name: "Canadian Dollar", symbol: "C$", perUsd: 1.36 },
  AUD: { name: "Australian Dollar", symbol: "A$", perUsd: 1.52 },
  CHF: { name: "Swiss Franc", symbol: "Fr", perUsd: 0.89 },
  SEK: { name: "Swedish Krona", symbol: "kr", perUsd: 10.5 },
  NOK: { name: "Norwegian Krone", symbol: "kr", perUsd: 10.7 },
  JOD: { name: "Jordanian Dinar", symbol: "د.ا", perUsd: 0.709 },
  EGP: { name: "Egyptian Pound", symbol: "E£", perUsd: 48.5 },
  QAR: { name: "Qatari Riyal", symbol: "ر.ق", perUsd: 3.64 },
  KWD: { name: "Kuwaiti Dinar", symbol: "د.ك", perUsd: 0.307 },
  TND: { name: "Tunisian Dinar", symbol: "د.ت", perUsd: 3.12 },
} as const;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, value);
}

export function coerceCurrency(value: string | null | undefined): CurrencyCode {
  return value && isCurrencyCode(value) ? value : DEFAULT_CURRENCY;
}

/** Convert an amount between two currencies using the built-in rates. */
export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): number {
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;
  const usd = amount / CURRENCIES[from].perUsd;
  return usd * CURRENCIES[to].perUsd;
}

/** Format an amount with its symbol, e.g. `$ 1,240.50` or `ع.د 1,000`. */
export function formatMoney(amount: number, code: CurrencyCode): string {
  const { symbol } = CURRENCIES[code];
  const fractionDigits = Math.abs(amount) >= 1000 || Number.isInteger(amount) ? 0 : 2;
  const body = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: code === "IQD" || code === "JPY" ? 0 : fractionDigits,
    maximumFractionDigits: code === "IQD" || code === "JPY" ? 0 : 2,
  }).format(amount);
  return `${symbol} ${body}`;
}

/** `≈ $ 0.76` style hint shown under a foreign-currency amount. */
export function formatApprox(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): string | null {
  if (from === to) return null;
  return `≈ ${formatMoney(convert(amount, from, to), to)}`;
}
