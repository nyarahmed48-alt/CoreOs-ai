/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Entry point for the code generator as one portable file.
 *
 * The small tool that turns a shop's request code into a licence. It is the
 * only thing that signs, and it signs with a key loaded from the owner's own
 * key file — so this file is not itself a secret, and losing it costs nothing
 * as long as the key file is backed up. It is still never sent to a shop.
 *
 * No PIN on it. A PIN on a file that cannot issue anything without the key
 * file beside it is theatre, and one more thing to be locked out by.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IssuePanel } from "./IssuePanel";
import "../pos/standalone.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div dir="ltr" lang="en" className="min-h-[100dvh] bg-[#05060a] text-[#e7eaf6]">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <header>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-[#6b7490]">
            CoreCashier
          </p>
          <h1 className="mt-2 font-brand text-[clamp(1.6rem,4vw,2.2rem)] font-extrabold tracking-[-0.03em] text-white">
            Code generator
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#98a0bb]">
            Keeps the tablets running. Nothing here goes to a shop.
          </p>
        </header>
        <IssuePanel />
      </div>
    </div>
  </StrictMode>,
);
