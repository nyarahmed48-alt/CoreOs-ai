"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_CURRENCY,
  coerceCurrency,
  type CurrencyCode,
} from "@/lib/currency";

type Theme = "dark" | "light";

type Preferences = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  theme: Theme;
  toggleTheme: () => void;
};

const CURRENCY_KEY = "coreos.currency";
const THEME_KEY = "coreos.theme";

const PreferencesContext = createContext<Preferences | null>(null);

/**
 * Per-browser display preferences: the base currency every total is shown in,
 * and the colour theme. Both are viewer-level conveniences, so localStorage is
 * the right home for them — entry amounts keep their own stored currency.
 */
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const storedCurrency = localStorage.getItem(CURRENCY_KEY);
      if (storedCurrency) setCurrencyState(coerceCurrency(storedCurrency));
      const storedTheme = localStorage.getItem(THEME_KEY);
      if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
    } catch {
      // Private windows and blocked site data: fall back to the defaults.
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    try {
      localStorage.setItem(CURRENCY_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ currency, setCurrency, theme, toggleTheme }),
    [currency, setCurrency, theme, toggleTheme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): Preferences {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used inside <PreferencesProvider>");
  }
  return context;
}
