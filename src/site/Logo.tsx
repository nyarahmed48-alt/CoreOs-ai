/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The CoreOs brand mark, rebuilt as vector art so it stays crisp at every size
 * and can be recoloured per surface (favicon, nav, hero, footer).
 *
 * Palette is taken straight from the logo artwork:
 *   cream disc  #edf2e4
 *   wordmark    #6c7bf0 (periwinkle)
 *   tagline     #1878dc (signal blue)
 */

export const BRAND = {
  ink: "#05060a",
  cream: "#edf2e4",
  periwinkle: "#6c7bf0",
  signal: "#1878dc",
} as const;

/** The disc-and-sliver glyph that sits to the left of the wordmark. */
export function CoreOsMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="CoreOs"
    >
      <circle cx="50" cy="50" r="42" fill={BRAND.cream} />
      {/* Concave sliver: two tips on the left, a single point at the right edge. */}
      <path
        d="M92 50
           C 62 38, 48 32, 34 18
           C 46 38, 46 62, 34 82
           C 48 68, 62 62, 92 50 Z"
        fill={BRAND.ink}
      />
    </svg>
  );
}

/** Full lockup: mark + "coreOs" wordmark, with an optional tagline beneath. */
export function CoreOsLockup({
  size = 34,
  tagline = false,
  suffix,
  className = "",
}: {
  size?: number;
  tagline?: boolean;
  /** Renders a lighter sub-brand after the wordmark, e.g. ".ai". */
  suffix?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex flex-col gap-1 ${className}`}>
      <span className="inline-flex items-center gap-[0.38em]">
        <CoreOsMark size={size} />
        <span
          className="font-brand font-extrabold leading-none tracking-[-0.02em]"
          style={{ fontSize: size * 0.95, color: BRAND.periwinkle }}
        >
          coreOs
          {suffix ? (
            <span style={{ color: BRAND.signal }}>{suffix}</span>
          ) : null}
        </span>
      </span>
      {tagline ? (
        <span
          className="font-display font-semibold tracking-tight"
          style={{ fontSize: size * 0.4, color: BRAND.signal }}
        >
          Where your needs meet reality.
        </span>
      ) : null}
    </span>
  );
}
