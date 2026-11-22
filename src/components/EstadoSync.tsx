import { useState } from "react";
import { useApp } from "../store/AppStore";

/**
 * Componente compacto que muestra el estado de sincronización.
 *
 * Alto 28-32 px, texto 0.68 rem, punto de color según estado.
 * Al tocarlo muestra un popover con la hora del último sync y botón
 * Reintentar si hay error.
 */
export function EstadoSync() {
  const { sync } = useApp();
  const [abierto, setAbierto] = useState(false);

  const { estadoSync, pendientes, ultimoSync, reintentar } = sync;

  const punto = estadoSync === "ok"
    ? "bg-[var(--ok)]"
    : estadoSync === "pendiente"
      ? "bg-[var(--warn)]"
      : estadoSync === "sincronizando"
        ? "bg-[var(--info)]"
        : "bg-[var(--bad)]";

  const texto = estadoSync === "ok"
    ? "Sincronizado"
    : estadoSync === "pendiente"
      ? `${pendientes} pendiente${pendientes !== 1 ? "s" : ""}`
      : estadoSync === "sincronizando"
        ? "Sincronizando"
        : "Sin conexión";

  const titulo = estadoSync === "ok"
    ? "Sincronizado"
    : estadoSync === "pendiente"
      ? `${pendientes} cambio${pendientes !== 1 ? "s" : ""} pendiente${pendientes !== 1 ? "s" : ""} de sync`
      : estadoSync === "sincronizando"
        ? "Sincronizando cambios…"
        : "Error de conexión";

  const horaSync = ultimoSync
    ? new Date(ultimoSync).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${punto} text-white`}
        style={{ height: "28px", fontSize: "0.68rem" }}
        aria-label={`Estado de sincronización: ${titulo}`}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        title={titulo}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${punto} ring-2 ring-white/40`}
        />
        <span className="font-medium">{texto}</span>
      </button>

      {abierto && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAbierto(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Detalles de sincronización"
            className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-[var(--surface-3)] bg-[var(--surface-1)] p-3 shadow-lg"
            style={{ fontSize: "0.75rem" }}
          >
            <p className="mb-1 font-medium text-[var(--ink)]">
              {titulo}
            </p>
            <p className="mb-2 text-[var(--ink-2)]">
              Último sync: {horaSync}
            </p>
            {estadoSync === "error" && (
              <button
                type="button"
                onClick={() => {
                  reintentar();
                  setAbierto(false);
                }}
                className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-white"
                style={{ fontSize: "0.72rem" }}
              >
                Reintentar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
