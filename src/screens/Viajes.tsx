import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Download, Flag, MapPin, Plus, Trash2 } from "lucide-react";
import type { Viaje } from "../types";
import { useApp } from "../store/AppStore";
import { Chip, EmptyState, Field, Segmented } from "../components/ui";
import { formatDate, formatFechaCorta, isoDate, money, num } from "../lib/format";

type TabMode = "cards" | "table";
type SortDir = "asc" | "desc";

/** Lee o escribe la preferencia de vista en localStorage. */
function useVista(pantalla: string): [TabMode, (v: TabMode) => void] {
  const key = `motoapp:vista:${pantalla}`;
  const [vista, setVista] = useState<TabMode>(() => {
    try {
      return (localStorage.getItem(key) as TabMode) ?? "cards";
    } catch {
      return "cards";
    }
  });
  const set = (v: TabMode) => {
    setVista(v);
    try { localStorage.setItem(key, v); } catch { /* noop */ }
  };
  return [vista, set];
}

/** Escapa un valor para CSV: comillas dobles internas y envuelve si hay separador/salto. */
function csvField(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return "";
  const s = String(v).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Genera CSV con BOM UTF-8 y separador ; (Excel es-CO). */
function descargarCSV(viajes: Viaje[], fecha: string) {
  const header = ["Ruta", "Fecha", "Km inicio", "Km fin", "Km recorrido", "Litros", "km/L", "Costo", "Ida y vuelta", "Notas"];
  const rows = viajes.map((v) => {
    const km = Math.max(0, v.kmFin - v.kmInicio);
    const kmL = v.litros && v.litros > 0 && km > 0 ? +(km / v.litros).toFixed(1) : "";
    return [
      v.nombre,
      v.fecha,
      v.kmInicio,
      v.kmFin,
      km,
      v.litros ?? "",
      kmL,
      v.costo ?? "",
      v.ida_y_vuelta ? "Sí" : "",
      v.notas ?? "",
    ];
  });
  const lines = [header, ...rows].map((r) => r.map(csvField).join(";"));
  const bom = "\uFEFF";
  const csv = bom + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `viajes-${fecha}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lee "9.420" o "9420" y devuelve 9420 (los km se guardan enteros). */
function aEntero(texto: string): number {
  const solo = texto.replace(/[^\d]/g, "");
  return solo ? Number(solo) : 0;
}

/** Lee "3,2", "3.2" o "1.500" y devuelve el número (los decimales se aceptan con coma o punto). */
function aDecimal(texto: string): number {
  const limpio = texto.replace(/[^\d.,]/g, "");
  const corte = Math.max(limpio.lastIndexOf("."), limpio.lastIndexOf(","));
  if (corte === -1) {
    const n = Number(limpio);
    return Number.isFinite(n) ? n : 0;
  }
  const entero = limpio.slice(0, corte).replace(/[.,]/g, "") || "0";
  const decimales = limpio.slice(corte + 1).replace(/[.,]/g, "") || "0";
  const n = Number(`${entero}.${decimales}`);
  return Number.isFinite(n) ? n : 0;
}

/** Kilómetros del recorrido: odómetro final menos inicial. */
function kmDe(v: Viaje): number {
  return Math.max(0, v.kmFin - v.kmInicio);
}

/** Rendimiento del viaje; null si no se cargaron litros o no hubo km. */
function rendimientoDe(v: Viaje): { kmL: number; l100: number } | null {
  const km = kmDe(v);
  const litros = v.litros ?? 0;
  if (km <= 0 || litros <= 0) return null;
  return { kmL: km / litros, l100: (litros * 100) / km };
}

function ordenarDesc(lista: Viaje[]): Viaje[] {
  return [...lista].sort((a, b) => {
    if (a.fecha === b.fecha) return b.kmInicio - a.kmInicio;
    return a.fecha < b.fecha ? 1 : -1;
  });
}

export function Viajes() {
  const { state, guardarViaje, borrarViaje } = useApp();
  const v = state.vehiculo;
  const [tabMode, setTabMode] = useVista("viajes");

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(isoDate());
  const [kmInicio, setKmInicio] = useState(String(v?.kmActual ?? ""));
  const [kmFin, setKmFin] = useState("");
  const [litros, setLitros] = useState("");
  const [costo, setCosto] = useState("");
  const [idaVuelta, setIdaVuelta] = useState(false);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");

  const viajes = useMemo(() => ordenarDesc(state.viajes), [state.viajes]);

  const exportarCSV = useCallback(() => {
    descargarCSV(state.viajes, isoDate());
  }, [state.viajes]);

  const totalKm = viajes.reduce((a, x) => a + kmDe(x), 0);
  const totalLitros = viajes.reduce((a, x) => a + (x.litros ?? 0), 0);
  const conRendimiento = viajes.filter((x) => rendimientoDe(x) !== null);
  const promedioKmL = totalLitros > 0 ? totalKm / totalLitros : 0;

  // El gráfico va del viaje más viejo al más reciente.
  const serie = useMemo(
    () =>
      [...viajes].reverse().flatMap((x) => {
        const r = rendimientoDe(x);
        return r ? [{ label: formatFechaCorta(x.fecha), value: r.kmL }] : [];
      }),
    [viajes],
  );

  function limpiar() {
    setNombre("");
    setKmFin("");
    setLitros("");
    setCosto("");
    setNotas("");
    setIdaVuelta(false);
    setError("");
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!v) return;
    const ini = aEntero(kmInicio);
    const fin = aEntero(kmFin);
    if (!nombre.trim()) {
      setError("Ponle nombre a la ruta (por ejemplo «Villavicencio → Restrepo»).");
      return;
    }
    if (fin <= ini) {
      setError("El km final tiene que ser mayor que el inicial.");
      return;
    }
    const l = aDecimal(litros);
    if (litros.trim() && l <= 0) {
      setError("Los litros deben ser un número mayor que cero.");
      return;
    }
    guardarViaje({
      id: crypto.randomUUID(),
      vehiculoId: v.id,
      nombre: nombre.trim(),
      fecha: fecha || isoDate(),
      kmInicio: ini,
      kmFin: fin,
      litros: litros.trim() ? l : undefined,
      costo: costo.trim() ? aEntero(costo) : undefined,
      ida_y_vuelta: idaVuelta || undefined,
      notas: notas.trim() || undefined,
    });
    // El próximo viaje arranca donde terminó el anterior.
    setKmInicio(String(fin));
    limpiar();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="ink text-[1.35rem] font-extrabold tracking-tight">Viajes</h1>
          <p className="ink-2 text-[0.8rem]">Cada ruta con sus kilómetros y su rendimiento</p>
        </div>
        <Chip tono="brand">
          <MapPin size={11} /> {viajes.length} {viajes.length === 1 ? "ruta" : "rutas"}
        </Chip>
      </div>

      {/* ---------------- Alta rápida ---------------- */}
      <form className="card p-4" onSubmit={guardar}>
        <h2 className="ink flex items-center gap-1.5 text-[0.95rem] font-bold">
          <Flag size={15} style={{ color: "var(--brand)" }} /> Nuevo viaje
        </h2>
        <p className="ink-3 text-[0.7rem]">Los km salen del odómetro: si hiciste ida y vuelta, ya vienen incluidos.</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Ruta" className="sm:col-span-2">
            <input
              className="input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Villavicencio → Restrepo"
            />
          </Field>
          <Field label="Fecha">
            <input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
          <Field label="Kilometraje inicial">
            <input
              className="input nums"
              inputMode="numeric"
              value={kmInicio}
              onChange={(e) => setKmInicio(e.target.value)}
              placeholder="9420"
            />
          </Field>
          <Field label="Kilometraje final">
            <input
              className="input nums"
              inputMode="numeric"
              value={kmFin}
              onChange={(e) => setKmFin(e.target.value)}
              placeholder="9500"
            />
          </Field>
          <Field label="Litros (opcional)" hint="Con los litros se calcula el rendimiento.">
            <input
              className="input nums"
              inputMode="decimal"
              value={litros}
              onChange={(e) => setLitros(e.target.value)}
              placeholder="3,2"
            />
          </Field>
          <Field label="Costo (opcional)">
            <input
              className="input nums"
              inputMode="numeric"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              placeholder="64000"
            />
          </Field>
          <Field label="Notas (opcional)">
            <input
              className="input"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Vía El Calvario, con parada en el mirador"
            />
          </Field>
        </div>

        <label className="ink-2 mt-3 flex items-center gap-2 text-[0.78rem] font-semibold">
          <input
            type="checkbox"
            checked={idaVuelta}
            onChange={(e) => setIdaVuelta(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          Fue ida y vuelta
        </label>

        {error && (
          <p className="mt-2 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold" style={{ background: "var(--bad-soft)", color: "var(--bad)" }}>
            {error}
          </p>
        )}

        <button className="btn btn-primary mt-3 w-full" type="submit">
          <Plus size={15} /> Guardar viaje
        </button>
      </form>

      {/* ---------------- Totales ---------------- */}
      {viajes.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat etiqueta="Rutas" valor={num(viajes.length)} />
          <MiniStat etiqueta="Km recorridos" valor={`${num(totalKm)} km`} />
          <MiniStat etiqueta="Litros" valor={totalLitros > 0 ? num(totalLitros, 1) : "—"} />
          <MiniStat etiqueta="Promedio" valor={promedioKmL > 0 ? `${num(promedioKmL, 1)} km/l` : "—"} />
        </div>
      )}

      {/* ---------------- Gráfico ---------------- */}
      {serie.length > 0 && (
        <div className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="ink text-[0.95rem] font-bold">Rendimiento por viaje</h2>
              <p className="ink-3 text-[0.68rem]">km/l de cada ruta, de la más vieja a la más reciente</p>
            </div>
            <Chip tono="info">{conRendimiento.length} con litros</Chip>
          </div>
          <div className="mt-2">
            <GraficoRendimiento puntos={serie} promedio={promedioKmL} />
          </div>
        </div>
      )}

      {/* ---------------- Lista ---------------- */}
      {viajes.length === 0 ? (
        <EmptyState
          icon={<MapPin size={22} />}
          title="Todavía no hay viajes"
          description="Registra la ruta, el odómetro de salida y de llegada. Si anotas los litros, la app te dice cuánto rinde la moto en ese recorrido."
        />
      ) : (
        <>
          {/* Toggle Tarjetas | Tabla */}
          <div className="flex items-center justify-between">
            <Segmented
              value={tabMode}
              onChange={setTabMode}
              size="sm"
              options={[
                { value: "cards", label: "Tarjetas" },
                { value: "table", label: "Tabla" },
              ]}
            />
            <button className="btn btn-ghost text-[0.72rem] px-2.5 py-1.5" onClick={exportarCSV}>
              <Download size={13} /> Exportar CSV
            </button>
          </div>

          {tabMode === "table" ? (
            <TablaViajes viajes={viajes} onBorrar={borrarViaje} />
          ) : (
            <div className="flex flex-col gap-2">
              {viajes.map((x) => {
                const km = kmDe(x);
                const r = rendimientoDe(x);
                return (
                  <div key={x.id} className="card p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="ink text-[0.88rem] font-bold leading-snug">{x.nombre}</h3>
                          {x.ida_y_vuelta && <Chip tono="neutral">ida y vuelta</Chip>}
                        </div>
                        <p className="ink-3 nums text-[0.68rem]">
                          {formatDate(x.fecha)} · {num(x.kmInicio)} → {num(x.kmFin)} km
                        </p>
                      </div>
                      <button
                        className="icon-btn shrink-0"
                        onClick={() => {
                          if (window.confirm(`¿Borrar el viaje «${x.nombre}»?`)) borrarViaje(x.id);
                        }}
                        aria-label={`Borrar ${x.nombre}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Chip tono="brand">{num(km)} km</Chip>
                      {r ? (
                        <>
                          <Chip tono={r.kmL >= 25 ? "ok" : r.kmL >= 18 ? "warn" : "bad"}>{num(r.kmL, 1)} km/l</Chip>
                          <Chip tono="info">{num(r.l100, 1)} L/100 km</Chip>
                        </>
                      ) : (
                        <span className="ink-3 text-[0.68rem]">Sin litros: no se puede calcular el rendimiento</span>
                      )}
                      {x.litros ? <span className="ink-2 nums text-[0.68rem]">{num(x.litros, 1)} l</span> : null}
                      {x.costo ? <span className="ink-2 nums text-[0.68rem]">· {money(x.costo)}</span> : null}
                    </div>

                    {x.notas && <p className="ink-2 mt-1.5 text-[0.7rem]">{x.notas}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MiniStat({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="card-flat px-2.5 py-2">
      <p className="ink-3 text-[0.58rem] font-bold uppercase tracking-wide">{etiqueta}</p>
      <p className="ink nums text-[0.82rem] font-bold">{valor}</p>
    </div>
  );
}

/** Línea simple en SVG (sin librerías) con el km/l de cada viaje. */
function GraficoRendimiento({
  puntos,
  promedio,
}: {
  puntos: { label: string; value: number }[];
  promedio: number;
}) {
  const W = 340;
  const H = 160;
  const pad = { l: 30, r: 12, t: 14, b: 26 };
  const vals = puntos.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const holgura = Math.max(1, (max - min) * 0.25);
  const lo = Math.max(0, min - holgura);
  const hi = max + holgura;
  const span = hi - lo || 1;
  const x = (i: number) =>
    pad.l + (puntos.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (puntos.length - 1)) * (W - pad.l - pad.r));
  const y = (valor: number) => pad.t + (1 - (valor - lo) / span) * (H - pad.t - pad.b);
  const linea = puntos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${linea} L${x(puntos.length - 1).toFixed(1)},${H - pad.b} L${x(0).toFixed(1)},${H - pad.b} Z`;
  const guias = [lo, (lo + hi) / 2, hi];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Rendimiento en km/l por viaje">
      {guias.map((g, i) => (
        <g key={i}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(g)}
            y2={y(g)}
            stroke="var(--line)"
            strokeDasharray="3 4"
          />
          <text x={4} y={y(g) + 3} fontSize="8" fill="var(--ink-3)">
            {num(g, 0)}
          </text>
        </g>
      ))}

      {promedio > 0 && promedio >= lo && promedio <= hi && (
        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={y(promedio)}
          y2={y(promedio)}
          stroke="var(--ok)"
          strokeWidth="1.2"
          strokeDasharray="5 3"
        />
      )}

      {puntos.length > 1 && <path d={area} fill="var(--brand)" opacity="0.12" />}
      <path d={linea} fill="none" stroke="var(--brand)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

      {puntos.map((p, i) => (
        <g key={`${p.label}-${i}`}>
          <circle cx={x(i)} cy={y(p.value)} r="3" fill="var(--brand)" stroke="var(--surface)" strokeWidth="1.5" />
          {(puntos.length <= 7 || i === 0 || i === puntos.length - 1) && (
            <text x={x(i)} y={H - 8} fontSize="8.5" fill="var(--ink-3)" textAnchor="middle">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** Flecha de ordenación en la cabecera de tabla. */
function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="inline-block w-3" />;
  return (
    <span className="inline-block w-3 text-[0.6rem]">
      {dir === "asc" ? "▲" : "▼"}
    </span>
  );
}

/** Cabecera de columna con ordenación. */
function Th({
  children,
  col,
  sortCol,
  sortDir,
  onSort,
  className = "",
}: {
  children: React.ReactNode;
  col: string;
  sortCol: string;
  sortDir: SortDir;
  onSort: (c: string) => void;
  className?: string;
}) {
  const active = col === sortCol;
  return (
    <th
      className={`ink-2 cursor-pointer select-none px-2 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider ${className}`}
      onClick={() => onSort(col)}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      role="columnheader"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSort(col); }}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <SortArrow active={active} dir={sortDir} />
      </span>
    </th>
  );
}

/** Tabla de viajes. */
function TablaViajes({
  viajes,
  onBorrar,
}: {
  viajes: Viaje[];
  onBorrar: (id: string) => void;
}) {
  const [sortCol, setSortCol] = useState<"fecha" | "km" | "ruta" | "kmL">("fecha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = useCallback((col: string) => {
    const c = col as "fecha" | "km" | "ruta" | "kmL";
    setSortCol((prev) => {
      if (prev === c) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return c;
      }
      setSortDir("asc");
      return c;
    });
  }, []);

  const sorted = useMemo(() => {
    const s = [...viajes].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "fecha") cmp = a.fecha.localeCompare(b.fecha);
      else if (sortCol === "km") cmp = kmDe(a) - kmDe(b);
      else if (sortCol === "ruta") cmp = a.nombre.localeCompare(b.nombre, "es");
      else if (sortCol === "kmL") {
        const ra = rendimientoDe(a);
        const rb = rendimientoDe(b);
        cmp = (ra?.kmL ?? -1) - (rb?.kmL ?? -1);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return s;
  }, [viajes, sortCol, sortDir]);

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--line)]">
      <table className="w-full table-fixed text-left">
        <colgroup>
          <col />
          <col className="w-[86px]" />
          <col className="w-[54px]" />
          <col className="hidden sm:table-column sm:w-[54px]" />
          <col className="hidden sm:table-column sm:w-[54px]" />
          <col className="w-[30px]" />
        </colgroup>
        <thead className="border-b border-[var(--line)] bg-[var(--surface)]">
          <tr>
            <Th col="ruta" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Ruta</Th>
            <Th col="fecha" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Fecha</Th>
            <Th col="km" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Km</Th>
            <Th col="kmL" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell">km/L</Th>
            <th className="ink-2 px-2 py-2 text-[0.68rem] font-bold uppercase tracking-wider hidden sm:table-cell">Litros</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {sorted.map((x) => {
            const km = kmDe(x);
            const r = rendimientoDe(x);
            return (
              <tr
                key={x.id}
                className="group transition-colors hover:bg-[var(--surface-2)]"
              >
                <td className="ink min-w-0 px-2 py-2 text-[0.76rem] font-semibold">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="min-w-0 truncate">{x.nombre}</span>
                    {x.ida_y_vuelta && <Chip tono="neutral" className="shrink-0 text-[0.6rem] px-1.5 py-0.5">ida/vuelta</Chip>}
                  </div>
                  <div className="ink-3 truncate text-[0.65rem] sm:hidden">
                    {r ? `${num(r.kmL, 1)} km/l` : ""}{x.litros ? ` · ${num(x.litros, 1)} l` : ""}
                  </div>
                </td>
                <td className="ink-2 nums px-2 py-2 text-[0.78rem]">{formatDate(x.fecha)}</td>
                <td className="ink nums px-2 py-2 text-[0.78rem] font-medium">{num(km)}</td>
                <td className="nums px-2 py-2 text-[0.78rem] hidden sm:table-cell">
                  {r ? (
                    <span style={{ color: r.kmL >= 25 ? "var(--ok)" : r.kmL >= 18 ? "var(--warn)" : "var(--bad)" }}>
                      {num(r.kmL, 1)}
                    </span>
                  ) : (
                    <span className="ink-3">—</span>
                  )}
                </td>
                <td className="ink-2 nums px-2 py-2 text-[0.78rem] hidden sm:table-cell">
                  {x.litros ? num(x.litros, 1) : "—"}
                </td>
                <td className="px-1 py-2 text-right">
                  <button
                    className="icon-btn shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      if (window.confirm(`¿Borrar el viaje «${x.nombre}»?`)) onBorrar(x.id);
                    }}
                    aria-label={`Borrar ${x.nombre}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
