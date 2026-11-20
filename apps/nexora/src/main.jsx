import React from "react";
import { createRoot } from "react-dom/client";
import NexoraFoundryWorkspace from "./components/nexora/NexoraFoundryWorkspace.jsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("NEXORA root element is missing.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <NexoraFoundryWorkspace />
  </React.StrictMode>
);
