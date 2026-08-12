/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Language support for the CoreOs site — Arabic, Sorani Kurdish, English.
 *
 * Deliberately not a library. There are three languages and one dictionary; a
 * context plus a lookup is the whole requirement, same reasoning as the hand
 * written router next door.
 *
 * Arabic is the default because most of the businesses CoreOs sells to read
 * Arabic first. Sorani matters because CoreOs works out of Erbil, where a
 * shopkeeper is as likely to read Kurdish as Arabic. Both are written in the
 * Arabic script and both run right to left, so a single `isRtl` flag covers
 * the layout for either — English is the exception, not Kurdish.
 *
 * A visitor's choice is remembered, so the switch only has to be used once.
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

export type Lang = "ar" | "ckb" | "en";

/** Every language, in the order the switch shows them. */
export const LANGS: readonly Lang[] = ["ar", "ckb", "en"] as const;

/** How each language names itself. Never translated — a switch that labels
 *  Kurdish in Arabic is useless to the person who needs it. */
export const LANG_NAMES: Record<Lang, string> = {
  ar: "العربية",
  ckb: "کوردی",
  en: "English",
};

/** Two-or-three letter labels for the compact switch in the header. */
export const LANG_SHORT: Record<Lang, string> = {
  ar: "ع",
  ckb: "ک",
  en: "EN",
};

/** A string that exists in every language. Used across the catalogue too. */
export type Bilingual = Record<Lang, string>;

const STORAGE_KEY = "coreos.lang";
const DEFAULT_LANG: Lang = "ar";

const isLang = (value: unknown): value is Lang =>
  typeof value === "string" && (LANGS as readonly string[]).includes(value);

interface LangContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  /** Look up a UI string by key. */
  t: (key: CopyKey) => string;
  /** Resolve any {ar, ckb, en} entry — catalogue entries, inline copy. */
  pick: (value: Bilingual) => string;
  /** True for the two right-to-left languages. English is the odd one out. */
  isRtl: boolean;
}

const LangContext = createContext<LangContextValue | null>(null);

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* Storage can be unavailable (private mode, embedded webviews). Fall
       through to the default rather than breaking the render. */
  }
  return DEFAULT_LANG;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  /* The direction lives on <html> rather than a wrapper so it also reaches
     portalled UI and the browser's own scrollbar placement. `ckb` is the
     correct BCP 47 tag for Central Kurdish, and it tells the browser to pick
     Kurdish letterforms — Sorani has letters Arabic does not. */
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "en" ? "ltr" : "rtl";
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
      isRtl: lang !== "en",
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
