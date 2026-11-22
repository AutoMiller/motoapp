import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Download, Plus, Search, Wrench, X } from "lucide-react";
import { useApp } from "../store/AppStore";
import type { CategoriaMantenimiento, Mantenimiento } from "../types";
import { CATEGORIAS } from "../data/catalogo";
import { desgastes, diasProyectados, gastos, ritmoKmDiario } from "../lib/calc";
import { formatDate, isoDate, money, monthLabel, num } from "../lib/format";
import { relativa, fechaExacta } from "../lib/fechas";
import { Chip, EmptyState, Ring, Segmented } from "../components/ui";
import { Icono } from "../components/iconos";
import { ModalComponente, ModalMantenimiento } from "../components/formularios";

type TabMode = "cards" | "table";
type SortDir = "asc" | "desc";
type BitacoraFiltro = "todos" | "combustible" | "mantenimiento" | "repuestos";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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

/** Filtro de bitácora persistente en localStorage. */
function useBitacoraFiltro(): [BitacoraFiltro, (v: BitacoraFiltro) => void] {
  const key = "motoapp:bitacora:filtro";
  const [valor, setValor] = useState<BitacoraFiltro>(() => {
    try {
      return (localStorage.getItem(key) as BitacoraFiltro) ?? "todos";
    } catch {
      return "todos";
    }
  });
  const set = (v: BitacoraFiltro) => {
    setValor(v);
    try { localStorage.setItem(key, v); } catch { /* noop */ }
  };
  return [valor, set];
}

/** Clasifica un registro según el segmented control de bitácora. */
function grupoBitacora(m: Mantenimiento): BitacoraFiltro {
  if (m.tanqueo) return "combustible";
  // Repuestos = categorías de arrastre, llantas, batería
  if (m.categoria === "arrastre" || m.categoria === "llantas" || m.categoria === "bateria") return "repuestos";
  return "mantenimiento";
}

/** Hook con debounce genérico. */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer.current!);
  }, [value, delay]);
  return debounced;
}

/** Escapa un valor para CSV: comillas dobles internas y envuelve si hay separador/salto. */
function csvField(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return "";
  const s = String(v).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Genera CSV con BOM UTF-8 y separador ; (Excel es-CO). */
function descargarCSV(registros: Mantenimiento[], fecha: string) {
  const header = ["Fecha", "Km", "Ítem", "Tipo", "Costo", "Taller", "Descripción"];
  const rows = registros.map((m) => [
    m.fecha,
    m.km,
    m.titulo,
    m.tipo,
    m.costo,
    m.taller ?? "",
    m.descripcion ?? "",
  ]);
  const lines = [header, ...rows].map((r) => r.map(csvField).join(";"));
  const bom = "\uFEFF";
  const csv = bom + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mantenimientos-${fecha}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type Vista = "proximos" | "historial" | "plan";

export function Mantenimientos({
  onServicio,
}: {
  onServicio: (categoria?: CategoriaMantenimiento) => void;
}) {
  const { state } = useApp();
  const [vista, setVista] = useState<Vista>("proximos");
  const [tabMode, setTabMode] = useVista("mantenimientos");
  const v = state.vehiculo;
  const ds = useMemo(() => desgastes(state), [state]);
  const ritmo = useMemo(() => ritmoKmDiario(state), [state]);

  // Historial / Bitácora
  const todos = gastos(state);

  const anios = useMemo(() => {
    const set = new Set(todos.map((m) => m.fecha.slice(0, 4)));
    set.add(isoDate().slice(0, 4));
    return [...set].sort().reverse();
  }, [todos]);
  const [anio, setAnio] = useState(anios[0]);

  // Mes filter
  const mesesDisponibles = useMemo(() => {
    const set = new Set(todos.filter((m) => m.fecha.startsWith(anio)).map((m) => m.fecha.slice(0, 7)));
    return [...set].sort().reverse();
  }, [todos, anio]);
  const [mes, setMes] = useState<string>("todos");

  // Bitácora segmented filter (localStorage)
  const [bitacoraFiltro, setBitacoraFiltro] = useBitacoraFiltro();

  // Búsqueda con debounce
  const [busquedaRaw, setBusquedaRaw] = useState("");
  const busqueda = useDebounce(busquedaRaw, 150);

  // Filtro por categoría (legacy chips)
  const [filtro, setFiltro] = useState<CategoriaMantenimiento | "todos">("todos");
  const [editando, setEditando] = useState<Mantenimiento | undefined>();

  // Aplicar filtros en cascada: año → mes → bitácora → categoría → búsqueda
  const filtradosBitacora = useMemo(() => {
    let r = todos.filter((m) => m.fecha.startsWith(anio));
    if (mes !== "todos") r = r.filter((m) => m.fecha.startsWith(mes));
    if (bitacoraFiltro !== "todos") r = r.filter((m) => grupoBitacora(m) === bitacoraFiltro);
    if (filtro !== "todos") r = r.filter((m) => m.categoria === filtro);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      r = r.filter(
        (m) =>
          m.titulo.toLowerCase().includes(q) ||
          (m.taller ?? "").toLowerCase().includes(q) ||
          (m.descripcion ?? "").toLowerCase().includes(q) ||
          m.categoria.toLowerCase().includes(q),
      );
    }
    return r;
  }, [todos, anio, mes, bitacoraFiltro, filtro, busqueda]);

  const exportarCSV = useCallback(() => {
    descargarCSV(filtradosBitacora, isoDate());
  }, [filtradosBitacora]);

  const totalAnio = filtradosBitacora.reduce((a, m) => a + m.costo, 0);
  const agrupado = useMemo(() => {
    const map: { key: string; items: Mantenimiento[] }[] = [];
    for (const m of filtradosBitacora) {
      const key = m.fecha.slice(0, 7);
      const ultimo = map[map.length - 1];
      if (ultimo && ultimo.key === key) ultimo.items.push(m);
      else map.push({ key, items: [m] });
    }
    return map;
  }, [filtradosBitacora]);

  // Limpiar todos los filtros de bitácora
  const limpiarFiltros = useCallback(() => {
    setBitacoraFiltro("todos");
    setBusquedaRaw("");
    setMes("todos");
    setFiltro("todos");
  }, [setBitacoraFiltro]);

  // Texto vacío según filtros activos
  const textoVacio = useMemo(() => {
    const anioStr = anio;
    if (bitacoraFiltro === "combustible") return `No hay tanqueos en ${anioStr}`;
    if (bitacoraFiltro === "mantenimiento") return `No hay mantenimientos en ${anioStr}`;
    if (bitacoraFiltro === "repuestos") return `No hay repuestos en ${anioStr}`;
    if (busqueda.trim()) return `Sin resultados para "${busqueda}"`;
    return "Sin registros en este año";
  }, [anio, bitacoraFiltro, busqueda]);

  if (!v) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="ink text-[1.35rem] font-extrabold tracking-tight">Mantenimientos</h1>
          <p className="ink-2 text-[0.8rem]">Registra, consulta y anticipa</p>
        </div>
        <button className="btn btn-primary" onClick={() => onServicio()}>
          <Plus size={16} /> Registrar
        </button>
      </div>

      <Segmented
        value={vista}
        onChange={setVista}
        options={[
          { value: "proximos", label: "Próximos" },
          { value: "historial", label: "Historial" },
          { value: "plan", label: "Plan" },
        ]}
      />

      {vista === "proximos" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Vencidos" valor={ds.filter((d) => d.estado === "vencido").length} tono="var(--bad)" />
            <MiniStat label="Urgentes" valor={ds.filter((d) => d.estado === "urgente").length} tono="var(--warn)" />
            <MiniStat label="Al día" valor={ds.filter((d) => d.estado === "ok").length} tono="var(--ok)" />
          </div>

          {ds.length === 0 && (
            <EmptyState
              icon={<Wrench size={22} />}
              title="Aún no tienes plan de mantenimiento"
              description="Agrega componentes con su intervalo de km y tiempo para que la app calcule los próximos servicios."
              action={
                <button className="btn btn-primary" onClick={() => setVista("plan")}>
                  Configurar plan
                </button>
              }
            />
          )}

          <div className="flex flex-col gap-2">
            {ds.map((d) => (
              <div key={d.componente.id} className="card p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="ink text-[0.9rem] font-bold leading-snug">{d.componente.nombre}</h3>
                  {d.estado !== "ok" ? (
                    <Chip tono={d.estado === "vencido" || d.estado === "urgente" ? "bad" : "warn"}>
                      {d.estado === "vencido" ? "Vencido" : d.estado === "urgente" ? "Urgente" : "Próximo"}
                    </Chip>
                  ) : (
                    <Chip tono="ok">Al día</Chip>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Ring value={d.restantePct} size={46} stroke={4.5} />
                  <div className="min-w-0 flex-1">
                    <p className="ink-2 text-[0.74rem]">
                      {d.kmRestantes > 0 ? `Faltan ${num(d.kmRestantes)} km` : `Pasado por ${num(d.kmExcedidos)} km`}
                      {" · "}
                      {d.diasRestantes > 0
                        ? `≈ ${diasProyectados(d, ritmo) ?? d.diasRestantes} días`
                        : "vencido por tiempo"}
                    </p>
                    <p className="ink-3 nums text-[0.68rem]">
                      Próximo: {num(d.proximoKm)} km · {formatDate(d.proximoVencimiento)} · est. {money(d.componente.costoEstimado)}
                    </p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{
                          width: `${Math.max(2, d.restantePct * 100)}%`,
                          background: d.restantePct > 0.35 ? "var(--ok)" : d.restantePct > 0.15 ? "var(--warn)" : "var(--bad)",
                        }}
                      />
                    </div>
                  </div>
                  <button className="btn btn-soft shrink-0 px-2.5 py-1.5 text-[0.7rem]" onClick={() => onServicio(d.componente.categoria)}>
                    Hecho
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vista === "historial" && (
        <div className="flex flex-col gap-3">
          {/* Año chips + total */}
          <div className="flex items-center justify-between gap-2">
            <div className="scroll-x flex gap-1.5">
              {anios.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAnio(a); setMes("todos"); }}
                  className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                  style={{
                    background: anio === a ? "var(--brand)" : "var(--surface)",
                    color: anio === a ? "#fff" : "var(--ink-2)",
                    border: `1px solid ${anio === a ? "transparent" : "var(--line)"}`,
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
            <span className="nums ink-2 text-xs font-semibold">{money(totalAnio)}</span>
          </div>

          {/* Segmented: Todos | Combustible | Mantenimiento | Repuestos */}
          <Segmented
            value={bitacoraFiltro}
            onChange={setBitacoraFiltro}
            options={[
              { value: "todos", label: "Todos" },
              { value: "combustible", label: "Combustible" },
              { value: "mantenimiento", label: "Mantenimiento" },
              { value: "repuestos", label: "Repuestos" },
            ]}
          />

          {/* Búsqueda + Mes selector */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 shrink-0" style={{ color: "var(--ink-3)" }} />
              <input
                type="text"
                value={busquedaRaw}
                onChange={(e) => setBusquedaRaw(e.target.value)}
                placeholder="Buscar por título, taller, nota…"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2 pl-9 pr-8 text-[0.82rem] outline-none transition-colors focus:border-[var(--brand)]"
              />
              {busquedaRaw && (
                <button
                  onClick={() => setBusquedaRaw("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition-colors hover:bg-[var(--surface-3)]"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} style={{ color: "var(--ink-3)" }} />
                </button>
              )}
            </div>
            {mesesDisponibles.length > 0 && (
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[0.82rem] font-semibold outline-none focus:border-[var(--brand)]"
              >
                <option value="todos">Mes</option>
                {mesesDisponibles.map((mk) => {
                  const [, m] = mk.split("-").map(Number);
                  const label = MESES_CORTOS[m - 1] ?? `${m}`;
                  return <option key={mk} value={mk}>{label}</option>;
                })}
              </select>
            )}
          </div>

          {/* Resultados count */}
          {(bitacoraFiltro !== "todos" || mes !== "todos" || busqueda.trim() || filtro !== "todos") && (
            <div className="flex items-center justify-between">
              <span className="ink-2 text-[0.72rem] font-medium">
                {filtradosBitacora.length} resultado{filtradosBitacora.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={limpiarFiltros}
                className="ink-3 text-[0.7rem] font-semibold transition-colors hover:text-[var(--brand)]"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Toggle Tarjetas | Tabla + Export CSV */}
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
            {filtradosBitacora.length > 0 && (
              <button className="btn btn-ghost text-[0.72rem] px-2.5 py-1.5" onClick={exportarCSV}>
                <Download size={13} /> Exportar CSV
              </button>
            )}
          </div>

          {/* Tabla o Tarjetas */}
          {tabMode === "table" ? (
            filtradosBitacora.length > 0 ? (
              <TablaMantenimientos registros={filtradosBitacora} onEdit={setEditando} />
            ) : (
              <EmptyState
                icon={<CalendarDays size={22} />}
                title={textoVacio}
                description="Ajusta los filtros o registra un nuevo servicio."
                action={
                  <div className="flex gap-2">
                    <button className="btn btn-soft" onClick={limpiarFiltros}>Limpiar filtros</button>
                    <button className="btn btn-primary" onClick={() => onServicio()}>Registrar</button>
                  </div>
                }
              />
            )
          ) : agrupado.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={22} />}
              title={textoVacio}
              description="Ajusta los filtros o registra un nuevo servicio."
              action={
                <div className="flex gap-2">
                  <button className="btn btn-soft" onClick={limpiarFiltros}>Limpiar filtros</button>
                  <button className="btn btn-primary" onClick={() => onServicio()}>Registrar</button>
                </div>
              }
            />
          ) : (
            agrupado.map((grupo) => (
              <div key={grupo.key}>
                <p className="ink-3 mb-1.5 px-1 text-[0.7rem] font-bold uppercase tracking-wider">{monthLabel(grupo.key)}</p>
                <div className="card divide-y divide-[var(--line)]">
                  {grupo.items.map((m) => {
                    const meta = CATEGORIAS[m.categoria];
                    return (
                      <button
                        key={m.id}
                        onClick={() => setEditando(m)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                      >
                        {/* Icono por categoría */}
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: `${meta.color}18`, color: meta.color }}
                        >
                          <Icono nombre={meta.icono} size={17} />
                        </span>
                        {/* Info principal */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="ink truncate text-[0.85rem] font-semibold">{m.titulo}</span>
                            {m.taller && (
                              <Chip>{m.taller}</Chip>
                            )}
                          </div>
                          <div className="ink-3 nums truncate text-[0.68rem]">
                            <span className="font-medium">{relativa(m.fecha)}</span>
                            <span className="mx-1">·</span>
                            <span className="opacity-70">{fechaExacta(m.fecha)}</span>
                            <span className="mx-1">·</span>
                            {num(m.km)} km
                          </div>
                        </div>
                        {/* Costo con tabular-nums */}
                        <span className="nums ink shrink-0 text-[0.8rem] font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {money(m.costo)}
                        </span>
                        {m.evidencia && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--info)" }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {vista === "plan" && (
        <PlanComponentes />
      )}

      <ModalMantenimiento open={Boolean(editando)} onClose={() => setEditando(undefined)} inicial={editando} />
      {editando?.tanqueo && (
        <p className="ink-3 px-1 text-[0.68rem]">
          Este registro es un tanqueo: edítalo desde Gastos para recalcular el rendimiento.
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, valor, tono }: { label: string; valor: number; tono: string }) {
  return (
    <div className="card-flat px-3 py-2">
      <p className="ink-3 text-[0.62rem] font-bold uppercase tracking-wide">{label}</p>
      <p className="nums text-lg font-extrabold" style={{ color: tono }}>
        {valor}
      </p>
    </div>
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

/** Tabla de mantenimientos. */
function TablaMantenimientos({
  registros,
  onEdit,
}: {
  registros: Mantenimiento[];
  onEdit: (m: Mantenimiento) => void;
}) {
  const [sortCol, setSortCol] = useState<"fecha" | "km" | "titulo" | "costo">("fecha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = useCallback((col: string) => {
    const c = col as "fecha" | "km" | "titulo" | "costo";
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
    const s = [...registros].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "fecha") cmp = a.fecha.localeCompare(b.fecha);
      else if (sortCol === "km") cmp = a.km - b.km;
      else if (sortCol === "titulo") cmp = a.titulo.localeCompare(b.titulo, "es");
      else if (sortCol === "costo") cmp = a.costo - b.costo;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return s;
  }, [registros, sortCol, sortDir]);

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--line)]">
      <table className="w-full table-fixed text-left">
        <colgroup>
          <col className="w-[74px]" />
          <col className="w-[58px]" />
          <col />
          <col className="hidden sm:table-column sm:w-[86px]" />
          <col className="hidden sm:table-column sm:w-[110px]" />
        </colgroup>
        <thead className="border-b border-[var(--line)] bg-[var(--surface)]">
          <tr>
            <Th col="fecha" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Fecha</Th>
            <Th col="km" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Km</Th>
            <Th col="titulo" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>Ítem</Th>
            <Th col="costo" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell">Costo</Th>
            <th className="ink-2 hidden px-2 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider sm:table-cell">Taller</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {sorted.map((m) => {
            const meta = CATEGORIAS[m.categoria];
            return (
              <tr
                key={m.id}
                className="cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                onClick={() => onEdit(m)}
              >
                <td className="ink nums px-2 py-2 text-[0.7rem] font-medium leading-tight">
                  <span className="block">
                    {new Date(`${m.fecha}T00:00:00`)
                      .toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
                      .replace(" de ", " ")}
                  </span>
                  <span className="ink-3 block text-[0.62rem]">{m.fecha.slice(0, 4)}</span>
                </td>
                <td className="ink-2 nums px-2 py-2 text-[0.72rem]">{num(m.km)}</td>
                <td className="min-w-0 px-2 py-2 text-[0.76rem]">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg" style={{ background: `${meta.color}18`, color: meta.color }}>
                      <Icono nombre={meta.icono} size={12} />
                    </span>
                    <span className="ink min-w-0 truncate font-semibold">{m.titulo}</span>
                  </div>
                  <div className="ink-3 truncate text-[0.65rem] sm:hidden">
                    {money(m.costo)}{m.taller ? ` · ${m.taller}` : ""}
                  </div>
                </td>
                <td className="nums ink hidden px-2 py-2 text-[0.76rem] font-semibold sm:table-cell">{money(m.costo)}</td>
                <td className="ink-2 hidden truncate px-2 py-2 text-[0.76rem] sm:table-cell">{m.taller ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PlanComponentes() {
  const { state } = useApp();
  const [edit, setEdit] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="h-sec ink">Plan de mantenimiento</h2>
          <p className="ink-2 text-xs">Ajusta intervalos, costos y último servicio</p>
        </div>
        <button className="btn btn-soft" onClick={() => setNuevo(true)}>
          <Plus size={15} /> Agregar
        </button>
      </div>
      <div className="card divide-y divide-[var(--line)]">
        {state.componentes.map((c) => (
          <button key={c.id} onClick={() => setEdit(c.id)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${CATEGORIAS[c.categoria].color}18`, color: CATEGORIAS[c.categoria].color }}
            >
              <Icono nombre={CATEGORIAS[c.categoria].icono} size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="ink truncate text-[0.85rem] font-semibold">{c.nombre}</div>
              <div className="ink-3 nums text-[0.68rem]">
                Cada {num(c.intervaloKm)} km o {c.intervaloMeses} meses · último {num(c.ultimoKm)} km ({formatDate(c.ultimaFecha)})
              </div>
            </div>
            <ChevronDown size={15} className="shrink-0 -rotate-90" style={{ color: "var(--ink-3)" }} />
          </button>
        ))}
      </div>
      <p className="ink-3 px-1 text-[0.68rem] leading-relaxed">
        El plan semilla sigue las periodicidades típicas de la XTZ 250. Ajusta según tu manual, tu aceite y tu uso
        (ciudad, carretera, destapado).
      </p>
      <ModalComponente open={Boolean(edit)} onClose={() => setEdit(null)} componente={state.componentes.find((c) => c.id === edit)} />
      <ModalComponente open={nuevo} onClose={() => setNuevo(false)} />
    </div>
  );
}