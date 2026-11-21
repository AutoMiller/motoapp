import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

/**
 * PWA: registra el service worker solo en el build de producción web.
 *
 * - En `vite dev` no hay SW (evita servir código viejo mientras se edita).
 * - En el build de Apps Script (`--mode gas`) tampoco: allí la app vive en un
 *   iframe de HtmlService y los service workers están bloqueados.
 *
 * La ruta es relativa porque la app se publica en un subdirectorio
 * (https://macorreag.github.io/motoapp/).
 */
if (import.meta.env.PROD && import.meta.env.MODE !== "gas" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch((error: unknown) => {
      console.warn("[MotoApp] No se pudo registrar el service worker:", error);
    });
  });
}
