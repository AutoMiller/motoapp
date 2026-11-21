import { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { Fusible, VarianteFusibles } from "../data/fusibles";
import { CAJAS } from "../data/fusibles";

/* ------------------------------------------------------------------ */
/*  Blade-fuse SVG component                                          */
/* ------------------------------------------------------------------ */

function amperajeLabel(a: number | null): string {
  if (a === null) return "?";
  return `${a}A`;
}

function amperajeDisplay(a: number | null): string {
  if (a === null) return "Sin dato";
  return `${a} A`;
}

function FusibleBlade({
  f,
  selected,
  onClick,
}: {
  f: Fusible;
  selected: boolean;
  onClick: () => void;
}) {
  const num = f.puesto != null ? f.puesto : "?";
  const isRepuesto = f.protege.length === 0;
  const label = f.amperaje != null ? `${f.nombre}, ${f.amperaje} A` : `${f.nombre}, amperaje desconocido`;

  return (
    <g
      tabIndex={0}
      role="button"
      aria-label={`Fusible ${num}: ${label}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer"
    >
      {/* Top tabs (patas) */}
      <rect x="10" y="0" width="6" height="8" rx="1" fill="var(--ink-3)" />
      <rect x="24" y="0" width="6" height="8" rx="1" fill="var(--ink-3)" />

      {/* Main body */}
      <rect
        x="4"
        y="8"
        width="32"
        height="22"
        rx="4"
        fill={isRepuesto ? "var(--surface-3)" : "var(--warn)"}
        stroke={selected ? "var(--brand)" : "var(--ink-2)"}
        strokeWidth={selected ? 2.5 : 1}
      />

      {/* Number */}
      <text
        x="20"
        y="22"
        textAnchor="middle"
        className="select-none"
        style={{ fontSize: "9px", fontWeight: 700, fill: "var(--ink)" }}
      >
        {num}
      </text>

      {/* Ampere label below */}
      <text
        x="20"
        y="40"
        textAnchor="middle"
        className="select-none"
        style={{ fontSize: "7px", fill: "var(--ink-3)" }}
      >
        {amperajeLabel(f.amperaje)}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail panel                                                       */
/* ------------------------------------------------------------------ */

function DetalleFusible({ f }: { f: Fusible }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="ink text-[0.92rem] font-bold">{f.nombre}</h4>
          {f.puesto != null && (
            <span className="ink-3 text-xs">Puesto {f.puesto}</span>
          )}
        </div>
        <span
          className="chip shrink-0 text-sm font-bold"
          style={{
            background: f.amperaje != null ? "var(--warn)" : "var(--surface-3)",
            color: f.amperaje != null ? "#fff" : "var(--ink-2)",
          }}
        >
          {amperajeDisplay(f.amperaje)}
        </span>
      </div>

      {f.amperaje === null && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--warn)]/10 px-3 py-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--warn)" }} />
          <p className="text-[0.72rem] leading-relaxed" style={{ color: "var(--warn)" }}>
            El manual no publica el amperaje: léelo en el fusible o en la tapa.
          </p>
        </div>
      )}

      {f.protege.length > 0 && (
        <div className="mt-3">
          <p className="ink-2 mb-1 text-[0.72rem] font-semibold uppercase tracking-wide">Protege</p>
          <ul className="list-inside list-disc space-y-0.5">
            {f.protege.map((p, i) => (
              <li key={i} className="ink text-[0.8rem]">
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {f.sintomas.length > 0 && (
        <div className="mt-3">
          <p className="ink-2 mb-1 text-[0.72rem] font-semibold uppercase tracking-wide">
            Síntomas cuando está fundido
          </p>
          <ul className="list-inside list-disc space-y-0.5">
            {f.sintomas.map((s, i) => (
              <li key={i} className="ink text-[0.8rem]">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {f.nota && (
        <div className="mt-3 rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
          <p className="ink-2 text-[0.76rem] leading-relaxed">💡 {f.nota}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function MapaFusibles() {
  const [variante, setVariante] = useState<VarianteFusibles>("abs");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const caja = CAJAS[variante];

  const selectedFuse = useMemo(() => {
    if (selectedId === null) return null;
    return caja.caja.find((_, i) => i === selectedId) ?? null;
  }, [caja, selectedId]);

  /* Layout positions for ABS variant — two rows */
  const absRows = caja.dibujo; // [[4,5],[3,2,1]] — puesto references
  const fuseByPuesto = useMemo(() => {
    const map = new Map<number, number>();
    caja.caja.forEach((f, idx) => {
      if (f.puesto != null) map.set(f.puesto, idx);
    });
    return map;
  }, [caja]);

  const fuseWidth = 40;
  const fuseGap = 12;
  const rowGap = 18;

  return (
    <div className="flex flex-col gap-4">
      {/* Variant selector */}
      <div className="flex gap-2">
        {(["abs", "carburada"] as VarianteFusibles[]).map((v) => {
          const active = v === variante;
          return (
            <button
              key={v}
              onClick={() => {
                setVariante(v);
                setSelectedId(null);
              }}
              className={`chip px-3 py-1.5 text-[0.78rem] font-semibold transition-all ${
                active ? "" : "opacity-60"
              }`}
              style={{
                background: active ? "var(--brand)" : "var(--surface-3)",
                color: active ? "#fff" : "var(--ink-2)",
              }}
            >
              {CAJAS[v].etiqueta}
            </button>
          );
        })}
      </div>

      {/* SVG fuse box */}
      <div className="card p-4">
        <p className="ink-2 mb-3 text-[0.76rem]">{caja.ubicacionCaja}</p>

        {variante === "abs" ? (
          /* ABS: two rows layout */
          <svg
            viewBox={`0 0 ${Math.max(
              absRows[0].length * (fuseWidth + fuseGap),
              absRows[1].length * (fuseWidth + fuseGap)
            )} ${absRows.length * (50 + rowGap)}`}
            className="w-full"
            style={{ minHeight: 160 }}
          >
            {absRows.map((row, ri) => {
              const y = ri * (50 + rowGap);
              return (
                <g key={ri}>
                  {row.map((puesto, ci) => {
                    const idx = fuseByPuesto.get(puesto);
                    if (idx === undefined) return null;
                    const f = caja.caja[idx];
                    const x = ci * (fuseWidth + fuseGap);
                    return (
                      <g key={puesto} transform={`translate(${x},${y})`}>
                        <FusibleBlade
                          f={f}
                          selected={selectedId === idx}
                          onClick={() => setSelectedId(idx === selectedId ? null : idx)}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        ) : (
          /* Carburada: single row, no positions defined */
          <svg
            viewBox={`0 0 ${caja.caja.length * (fuseWidth + fuseGap)} 68`}
            className="w-full"
            style={{ minHeight: 120 }}
          >
            {caja.caja.map((f, idx) => {
              const x = idx * (fuseWidth + fuseGap);
              return (
                <g key={idx} transform={`translate(${x},0)`}>
                  <FusibleBlade
                    f={f}
                    selected={selectedId === idx}
                    onClick={() => setSelectedId(idx === selectedId ? null : idx)}
                  />
                </g>
              );
            })}
          </svg>
        )}

        <p className="ink-3 mt-2 text-[0.66rem]">
          Toca un fusible para ver detalles · Ámbar = circuito activo · Gris = repuesto
        </p>
      </div>

      {/* Detail panel */}
      {selectedFuse && <DetalleFusible f={selectedFuse} />}
    </div>
  );
}
