/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Entry point for the owner's console as one portable file. */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CeoApp from "./CeoApp";
import "../pos/standalone.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CeoApp />
  </StrictMode>,
);
