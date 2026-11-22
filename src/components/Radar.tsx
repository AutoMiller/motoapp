import { useMemo } from "react";
import {
  AlertTriangle, BadgeCheck, ChevronRight, CircleAlert, Clock3, ShieldAlert, Wrench,
} from "lucide-react";
import { useApp } from "../store/AppStore";
import { auditoria } from "../lib/auditoria";
import { documentosConVencimiento, desgastes } from "../lib/calc";
import { ciudadPorId, evaluarPicoPlaca } from "../lib/picoPlaca";
import { isoDate } from "../lib/format";

type Tono = "bad" | "warn" | "info";

interface Item {
  id: string;
  tono: Tono;
  icono: "legal" | "desgaste" | "auditoria" | "pico";
  titulo: string;
  detalle: string;
  ir: SeccionRadar;
}

const ICONOS = {
  legal: ShieldAlert,
  desgaste: Wrench,
  auditoria: AlertTriangle,
  pico: Clock3,
} as const;

const COLORES: Record<Tono, { fg: string; bg: string; borde: string }> = {
  bad: { fg: "var(--bad)", bg: "var(--bad-soft)", borde: "rgba(239,68,68,.28)" },
  warn: { fg: "var(--warn)", bg: "var(--warn-soft)", borde: "rgba(245,158,11,.28)" },
  info: { fg: "var(--info)", bg: "var(--info-soft)", borde: "rgba(59,130,246,.25)" },
};

/**
 * Radar único de problemas: junta lo legal, el desgaste, las inconsistencias de
 * datos y el pico y placa en una sola lista priorizada, con acción a un toque.
 */
type SeccionRadar = "documentos" | "plan" | "alertas" | "pico" | "historial";

export function Radar({ ir }: { ir: (s: SeccionRadar) => void }) {
  const { state } = useApp();
  const v = state.vehiculo;

  const items = useMemo<Item[]>(() => {
    if (!v) return [];
    const out: Item[] = [];

    // 1. Legal: lo que puede dejar la moto en patios
    for (const d of documentosConVencimiento(state)) {
      if (d.diasRestantes < 30) {
        const vencido = d.diasRestantes < 0;
        out.push({
          id: `doc-${d.documento.id}`,
          tono: vencido ? "bad" : "warn",
          icono: "legal",
          titulo: vencido
            ? `${d.documento.nombre}: vencido hace ${Math.abs(d.diasRestantes)} días`
            : `${d.documento.nombre}: vence en ${d.diasRestantes} días`,
          detalle: vencido ? "No circules sin renovarlo" : "Renueva antes de la fecha",
          ir: "documentos",
        });
      }
    }

    // 2. Desgaste vencido o urgente
    for (const d of desgastes(state)) {
      if (d.estado === "vencido" || d.estado === "urgente") {
        out.push({
          id: `comp-${d.componente.id}`,
          tono: d.estado === "vencido" ? "bad" : "warn",
          icono: "desgaste",
          titulo: `${d.componente.nombre}: ${d.estado === "vencido" ? "pasado de intervalo" : "cerca del cambio"}`,
          detalle: d.kmRestantes > 0
            ? `Quedan ${Math.round(d.kmRestantes)} km · próximo a ${Math.round(d.proximoKm)} km`
            : `${Math.round(d.kmExcedidos || d.kmRecorridos - d.componente.intervaloKm)} km pasados · tocaba a ${Math.round(d.proximoKm)} km`,
          ir: "plan",
        });
      }
    }

    // 3. Inconsistencias de datos (auditoría del proyecto)
    const hallazgos = auditoria(state);
    const altos = hallazgos.filter((h) => h.severidad === "alta");
    const medios = hallazgos.filter((h) => h.severidad === "media");
    if (altos.length > 0) {
      out.push({
        id: "aud-alta",
        tono: "bad",
        icono: "auditoria",
        titulo: `${altos.length} dato${altos.length > 1 ? "s" : ""} inconsistente${altos.length > 1 ? "s" : ""}`,
        detalle: altos[0].mensaje.slice(0, 72),
        ir: "documentos",
      });
    } else if (medios.length > 0) {
      out.push({
        id: "aud-media",
        tono: "info",
        icono: "auditoria",
        titulo: `${medios.length} detalle${medios.length > 1 ? "s" : ""} por completar`,
        detalle: medios[0].mensaje.slice(0, 72),
        ir: "documentos",
      });
    }

    // 4. Pico y placa de hoy
    const ciudad = ciudadPorId(state.ajustes.ciudad);
    const hoy = isoDate();
    const pico = evaluarPicoPlaca(v.placa, hoy, ciudad, state.ajustes.tipoVehiculo === "moto",
      state.ajustes.picoPlacaDigitos);
    if (pico.restringido) {
      out.push({
        id: "pico",
        tono: "info",
        icono: "pico",
        titulo: "Hoy hay pico y placa",
        detalle: `${ciudad?.nombre ?? "Tu ciudad"} · no saques la moto en el horario restringido`,
        ir: "pico",
      });
    }

    return out;
  }, [state, v]);

  if (!v) return null;

  if (items.length === 0) {
    return (
      <div className="card flex items-center gap-3 p-4" style={{ borderColor: "rgba(34,197,94,.3)" }}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: "rgba(34,197,94,.12)", color: "#22c55e" }}>
          <BadgeCheck size={20} />
        </span>
        <div>
          <p className="ink text-[0.9rem] font-bold">Todo al día</p>
          <p className="ink-2 text-xs">Sin vencimientos, desgastes ni datos raros. Buen momento para rodar.</p>
        </div>
      </div>
    );
  }

  const graves = items.filter((i) => i.tono === "bad").length;
  const visibles = items.slice(0, 4);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 pb-1 pt-3.5">
        <div className="flex items-center gap-2">
          <CircleAlert size={15} style={{ color: graves ? "var(--bad)" : "var(--warn)" }} />
          <p className="ink text-[0.86rem] font-bold">Requiere tu atención</p>
        </div>
        <span className="chip" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>
          {items.length}
        </span>
      </div>

      <div className="flex flex-col">
        {visibles.map((it) => {
          const Icono = ICONOS[it.icono];
          const c = COLORES[it.tono];
          return (
            <button
              key={it.id}
              onClick={() => ir(it.ir)}
              className="flex items-center gap-3 px-4 py-2.5 text-left transition active:scale-[0.995]"
              style={{ borderTop: "1px solid var(--hairline)" }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: c.bg, color: c.fg, border: `1px solid ${c.borde}` }}>
                <Icono size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="ink block truncate text-[0.79rem] font-semibold">{it.titulo}</span>
                <span className="ink-3 block truncate text-[0.68rem]">{it.detalle}</span>
              </span>
              <ChevronRight size={15} className="ink-3 shrink-0" />
            </button>
          );
        })}
      </div>

      {items.length > visibles.length && (
        <button
          onClick={() => ir("alertas")}
          className="ink-2 w-full px-4 py-2.5 text-left text-[0.72rem] font-semibold"
          style={{ borderTop: "1px solid var(--hairline)" }}
        >
          Ver {items.length - visibles.length} más →
        </button>
      )}
    </div>
  );
}