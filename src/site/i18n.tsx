/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bilingual support for the CoreOs site — Arabic first, English on request.
 *
 * Deliberately not a library. There are two languages and one dictionary; a
 * context plus a lookup is the whole requirement, same reasoning as the hand
 * written router next door.
 *
 * Arabic is the default because most of the businesses CoreOs sells to read
 * Arabic first. A visitor's choice is remembered, so the toggle only has to be
 * pressed once.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { COPY, type CopyKey } from "./strings";

export type Lang = "ar" | "en";

/** A string that exists in both languages. Used across the catalogue too. */
export type Bilingual = { ar: string; en: string };

const STORAGE_KEY = "coreos.lang";
const DEFAULT_LANG: Lang = "ar";

interface LangContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  /** Look up a UI string by key. */
  t: (key: CopyKey) => string;
  /** Resolve any {ar, en} pair — catalogue entries, inline copy. */
  pick: (value: Bilingual) => string;
  /** True while Arabic is active, for the handful of direction-aware bits. */
  isRtl: boolean;
}

const LangContext = createContext<LangContextValue | null>(null);

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") return stored;
  } catch {
    /* Storage can be unavailable (private mode, embedded webviews). Fall
       through to the default rather than breaking the render. */
  }
  return DEFAULT_LANG;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  /* The direction lives on <html> rather than a wrapper so it also reaches
     portalled UI and the browser's own scrollbar placement. */
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Not being able to remember the choice is survivable. */
    }
  }, []);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      t: (key) => COPY[key]?.[lang] ?? COPY[key]?.en ?? key,
      pick: (entry) => entry[lang] ?? entry.en,
      isRtl: lang === "ar",
    }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
