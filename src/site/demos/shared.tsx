/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pieces shared by the three demo sites.
 *
 * Each demo carries its own palette and type, because the point is to show
 * that CoreOs builds a site that looks like the business rather than a
 * template with a new logo. Only the CoreOs bar and a couple of primitives
 * are common.
 */

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "../router";
import { useLang } from "../i18n";
import { LangSwitch } from "../LangSwitch";
import type { Copy } from "../strings";

/**
 * The strip that marks a page as a demo.
 *
 * Deliberately unmissable and deliberately outside the demo's own palette: a
 * visitor must never be confused about whether this is a real business, and a
 * prospect looking at it should always have one tap back to the enquiry form.
 *
 * It carries the language switch too. A demo is usually opened straight from a
 * link rather than reached through the site, so this bar is the only chrome
 * that visitor ever sees — without the switch here they would be stuck in
 * whichever language the site defaulted them to.
 *
 * The back link drops to an icon on narrow screens: the switch matters more
 * than the words, and the demo badge on the left already goes home.
 */
export function DemoBar() {
  const { t } = useLang();

  return (
    <div className="sticky top-0 z-50 border-b border-[#232b40] bg-[#05060a] text-[#e7eaf6]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 sm:px-5">
        <Link
          to="/"
          className="inline-flex min-w-0 items-center gap-2 text-[12.5px] font-medium text-[#98a0bb] transition-colors hover:text-white"
        >
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#6c7bf0]" />
          <span className="truncate">{t("demos.badge")}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LangSwitch size="sm" />
          <Link
            to="/"
            aria-label={t("demos.back")}
            className="hidden rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-[#98a0bb] transition-colors hover:text-white sm:inline-block"
          >
            {t("demos.back")}
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6c7bf0] px-3 py-1.5 text-[12.5px] font-semibold text-[#05060a] transition-colors hover:bg-[#8390f4]"
          >
            {t("demos.badgeCta")}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Resolves a bilingual value in the active language. */
export function useCopy() {
  const { pick } = useLang();
  return pick as (value: Copy) => string;
}

/**
 * Stand-in for a photograph.
 *
 * These demos ship without real photography — a barbershop that does not
 * exist has none. Rather than stretch a stock image over it, each tile is a
 * generated gradient, which reads as an intentional placeholder in a mockup
 * instead of pretending to be a photo of something.
 */
export function PhotoTile({
  from,
  to,
  className = "",
  ratio = "aspect-[4/3]",
}: {
  from: string;
  to: string;
  className?: string;
  ratio?: string;
}) {
  return (
    <div
      className={`${ratio} overflow-hidden rounded-2xl ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <div className="h-full w-full bg-[radial-gradient(120%_90%_at_20%_10%,rgba(255,255,255,0.22),transparent_60%)]" />
    </div>
  );
}

/** Section wrapper with a consistent rhythm inside a demo. */
export function DemoSection({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">{children}</div>
    </section>
  );
}

/** A name / optional detail / price row, used by every demo's price list. */
export function PriceRow({
  name,
  detail,
  price,
  rule,
  muted,
}: {
  name: string;
  detail?: string;
  price: string;
  /** Colour of the dotted leader between name and price. */
  rule: string;
  muted: string;
}) {
  return (
    <div className="flex items-baseline gap-3 py-3">
      <div className="min-w-0">
        <span className="font-medium">{name}</span>
        {detail ? (
          <span className="ms-2 text-[13px]" style={{ color: muted }}>
            {detail}
          </span>
        ) : null}
      </div>
      <span
        className="mx-1 h-px min-w-6 flex-1 self-center"
        style={{ backgroundImage: `linear-gradient(to right, ${rule} 40%, transparent 0%)`, backgroundSize: "6px 1px", backgroundRepeat: "repeat-x" }}
      />
      <span dir="ltr" className="shrink-0 font-semibold tabular-nums">
        {price}
      </span>
    </div>
  );
}
