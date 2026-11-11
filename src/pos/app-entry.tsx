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
import { Boundary } from "./Boundary";
import { reportError } from "./reportIssue";
import "./standalone.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Boundary>
      <PosApp standalone />
    </Boundary>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((cause: unknown) => {
      /* No worker means no offline cache, but the till still runs from
         whatever the browser has — so this is logged, not put in front of
         the shop. It matters later: a tablet that never installed a worker
         is a tablet that will be blank the first time the wifi is out. */
      reportError(
        "SW-08",
        `service worker did not install: ${cause instanceof Error ? cause.message : String(cause)}`,
        { quiet: true },
      );
    });
  });
}
