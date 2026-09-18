"use client";

import { Moon, Sun } from "lucide-react";
import { usePreferences } from "@/components/PreferencesProvider";
import { CURRENCY_CODES, coerceCurrency } from "@/lib/currency";
import { SignOutButton } from "@/components/SignOutButton";

export function TopBar({ title }: { title: string }) {
  const { currency, setCurrency, theme, toggleTheme } = usePreferences();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
      <h1 className="page-title">{title}</h1>

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="base-currency">
          Base currency
        </label>
        <select
          id="base-currency"
          value={currency}
          onChange={(event) => setCurrency(coerceCurrency(event.target.value))}
          className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        >
          {CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="rounded-xl border border-line bg-surface-2 p-2.5 text-ink transition hover:bg-surface-3"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" aria-hidden />
          ) : (
            <Moon className="h-4 w-4" aria-hidden />
          )}
        </button>

        <SignOutButton className="btn-ghost max-sm:hidden" />
      </div>
    </header>
  );
}
