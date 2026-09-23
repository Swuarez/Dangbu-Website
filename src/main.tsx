import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { MotionPreferenceProvider } from "@/context/MotionPreferenceContext";
import "@/index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Dangbu could not start: #root container is missing from index.html.");
}

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionPreferenceProvider>
        <App />
      </MotionPreferenceProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
