import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./entry";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
