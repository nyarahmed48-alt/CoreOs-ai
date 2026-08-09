/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from "react";

/** Small uppercase kicker that sits above a section heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#1878dc]">
      {children}
    </span>
  );
}
