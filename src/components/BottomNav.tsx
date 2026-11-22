import { useState } from "react";
import { Home, History, Wrench, Bike, Plus, Fuel, Gauge, Link2 } from "lucide-react";
import type { Seccion } from "../screens/Dashboard";

export type Destino = "inicio" | "plan" | "bitacora" | "garaje";

interface BottomNavProps {
  activo: Destino;
  onNavigate: (d: Destino) => void;
  onTanqueo: () => void;
  onServicio: () => void;
  onEditarKm: () => void;
  onCadena: () => void;
}

const DESTINOS: { id: Destino; label: string; icon: typeof Home; section: Seccion }[] = [
  { id: "inicio", label: "Inicio", icon: Home, section: "menu" },
  { id: "plan", label: "Plan", icon: Wrench, section: "plan" },
  { id: "bitacora", label: "Bitácora", icon: History, section: "historial" },
  { id: "garaje", label: "Garaje", icon: Bike, section: "documentos" },
];

const FAB_ACCIONES = [
  { label: "Tanqueo", icon: Fuel, color: "#f59e0b" },
  { label: "Servicio", icon: Wrench, color: "#38bdf8" },
  { label: "Actualizar odómetro", icon: Gauge, color: "#34d399" },
  { label: "Checklist de cadena", icon: Link2, color: "#a78bfa" },
];

export function BottomNav({ activo, onNavigate, onTanqueo, onServicio, onEditarKm, onCadena }: BottomNavProps) {
  const [fabOpen, setFabOpen] = useState(false);

  const safeBottom = "env(safe-area-inset-bottom)";

  return (
    <>
      {/* FAB overlay */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center bg-black/30"
          onClick={() => setFabOpen(false)}
          role="dialog"
          aria-label="Acciones rápidas"
        >
          <div
            className="no-print w-full max-w-sm rounded-t-2xl border border-[var(--line)] bg-[var(--surface)] p-4 pb-6 shadow-2xl"
            style={{ marginBottom: `calc(64px + ${safeBottom})` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-[var(--ink-3)] opacity-30" />
            <p className="ink mb-2 text-center text-[0.78rem] font-bold">Acciones rápidas</p>
            <div className="grid grid-cols-2 gap-2">
              {FAB_ACCIONES.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3 text-center transition-opacity hover:opacity-80"
                    onClick={() => {
                      setFabOpen(false);
                      if (a.label === "Tanqueo") onTanqueo();
                      else if (a.label === "Servicio") onServicio();
                      else if (a.label === "Actualizar odómetro") onEditarKm();
                      else if (a.label === "Checklist de cadena") onCadena();
                    }}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: a.color + "18", color: a.color }}>
                      <Icon size={18} />
                    </span>
                    <span className="ink text-[0.72rem] font-semibold">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-[var(--line)] bg-[var(--surface)]"
        role="navigation"
        aria-label="Navegación principal"
        style={{ height: `calc(64px + ${safeBottom})`, paddingBottom: safeBottom }}
      >
        {DESTINOS.map((d) => {
          const isActive = activo === d.id;
          const Icon = d.icon;
          return (
            <button
              key={d.id}
              onClick={() => onNavigate(d.id)}
              aria-current={isActive ? "page" : undefined}
              className="flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5"
              style={{ color: isActive ? "var(--brand)" : "var(--ink-3)" }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span
                className="font-semibold"
                style={{
                  fontSize: "0.6rem",
                  position: "relative",
                }}
              >
                {d.label}
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ background: "var(--brand)" }}
                  />
                )}
              </span>
            </button>
          );
        })}

        {/* FAB central elevado */}
        <button
          onClick={() => setFabOpen((v) => !v)}
          aria-label="Acciones rápidas"
          className="absolute -top-5 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--brand)",
            color: "#fff",
          }}
        >
          <Plus size={22} />
        </button>
      </nav>
    </>
  );
}
