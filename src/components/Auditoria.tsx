import { useMemo, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, ShieldCheck, TriangleAlert } from "lucide-react";
import type { AppState } from "../types";
import { auditoria, type Hallazgo, type SeveridadHallazgo } from "../lib/auditoria";
import { Chip, type Tono } from "./ui";

/**
 * Nombres legibles para los códigos que devuelve auditoria().
 * Si aparece un código nuevo sin traducir, se muestra el código tal cual.
 */
const ETIQUETAS: Record<string, string> = {
  "km-retroceso": "Kilometraje inconsistente",
  "fecha-futura": "Fecha futura",
  "doc-sin-fecha": "Documento sin vencimiento",
  "componente-sin-intervalo": "Componente sin intervalo",
  "tanqueo-incompleto": "Tanqueo sin galones",
  "odo-no-monotonico": "El odómetro retrocede",
};

type Grupo = {
  severidad: SeveridadHallazgo;
  titulo: string;
  tono: Tono;
  color: string;
  fondo: string;
  icono: ReactNode;
};

/** Orden fijo: lo urgente primero, para que se lea como una lista de pendientes. */
const GRUPOS: Grupo[] = [
  {
    severidad: "alta",
    titulo: "Alta",
    tono: "bad",
    color: "var(--bad)",
    fondo: "var(--bad-soft)",
    icono: <CircleAlert size={13} />,
  },
  {
    severidad: "media",
    titulo: "Media",
    tono: "warn",
    color: "var(--warn)",
    fondo: "var(--warn-soft)",
    icono: <TriangleAlert size={13} />,
  },
  {
    severidad: "baja",
    titulo: "Baja",
    tono: "info",
    color: "var(--info)",
    fondo: "var(--info-soft)",
    icono: <Info size={13} />,
  },
];

/**
 * Tarjeta de revisión de datos: llama a auditoria(state), agrupa por severidad
 * y muestra los hallazgos en castellano. No tiene acciones de escritura, así que
 * se comporta igual en modo solo lectura.
 */
export function Auditoria({
  state,
  hoy,
  limite = 4,
  className = "",
}: {
  state: AppState;
  /** Fecha de referencia YYYY-MM-DD; por defecto la de hoy. */
  hoy?: string;
  /** Máximo de hallazgos visibles por severidad. */
  limite?: number;
  className?: string;
}) {
  const hallazgos = useMemo(() => auditoria(state, hoy), [state, hoy]);

  const grupos = GRUPOS.map((g) => ({
    ...g,
    items: hallazgos.filter((h) => h.severidad === g.severidad),
  })).filter((g) => g.items.length > 0);

  const total = hallazgos.length;
  const altas = grupos.find((g) => g.severidad === "alta")?.items.length ?? 0;
  const medias = grupos.find((g) => g.severidad === "media")?.items.length ?? 0;
  const tonoTotal: Tono = altas > 0 ? "bad" : medias > 0 ? "warn" : total > 0 ? "info" : "ok";
  const colorTotal = altas > 0 ? "var(--bad)" : medias > 0 ? "var(--warn)" : total > 0 ? "var(--info)" : "var(--ok)";
  const fondoTotal = altas > 0 ? "var(--bad-soft)" : medias > 0 ? "var(--warn-soft)" : total > 0 ? "var(--info-soft)" : "var(--ok-soft)";

  const subtitulo =
    total === 0
      ? "Los datos cargados son coherentes entre sí."
      : `${total} ${total === 1 ? "dato por revisar" : "datos por revisar"} · kilómetros, fechas, documentos y componentes.`;

  return (
    <section className={`card p-4 ${className}`} aria-label="Revisión de datos">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: fondoTotal, color: colorTotal }}
          >
            {total === 0 ? <CircleCheck size={17} /> : <ShieldCheck size={17} />}
          </span>
          <div className="min-w-0">
            <h2 className="ink text-[0.95rem] font-bold">Revisión de datos</h2>
            <p className="ink-2 mt-0.5 text-[0.72rem] leading-snug">{subtitulo}</p>
          </div>
        </div>
        <Chip tono={tonoTotal}>{total === 0 ? "Al día" : `${total}`}</Chip>
      </div>

      {total === 0 ? (
        <div
          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "var(--ok-soft)" }}
        >
          <CircleCheck size={15} className="shrink-0" style={{ color: "var(--ok)" }} />
          <p className="text-[0.76rem] font-semibold leading-snug" style={{ color: "var(--ok)" }}>
            Sin inconsistencias — 0 revisiones pendientes
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {grupos.map((g) => (
            <div key={g.severidad} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center" style={{ color: g.color }}>
                  {g.icono}
                </span>
                <p className="ink-2 text-[0.64rem] font-bold uppercase tracking-wide">
                  Severidad {g.titulo}
                </p>
                <span className="ink-3 text-[0.64rem] font-semibold">· {g.items.length}</span>
              </div>

              {g.items.slice(0, limite).map((h, i) => (
                <HallazgoFila key={`${h.codigo}-${i}`} hallazgo={h} color={g.color} fondo={g.fondo} />
              ))}

              {g.items.length > limite && (
                <p className="ink-3 pl-1 text-[0.66rem]">
                  y {g.items.length - limite} más de severidad {g.titulo.toLowerCase()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="ink-3 mt-3 text-[0.64rem] leading-relaxed">
        Se recalcula cada vez que abres la app y no modifica nada: solo te dice qué datos conviene corregir a mano.
      </p>
    </section>
  );
}

function HallazgoFila({ hallazgo, color, fondo }: { hallazgo: Hallazgo; color: string; fondo: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: fondo }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.76rem] font-bold leading-snug" style={{ color }}>
          {ETIQUETAS[hallazgo.codigo] ?? hallazgo.codigo}
        </span>
        <span className="ink-3 shrink-0 font-mono text-[0.58rem]">{hallazgo.codigo}</span>
      </div>
      <p className="ink-2 mt-0.5 text-[0.72rem] leading-relaxed">{hallazgo.mensaje}</p>
    </div>
  );
}
