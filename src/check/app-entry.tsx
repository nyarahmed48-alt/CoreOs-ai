/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Device Check as an installed app, with its own icon on the home screen.
 *
 * Installed separately from CoreCashier and with its own scope, so a tablet
 * carries two icons: the till, and the thing to open when the till will not.
 * They share an origin, which is what lets this read the Till ID and the
 * technician session without asking for either.
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* No worker means no offline copy. Device Check still runs from
         whatever the browser kept, and saying so here would be a dialogue in
         front of somebody already dealing with a broken tablet. */
    });
  });
}
