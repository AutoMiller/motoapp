import { useState } from "react";
import { PRESIONES_OFFROAD, PRESIONES_ASFALTO } from "../data/presiones";

/**
 * Tarjeta de presiones de llantas.
 *
 * Muestra presiones de asfalto (solo / con pasajero) y, debajo,
 * la tabla off-road con selector de terreno mediante chips.
 * Sin props obligatorias.
 */
export function TarjetaPresiones() {
  const [terrenoActivo, setTerrenoActivo] = useState<string>(
    PRESIONES_OFFROAD[0]?.terreno ?? "",
  );

  const activo =
    PRESIONES_OFFROAD.find((r) => r.terreno === terrenoActivo) ??
    PRESIONES_OFFROAD[0];

  return (
    <div className="card-flat p-4">
      {/* — Presiones de asfalto — */}
      <h3 className="h-sec ink mb-3">Presiones de asfalto</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-[var(--line)] p-3">
          <p className="ink-3 text-xs mb-1">Solo</p>
          <p className="nums ink text-lg font-bold">{PRESIONES_ASFALTO.solo}</p>
          <p className="ink-3 text-[0.65rem] mt-0.5">delantera / trasera</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] p-3">
          <p className="ink-3 text-xs mb-1">Con pasajero</p>
          <p className="nums ink text-lg font-bold">
            {PRESIONES_ASFALTO.conPasajero}
          </p>
          <p className="ink-3 text-[0.65rem] mt-0.5">delantera / trasera</p>
        </div>
      </div>

      <div className="divider mb-4" />

      {/* — Presiones off-road — */}
      <h3 className="h-sec ink mb-1">Presiones off-road</h3>
      <p className="ink-3 text-xs mb-3">
        Referencia piloto ~60 kg; +2–3 psi con equipaje.
      </p>

      {/* Chips selector de terreno */}
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESIONES_OFFROAD.map((r) => {
          const on = r.terreno === terrenoActivo;
          return (
            <button
              key={r.terreno}
              onClick={() => setTerrenoActivo(r.terreno)}
              className={`chip transition-all ${
                on ? "chip-brand" : "bg-[var(--surface-3)] text-[var(--ink-2)]"
              }`}
            >
              {r.terreno}
            </button>
          );
        })}
      </div>

      {/* Fila activa */}
      {activo && (
        <div className="rounded-xl border border-[var(--line)] p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="ink text-sm font-semibold">{activo.terreno}</span>
            <span className="chip chip-info">{activo.nota}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="ink-3 text-xs">Delantera (80/90-21)</p>
              <p className="nums ink text-base font-bold">{activo.delantera}</p>
            </div>
            <div>
              <p className="ink-3 text-xs">Trasera (120/80-18)</p>
              <p className="nums ink text-base font-bold">{activo.trasera}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
