import { useState, useCallback } from "react";
import { Check, ChevronDown, ChevronUp, AlertTriangle, Zap } from "lucide-react";
import { SINTOMAS, type SintomaElectrico } from "../data/sintomas";
import { CAJAS } from "../data/fusibles";

/* ------------------------------------------------------------------ */
/*  Helpers para resolver fusibles desde fusibles.ts                   */
/* ------------------------------------------------------------------ */

function encontrarFusible(fusibleId: number | "principal"): { etiqueta: string; amperaje: string; nota?: string } | null {
  if (fusibleId === "principal") {
    const p = CAJAS.abs.principal;
    return {
      etiqueta: "Fusible principal",
      amperaje: `${p.amperaje} A`,
      nota: p.nota,
    };
  }
  const f = CAJAS.abs.caja.find((fu) => fu.puesto === fusibleId);
  if (!f) return null;
  return {
    etiqueta: f.nombre,
    amperaje: f.amperaje != null ? `${f.amperaje} A` : "Ver en fusible",
    nota: f.nota,
  };
}

/* ------------------------------------------------------------------ */
/*  Tarjeta: Cómo probar un fusible                                    */
/* ------------------------------------------------------------------ */

function ComoProbarFusible() {
  const pasos = [
    {
      titulo: "Inspección visual del filamento",
      detalle:
        "Saca el fusible y míralo con luz. El filamento metálico de dentro debe estar continuo. Si está roto o negro, el fusible está fundido.",
    },
    {
      titulo: "Continuidad con multímetro en ohmios",
      detalle:
        "Coloca el multímetro en modo continuidad (o ohmios). Toca las dos patas del fusible. Si suena (o marca ~0 Ω), está bueno. Si marca infinito (OL), está fundido.",
    },
    {
      titulo: "Prueba de recambio con el repuesto",
      detalle:
        "La caja lleva un fusible repuesto (puesto 4 o 5). Pónlo en el puesto del circuito que falla. Si todo funciona, confirmas que el fusible era el problema. Repón el repuesto.",
    },
  ];

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap size={18} style={{ color: "var(--warn)" }} />
        <h3 className="ink text-[0.92rem] font-bold">Cómo probar un fusible</h3>
      </div>
      <ol className="space-y-3">
        {pasos.map((p, i) => (
          <li key={i} className="flex gap-3">
            <span
              className="flex shrink-0 items-center justify-center rounded-full border border-[var(--line)] ink-2 mt-0.5 h-5 w-5 text-[0.65rem] font-bold"
            >
              {i + 1}
            </span>
            <div>
              <div className="ink text-[0.82rem] font-semibold">{p.titulo}</div>
              <p className="ink-2 mt-0.5 text-[0.8rem] leading-relaxed">{p.detalle}</p>
            </div>
          </li>
        ))}
      </ol>
      <div
        className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--bad)]/20 p-3"
        style={{ background: "var(--bad-soft)" }}
      >
        <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--bad)" }} />
        <p className="text-[0.78rem] leading-relaxed" style={{ color: "var(--bad)" }}>
          <strong>Nunca subas el amperaje.</strong> Poner un fusible de mayor amperaje puede derretir cables y causar un incendio. Usa siempre el amperaje especificado en el manual.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ficha de fusible (expandible)                                      */
/* ------------------------------------------------------------------ */

function FichaFusible({ fusibleId }: { fusibleId: number | "principal" }) {
  const [open, setOpen] = useState(false);
  const info = encontrarFusible(fusibleId);
  if (!info) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        className="btn btn-soft text-[0.75rem] py-1.5 px-2.5 gap-1"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="chip chip-brand">
          Fusible {fusibleId === "principal" ? "principal" : fusibleId} · {info.amperaje}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="card-flat mt-2 p-3 rise">
          <div className="ink text-[0.82rem] font-semibold">{info.etiqueta}</div>
          <div className="ink-2 mt-1 text-[0.78rem]">Amperaje: {info.amperaje}</div>
          {info.nota && <div className="ink-3 mt-1 text-[0.75rem] italic">{info.nota}</div>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pasos de diagnóstico para un síntoma                               */
/* ------------------------------------------------------------------ */

function PasosDiagnostico({ sintoma }: { sintoma: SintomaElectrico }) {
  const [hechos, setHechos] = useState<Set<number>>(new Set());

  const toggle = useCallback(
    (orden: number) => {
      setHechos((prev) => {
        const next = new Set(prev);
        if (next.has(orden)) next.delete(orden);
        else next.add(orden);
        return next;
      });
    },
    [],
  );

  const total = sintoma.pasos.length;
  const count = hechos.size;

  return (
    <div>
      {/* Contador de progreso */}
      <div
        className="mb-3 flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2"
        style={{ background: "var(--surface-2)" }}
      >
        <span className="ink-2 text-[0.8rem]">Progreso</span>
        <span
          className="nums text-[0.85rem] font-bold"
          aria-live="polite"
          style={{ color: count === total ? "var(--ok)" : "var(--brand)" }}
        >
          {count} de {total}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${total > 0 ? (count / total) * 100 : 0}%`,
            background: count === total ? "var(--ok)" : "var(--brand)",
          }}
        />
      </div>

      {/* Lista de pasos */}
      <ol className="space-y-3">
        {sintoma.pasos.map((paso) => {
          const esHecho = hechos.has(paso.orden);
          return (
            <li
              key={paso.orden}
              className={`flex gap-3 rounded-xl border p-3 transition-colors ${
                esHecho
                  ? "border-[var(--ok)]/30"
                  : "border-[var(--line)]"
              }`}
              style={esHecho ? { background: "var(--ok-soft)" } : {}}
            >
              {/* Número + botón hecho */}
              <div className="flex shrink-0 flex-col items-center gap-1">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.65rem] font-bold ${
                    esHecho ? "" : "border border-[var(--line)] ink-3"
                  }`}
                  style={esHecho ? { background: "var(--ok)", color: "#fff" } : {}}
                >
                  {paso.orden}
                </span>
                <button
                  type="button"
                  className="icon-btn h-6 w-6"
                  style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "8px",
                    background: esHecho ? "var(--ok)" : "var(--surface-2)",
                    borderColor: esHecho ? "var(--ok)" : "var(--line-strong)",
                    color: esHecho ? "#fff" : "transparent",
                  }}
                  onClick={() => toggle(paso.orden)}
                  aria-pressed={esHecho}
                  aria-label={esHecho ? `Desmarcar paso ${paso.orden}` : `Marcar paso ${paso.orden} como hecho`}
                >
                  <Check size={12} />
                </button>
              </div>

              {/* Contenido del paso */}
              <div className="min-w-0 flex-1">
                <div
                  className={`text-[0.85rem] font-semibold ${esHecho ? "line-through ink-3" : "ink"}`}
                >
                  {paso.accion}
                </div>
                <p
                  className={`mt-1 text-[0.8rem] leading-relaxed ${esHecho ? "ink-3" : "ink-2"}`}
                >
                  {paso.detalle}
                </p>

                {/* Ficha de fusible */}
                {paso.fusibleId != null && paso.fusibleId !== undefined && (
                  <FichaFusible fusibleId={paso.fusibleId} />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */

export function DiagnosticoElectrico() {
  const [seleccionado, setSeleccionado] = useState<SintomaElectrico | null>(null);

  return (
    <div className="space-y-4">
      {/* Título */}
      <div>
        <h2 className="h-sec ink">Diagnóstico eléctrico</h2>
        <p className="ink-2 mt-1 text-[0.82rem]">
          Elige el síntoma que presenta tu moto y sigue los pasos en orden.
        </p>
      </div>

      {/* Chips de síntomas */}
      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Síntomas eléctricos">
        {SINTOMAS.map((s) => {
          const activo = seleccionado?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={activo}
              aria-pressed={activo}
              onClick={() => setSeleccionado((prev) => (prev?.id === s.id ? null : s))}
              className={`chip text-[0.78rem] px-3 py-1.5 transition-all ${
                activo
                  ? "chip-brand"
                  : "bg-[var(--surface-3)] ink-2 hover:bg-[var(--surface-2)]"
              }`}
            >
              {s.titulo}
            </button>
          );
        })}
      </div>

      {/* Pasos del síntoma seleccionado */}
      {seleccionado && (
        <div className="rise">
          <h3 className="mb-3 ink text-[0.95rem] font-bold">{seleccionado.titulo}</h3>
          <PasosDiagnostico sintoma={seleccionado} />
        </div>
      )}

      {/* Tarjeta: Cómo probar un fusible */}
      <ComoProbarFusible />
    </div>
  );
}
