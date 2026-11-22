import { useMemo, useState } from "react";
import { ChevronRight, Wrench } from "lucide-react";
import { ANGULOS, resumenZonas, ZONAS, type Angulo, type ZonaId, type ZonaResumen } from "../lib/zonas";
import { useApp } from "../store/AppStore";
import { num } from "../lib/format";
import { buscarPiezaDeComponente } from "../data/partes";

const COLOR: Record<string, { fg: string; soft: string; ring: string }> = {
  ok: { fg: "var(--ok)", soft: "rgba(34,197,94,.16)", ring: "rgba(34,197,94,.45)" },
  warning: { fg: "var(--warn)", soft: "rgba(245,158,11,.18)", ring: "rgba(245,158,11,.5)" },
  critical: { fg: "var(--bad)", soft: "rgba(239,68,68,.18)", ring: "rgba(239,68,68,.55)" },
};

const ETIQUETA = { ok: "Al día", warning: "Próximo", critical: "Urgente" } as const;

/**
 * Perfil de la moto con seis zonas tocables. La ilustración es el perfil
 * izquierdo del manual (B9L, pág. 2-1), limpiado y recoloreado para el tema.
 */
export function MotoMapa({ onServicio }: { onServicio?: () => void }) {
  const { state } = useApp();
  const resumen = useMemo(() => resumenZonas(state), [state]);
  const [sel, setSel] = useState<ZonaId | null>(null);
  const [angulo, setAngulo] = useState<Angulo>("izq");

  const porId = useMemo(() => {
    const m = new Map<ZonaId, ZonaResumen>();
    for (const r of resumen) m.set(r.zona.id, r);
    return m;
  }, [resumen]);

  const activa = sel ? porId.get(sel) ?? null : null;

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl" style={{ background: "#0b0e11" }}>
        <img
          src={ANGULOS.find((a) => a.id === angulo)?.imagen}
          alt={`Perfil ${angulo === "izq" ? "izquierdo" : "derecho"} de la Yamaha XTZ 250`}
          className="mx-auto w-full max-h-[50vh] select-none object-contain"
          style={{ filter: "brightness(1.35) contrast(1.15) drop-shadow(0 0 1px rgba(170,186,205,.55))" }}
          draggable={false}
        />

        {ZONAS.map((z) => {
          const r = porId.get(z.id);
          const estado = r?.estado ?? "ok";
          const c = COLOR[estado];
          const activo = sel === z.id;
          return (
            <button
              key={z.id}
              onClick={() => setSel(activo ? null : z.id)}
              aria-label={`${z.nombre}: ${ETIQUETA[estado]}${r?.criticos ? `, ${r.criticos} urgente(s)` : ""}`}
              aria-pressed={activo}
              className="absolute flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95"
              style={{
                left: `${z.pos[angulo].x}%`,
                top: `${z.pos[angulo].y}%`,
                transform: "translate(-50%, -50%)",
                background: c.soft,
                border: `2px solid ${c.ring}`,
                boxShadow: activo ? `0 0 0 4px ${c.ring}` : "none",
              }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[0.6rem] font-extrabold"
                style={{ background: c.fg, color: "#0b0e11" }}
              >
                {estado === "critical" ? "!" : estado === "warning" ? "·" : "✓"}
              </span>
              {estado === "critical" && (
                <span
                  className="absolute inset-0 animate-ping rounded-full"
                  style={{ border: `2px solid ${c.ring}`, animationDuration: "2.6s" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* selector de vista */}
      <div className="mt-2 flex gap-1.5">
        {ANGULOS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAngulo(a.id)}
            aria-pressed={angulo === a.id}
            className="min-h-[44px] flex-1 rounded-xl border px-2 text-[0.7rem] font-semibold"
            style={{
              background: angulo === a.id ? "var(--brand)" : "var(--surface-2)",
              color: angulo === a.id ? "#0b0e11" : "var(--ink-2)",
              borderColor: angulo === a.id ? "var(--brand)" : "var(--line)",
            }}
          >
            {a.corto} · {a.etiqueta.split(" ")[1]}
          </button>
        ))}
      </div>

      {/* leyenda + zonas como chips (para guantes o pantallas angostas) */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {(["ok", "warning", "critical"] as const).map((k) => (
          <span key={k} className="ink-3 flex items-center gap-1 text-[0.62rem] font-semibold">
            <span className="h-2 w-2 rounded-full" style={{ background: COLOR[k].fg }} />
            {ETIQUETA[k]}
          </span>
        ))}
        <span className="ink-3 ml-auto text-[0.6rem]">Manual B9L · pág. 2-1</span>
      </div>

      <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1" style={{ scrollbarWidth: "none" }}>
        {resumen.map((r) => {
          const c = COLOR[r.estado];
          const activo = sel === r.zona.id;
          return (
            <button
              key={r.zona.id}
              onClick={() => setSel(activo ? null : r.zona.id)}
              className="shrink-0 rounded-full px-2.5 py-1.5 text-[0.66rem] font-semibold"
              style={{
                background: activo ? c.fg : "var(--surface-2)",
                color: activo ? "#0b0e11" : "var(--ink-2)",
                border: `1px solid ${activo ? c.fg : "var(--line)"}`,
              }}
            >
              {r.zona.nombre}
            </button>
          );
        })}
      </div>

      {activa && (
        <div className="mt-3 rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="ink text-[0.86rem] font-bold">{activa.zona.nombre}</p>
              <p className="ink-3 text-[0.68rem]">{activa.zona.descripcion}</p>
            </div>
            <span
              className="chip shrink-0 text-[0.66rem] font-bold"
              style={{ background: COLOR[activa.estado].soft, color: COLOR[activa.estado].fg }}
            >
              {ETIQUETA[activa.estado]}
            </span>
          </div>

          {activa.componentes.length === 0 ? (
            <p className="ink-2 mt-2 text-[0.76rem]">
              Sin componentes cargados en esta zona. Añádelos en Mantenimientos → Componentes.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col divide-y" style={{ borderColor: "var(--hairline)" }}>
              {activa.componentes.map((d) => {
                const c = COLOR[
                  d.restantePct <= 0 || d.kmRestantes <= 0 ? "critical" : d.restantePct <= 0.25 ? "critical" : d.restantePct <= 0.4 ? "warning" : "ok"
                ];
                const detalle =
                  d.kmRestantes > 0
                    ? `Faltan ${num(Math.round(d.kmRestantes))} km`
                    : `${num(Math.round(d.kmExcedidos || 0))} km pasados`;
                return (
                  <li key={d.componente.id} className="flex items-start gap-2 py-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.fg }} />
                    <span className="min-w-0 flex-1">
                      <span className="ink block truncate text-[0.78rem] font-semibold">
                        {d.componente.nombre}
                      </span>
                      {(() => {
                        const pieza = buscarPiezaDeComponente(d.componente.nombre, d.componente.categoria);
                        if (!pieza) return null;
                        return (
                          <span className="ink-3 block text-[0.62rem] leading-snug">
                            <span style={{ color: "var(--brand)" }}>{pieza.specBadge}</span>
                            {" · "}
                            {pieza.inspectionTip}
                          </span>
                        );
                      })()}
                    </span>
                    <span className="nums ink-2 shrink-0 text-[0.7rem]">{detalle}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {onServicio && (
            <button className="btn btn-ghost mt-3 w-full text-[0.76rem]" onClick={onServicio}>
              <Wrench size={14} /> Registrar servicio
              <ChevronRight size={14} className="ml-auto" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
