import { Wrench, Shield, Undo2, Calendar } from "lucide-react";
import { money, num, formatDate } from "../lib/format";
import { Stat } from "../components/ui";
import {
  SERVICIOS_REALES,
  ADITAMENTOS,
  DEVOLUCIONES,
  INTERVALOS_MAESTROS,
} from "../data/servicios";

/** Totales calculados a partir de los datos reales. */
const TOTAL_MANTENIMIENTO = SERVICIOS_REALES.filter((s) => !s.anulada).reduce((a, s) => a + s.total, 0);
const TOTAL_ADITAMENTOS = ADITAMENTOS.reduce((a, d) => a + d.valor, 0);
const TOTAL_DEVUELTO = DEVOLUCIONES.reduce((a, d) => a + d.valor, 0);

function intervaloLabel(km: number | null, meses: number | null): string {
  const partes: string[] = [];
  if (km !== null) partes.push(`${num(km)} km`);
  if (meses !== null) partes.push(`${meses} mes${meses > 1 ? "es" : ""}`);
  return partes.length ? partes.join(" / ") : "—";
}

export function Inversiones() {
  return (
    <div className="flex flex-col gap-4">

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-2">
        <Stat
          label="Mantenimiento"
          value={money(TOTAL_MANTENIMIENTO)}
          icon={<Wrench size={14} />}
          tono="brand"
        />
        <Stat
          label="Aditamentos"
          value={money(TOTAL_ADITAMENTOS)}
          icon={<Shield size={14} />}
          tono="info"
        />
        <Stat
          label="Devuelto"
          value={money(TOTAL_DEVUELTO)}
          icon={<Undo2 size={14} />}
          tono="ok"
        />
      </div>

      {/* Lista plegable: Servicios */}
      <details className="card group" open>
        <summary className="ink cursor-pointer flex items-center gap-2 px-1 py-0.5 text-[0.92rem] font-semibold select-none list-none [&::-webkit-details-marker]:hidden">
          <Wrench size={16} className="shrink-0" style={{ color: "var(--brand)" }} />
          Servicios y repuestos
          <span className="ink-3 ml-auto text-xs font-normal">
            {SERVICIOS_REALES.length} registros
          </span>
          <span className="ml-1 transition-transform group-open:rotate-90">
            ▸
          </span>
        </summary>
        <div className="mt-2 flex flex-col gap-2 px-1">
          {SERVICIOS_REALES.map((s, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                s.anulada
                  ? "opacity-50 line-through"
                  : "bg-[var(--surface-3)]"
              }`}
            >
              <div className="shrink-0">
                <Calendar size={14} className="ink-3 mt-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="ink text-[0.82rem] font-semibold">
                    {formatDate(s.fecha)}
                  </span>
                  {s.km !== null && (
                    <span className="ink-3 text-xs">{num(s.km)} km</span>
                  )}
                  {s.anulada && (
                    <span className="chip chip-bad text-[0.62rem]">Anulada</span>
                  )}
                </div>
                <div className="ink-2 text-xs">{s.proveedor}</div>
                <div className="ink-3 mt-0.5 text-[0.72rem] leading-snug">{s.items}</div>
              </div>
              <div className="shrink-0 nums text-[0.82rem] font-bold" style={{ color: "var(--ink)" }}>
                {s.anulada ? "$0" : money(s.total)}
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Lista plegable: Aditamentos */}
      <details className="card group">
        <summary className="ink cursor-pointer flex items-center gap-2 px-1 py-0.5 text-[0.92rem] font-semibold select-none list-none [&::-webkit-details-marker]:hidden">
          <Shield size={16} className="shrink-0" style={{ color: "var(--info)" }} />
          Aditamentos y gear
          <span className="ink-3 ml-auto text-xs font-normal">
            {ADITAMENTOS.length} artículos
          </span>
          <span className="ml-1 transition-transform group-open:rotate-90">
            ▸
          </span>
        </summary>
        <div className="mt-2 flex flex-col gap-2 px-1">
          {ADITAMENTOS.map((a, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-[var(--surface-3)] px-3 py-2.5">
              <div className="shrink-0">
                <Calendar size={14} className="ink-3 mt-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="ink text-[0.82rem] font-semibold">{a.articulo}</div>
                <div className="ink-2 text-xs">
                  {formatDate(a.fecha)} · {a.proveedor}
                </div>
                <div className="ink-3 mt-0.5 text-[0.72rem]">{a.estado}</div>
              </div>
              <div className="shrink-0 nums text-[0.82rem] font-bold" style={{ color: "var(--ink)" }}>
                {a.valor > 0 ? money(a.valor) : "—"}
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Lista plegable: Devoluciones */}
      <details className="card group">
        <summary className="ink cursor-pointer flex items-center gap-2 px-1 py-0.5 text-[0.92rem] font-semibold select-none list-none [&::-webkit-details-marker]:hidden">
          <Undo2 size={16} className="shrink-0" style={{ color: "var(--ok)" }} />
          Devoluciones y reembolsos
          <span className="ink-3 ml-auto text-xs font-normal">
            {DEVOLUCIONES.length} artículos
          </span>
          <span className="ml-1 transition-transform group-open:rotate-90">
            ▸
          </span>
        </summary>
        <div className="mt-2 flex flex-col gap-2 px-1">
          {DEVOLUCIONES.map((d, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-[var(--surface-3)] px-3 py-2.5">
              <div className="shrink-0">
                <Calendar size={14} className="ink-3 mt-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="ink text-[0.82rem] font-semibold">{d.articulo}</div>
                <div className="ink-2 text-xs">
                  Compra {formatDate(d.fecha)} · Reembolso {formatDate(d.fechaReembolso)}
                </div>
              </div>
              <div className="shrink-0 nums text-[0.82rem] font-bold" style={{ color: "var(--ok)" }}>
                -{money(d.valor)}
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Tabla de intervalos maestros */}
      <details className="card group" open>
        <summary className="ink cursor-pointer flex items-center gap-2 px-1 py-0.5 text-[0.92rem] font-semibold select-none list-none [&::-webkit-details-marker]:hidden">
          <Calendar size={16} className="shrink-0" style={{ color: "var(--warn)" }} />
          Intervalos de mantenimiento
          <span className="ink-3 ml-auto text-xs font-normal">
            {INTERVALOS_MAESTROS.length} componentes
          </span>
          <span className="ml-1 transition-transform group-open:rotate-90">
            ▸
          </span>
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[0.78rem]">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="ink-2 pb-2 pt-1 text-left font-semibold">Componente</th>
                <th className="ink-2 pb-2 pt-1 text-right font-semibold">Intervalo</th>
                <th className="ink-2 pb-2 pt-1 text-right font-semibold">Último km</th>
                <th className="ink-2 pb-2 pt-1 text-right font-semibold">Costo est.</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {INTERVALOS_MAESTROS.map((row, i) => (
                <tr key={i} className="border-b border-[var(--surface-3)] last:border-0">
                  <td className="ink py-2.5 pr-2 font-medium">{row.componente}</td>
                  <td className="ink-2 nums text-right py-2.5 pr-2">
                    {intervaloLabel(row.intervaloKm, row.intervaloMeses)}
                  </td>
                  <td className="ink-2 nums text-right py-2.5 pr-2">
                    {row.ultimoKm !== null ? `${num(row.ultimoKm)}` : "—"}
                  </td>
                  <td className="ink nums text-right py-2.5 font-semibold">{row.costoEstimado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
