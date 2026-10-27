/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CoreCashier as an installed app.
 *
 * The same till as the portable file, with three things a file cannot have:
 * an icon on the tablet's home screen, a full screen with no browser chrome,
 * and a service worker that keeps it working when the shop's internet does
 * not.
 *
 * The worker is registered after the till has drawn. A cashier opening the
 * app wants the basket, not a background download, and on a 4GB tablet the
 * two compete.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PosApp from "./PosApp";
import "./standalone.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PosApp standalone />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* No worker means no offline cache, but the till still runs from
         whatever the browser has. Nothing here is worth a broken screen. */
    });
  });
}
