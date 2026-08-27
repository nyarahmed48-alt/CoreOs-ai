/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Entry point for the portable build: the till on its own, with no site
 * around it and no router under it.
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
