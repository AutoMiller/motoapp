import { useMemo, useState, type FormEvent } from "react";
import { Flag, MapPin, Plus, Trash2 } from "lucide-react";
import type { Viaje } from "../types";
import { useApp } from "../store/AppStore";
import { Chip, EmptyState, Field } from "../components/ui";
import { formatDate, formatFechaCorta, isoDate, money, num } from "../lib/format";

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
