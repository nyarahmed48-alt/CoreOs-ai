/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The language switch, in one place so every surface behaves identically.
 *
 * Arabic is the site default and a first-time visitor always lands in it; this
 * is the control that lets them leave. It therefore has to exist on every page
 * a visitor can arrive at directly — including the demo sites, which are the
 * pages most likely to be opened straight from a WhatsApp link, with no chance
 * to have passed through the main nav first.
 *
 * Every option is labelled in its own script and never translated. A switch
 * that writes "Kurdish" in Arabic is no use to the person who needs to press
 * it. `dir="ltr"` pins the order so the buttons don't reshuffle when the page
 * direction flips.
 */

import { LANGS, LANG_NAMES, LANG_SHORT, useLang } from "./i18n";

type Size = "sm" | "md" | "full";

/** Per-size geometry. Kept as one table so the sizes stay comparable. */
const SIZES: Record<Size, { group: string; button: string; full: boolean }> = {
  // Inside the demo bar, which is a tight sticky strip.
  sm: { group: "", button: "px-2 py-1 text-[12px]", full: false },
  // Site header.
  md: { group: "", button: "px-2.5 py-1.5 text-[13px]", full: false },
  // Mobile menu, where there is room for the real names.
  full: { group: "w-full", button: "flex-1 px-2 py-2 text-[14px]", full: true },
};

export function LangSwitch({
  size = "md",
  tone = "dark",
}: {
  size?: Size;
  /** `light` inverts the resting colours for use on a pale background. */
  tone?: "dark" | "light";
}) {
  const { lang, setLang, t } = useLang();
  const s = SIZES[size];

  const idle =
    tone === "light"
      ? "text-[#5c5560] hover:bg-[#00000010] hover:text-black"
      : "text-[#c3c9dd] hover:bg-[#141a29] hover:text-white";
  const border = tone === "light" ? "border-[#00000022]" : "border-[#232b40]";

  return (
    <div
      role="group"
      aria-label={t("nav.langAria")}
      dir="ltr"
      className={`flex items-center gap-0.5 rounded-lg border ${border} p-0.5 ${s.group}`}
    >
      {LANGS.map((code) => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            lang={code}
            aria-pressed={active}
            title={LANG_NAMES[code]}
            className={`rounded-md font-medium transition-colors ${s.button} ${
              active ? "bg-[#6c7bf0] text-[#05060a]" : idle
            }`}
          >
            {s.full ? LANG_NAMES[code] : LANG_SHORT[code]}
          </button>
        );
      })}
    </div>
  );
}
