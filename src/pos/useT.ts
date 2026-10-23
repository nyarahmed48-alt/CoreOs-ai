/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import { usePos } from "./store";
import { dirOf, translate, type Key, type Lang } from "./i18n";
import { money } from "./money";

export interface Translator {
  t: (key: Key, vars?: Record<string, string | number>) => string;
  /** Amounts in the shop's own currency wording. */
  m: (amount: number) => string;
  lang: Lang;
  dir: "rtl" | "ltr";
}

/** Every screen's way in to the shop's language. Kept out of i18n.ts so the
    store can translate its own errors without the two importing each other. */
export function useT(): Translator {
  const { settings } = usePos();
  const lang = settings.lang;
  return useMemo(
    () => ({
      lang,
      dir: dirOf(lang),
      t: (key: Key, vars?: Record<string, string | number>) =>
        translate(lang, key, vars),
      m: (amount: number) => money(amount, lang),
    }),
    [lang],
  );
}
