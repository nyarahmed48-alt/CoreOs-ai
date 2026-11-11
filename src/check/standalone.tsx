/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Entry point for Device Check as one portable file.
 *
 * No error boundary from the till and no reporter: this app has to open on a
 * tablet where that machinery is the thing that is broken. If it crashes, it
 * crashes plainly — and the shop still has CoreCashier's own log.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CheckApp from "./CheckApp";
import "../pos/standalone.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CheckApp />
  </StrictMode>,
);
