/** Standalone entry: renders LUNAR COMMAND on its own (no CoreOS site around it). */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LunarApp from "../src/lunar/LunarApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LunarApp />
  </StrictMode>,
);
