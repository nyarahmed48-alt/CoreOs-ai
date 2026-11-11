/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Entry point for the Key Maker as one portable file. */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import KeyMakerApp from "./KeyMakerApp";
import "../pos/standalone.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <KeyMakerApp />
  </StrictMode>,
);
