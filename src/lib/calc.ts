import type {
  Alerta,
  AppState,
  CategoriaMantenimiento,
  Componente,
  Documento,
  EstadoComponente,
  Mantenimiento,
  Tanqueo,
} from "../types";
import { addMonths, daysBetween, daysUntil, isoDate, monthKey, parseISO } from "./format";

export const DIAS_MES = 30.44;

export interface Desgaste {
  componente: Componente;
  restantePct: number; // 0..1 vida útil restante del intervalo
  pctKm: number;
  pctTiempo: number;
  kmRestantes: number;
  kmExcedidos: number; // > 0 cuando ya se pasó del intervalo
  diasRestantes: number;
  proximoKm: number;
  proximoVencimiento: string;
  estado: EstadoComponente;
  kmRecorridos: number;
}

export function desgasteDe(c: Componente, kmActual: number, hoy = isoDate()): Desgaste {
  const kmRecorridos = Math.max(0, kmActual - c.ultimoKm);
  const pctKm = c.intervaloKm > 0 ? clamp(1 - kmRecorridos / c.intervaloKm, 0, 1) : 1;

  // Sin fecha del último servicio no se puede medir por tiempo: se usa solo el
  // kilometraje. Antes, una fecha ausente producía NaN y el componente quedaba
  // invisible para las alertas (nunca "vencido") — silencio, no ausencia de riesgo.
  const fechaValida = !!c.ultimaFecha && !Number.isNaN(Date.parse(c.ultimaFecha));
  const diasIntervalo = c.intervaloMeses * DIAS_MES;
  const diasTranscurridos = fechaValida ? Math.max(0, -daysUntil(c.ultimaFecha, hoy)) : 0;
  const pctTiempo = fechaValida && diasIntervalo > 0
    ? clamp(1 - diasTranscurridos / diasIntervalo, 0, 1)
    : 1;
  const restantePct = Math.min(pctKm, pctTiempo);
  const proximoKm = c.ultimoKm + c.intervaloKm;
  const proximoVencimiento = fechaValida ? addMonths(c.ultimaFecha, c.intervaloMeses) : "";
  const kmFaltan = proximoKm - kmActual;
  const kmRestantes = Math.max(0, kmFaltan);
  const diasRestantes = fechaValida ? daysUntil(proximoVencimiento, hoy) : 9999;
  return {
    componente: c,
    restantePct,
    pctKm,
    pctTiempo,
    kmRestantes,
    kmExcedidos: Math.max(0, -kmFaltan),
    diasRestantes,
    proximoKm,
    proximoVencimiento,
    estado: estado(restantePct, kmRestantes, diasRestantes),
    kmRecorridos,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function estado(restante: number, kmRestantes: number, diasRestantes: number): EstadoComponente {
  if (kmRestantes <= 0 || diasRestantes <= 0 || restante <= 0.02) return "vencido";
  if (restante <= 0.15) return "urgente";
  if (restante <= 0.35) return "proximo";
  return "ok";
}

export const ESTADO_LABEL: Record<EstadoComponente, string> = {
  ok: "Al día",
  proximo: "Próximo",
  urgente: "Urgente",
  vencido: "Vencido",
};

export function desgastes(state: AppState): Desgaste[] {
  const km = state.vehiculo?.kmActual ?? 0;
  return state.componentes
    .filter((c) => c.activo)
    .map((c) => desgasteDe(c, km))
    .sort((a, b) => a.restantePct - b.restantePct);
}

/** Salud del vehículo: promedio ponderado de vida útil restante + castigo por vencimientos legales. */
export function saludVehiculo(state: AppState): number {
  const ds = desgastes(state);
  // Lo legal pesa: es lo que te puede dejar en patios.
  const docs = documentosConVencimiento(state);
  const legales = docs.length === 0 ? 100 : (docs.filter((d) => d.diasRestantes >= 0).length / docs.length) * 100;
  // Sin nada que evaluar, no castigar.
  if (ds.length === 0 && docs.length === 0) return 100;
  const promedio = ds.length === 0 ? 100 : (ds.reduce((acc, d) => acc + d.restantePct, 0) / ds.length) * 100;
  return Math.round(clamp(promedio * 0.55 + legales * 0.45, 0, 100));
}

export interface DocumentoConEstado {
  documento: Documento;
  diasRestantes: number;
  vencido: boolean;
  porVencer: boolean;
}

export function documentosConVencimiento(state: AppState, hoy = isoDate()): DocumentoConEstado[] {
  return state.documentos
    .filter((d) => Boolean(d.fechaVencimiento))
    .map((d) => {
      const diasRestantes = daysUntil(d.fechaVencimiento!, hoy);
      return {
        documento: d,
        diasRestantes,
        vencido: diasRestantes < 0,
        porVencer: diasRestantes >= 0 && diasRestantes <= 30,
      };
    })
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}

export interface Aviso {
  id: string;
  titulo: string;
  detalle: string;
  severidad: "info" | "atencion" | "critico";
  fecha?: string;
  km?: number;
  destino: "vehiculo" | "alertas" | "mantenimientos" | "pico";
}

/** Avisos del día para el inicio: legales vencidos/por vencer, componentes urgentes, km alto. */
export function avisosDelDia(state: AppState, hoy = isoDate()): Aviso[] {
  const out: Aviso[] = [];
  for (const d of documentosConVencimiento(state, hoy)) {
    if (d.diasRestantes < 0) {
      out.push({
        id: `doc-${d.documento.id}`,
        titulo: `${d.documento.nombre} vencido`,
        detalle: `Venció el ${d.documento.fechaVencimiento} (${Math.abs(d.diasRestantes)} días)`,
        severidad: "critico",
        fecha: d.documento.fechaVencimiento,
        destino: "alertas",
      });
    } else if (d.diasRestantes <= 30) {
      out.push({
        id: `doc-${d.documento.id}`,
        titulo: `${d.documento.nombre} por vencer`,
        detalle: `Vence en ${d.diasRestantes} días`,
        severidad: d.diasRestantes <= 7 ? "critico" : "atencion",
        fecha: d.documento.fechaVencimiento,
        destino: "alertas",
      });
    }
  }
  for (const d of desgastes(state)) {
    if (d.estado === "vencido") {
      out.push({
        id: `comp-${d.componente.id}`,
        titulo: `${d.componente.nombre}: mantenimiento vencido`,
        detalle:
          d.kmExcedidos > 0
            ? `Superaste el intervalo por ${Math.round(d.kmExcedidos)} km`
            : `Vencido por tiempo (${Math.abs(d.diasRestantes)} días)`,
        severidad: "critico",
        fecha: d.proximoVencimiento,
        destino: "mantenimientos",
      });
    } else if (d.estado === "urgente") {
      out.push({
        id: `comp-${d.componente.id}`,
        titulo: `${d.componente.nombre} al ${Math.round(d.restantePct * 100)}% de vida`,
        detalle: `Faltan ${Math.round(d.kmRestantes)} km o ${d.diasRestantes} días`,
        severidad: "atencion",
        fecha: d.proximoVencimiento,
        destino: "mantenimientos",
      });
    }
  }
  for (const a of state.alertas.filter((a) => a.activa && a.fechaVencimiento)) {
    const dias = daysUntil(a.fechaVencimiento!, hoy);
    if (dias < 0 || dias <= a.anticipacionDias) {
      out.push({
        id: `alerta-${a.id}`,
        titulo: a.titulo,
        detalle: dias < 0 ? `Venció hace ${Math.abs(dias)} días` : `Vence en ${dias} días`,
        severidad: dias < 0 ? "critico" : "atencion",
        fecha: a.fechaVencimiento,
        destino: "alertas",
      });
    }
  }
  const orden = { critico: 0, atencion: 1, info: 2 };
  return out.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
}

/* ---------------- Gastos ---------------- */

export function gastos(state: AppState): Mantenimiento[] {
  return [...state.mantenimientos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export function totalPorMes(state: AppState, meses = 12): { key: string; total: number }[] {
  const hoy = new Date();
  const keys: string[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`);
  }
  const acc = new Map(keys.map((k) => [k, 0]));
  for (const m of state.mantenimientos) {
    const k = monthKey(m.fecha);
    if (acc.has(k)) acc.set(k, (acc.get(k) ?? 0) + (m.costo || 0));
  }
  return keys.map((key) => ({ key, total: acc.get(key) ?? 0 }));
}

export function totalMes(state: AppState, offset = 0): number {
  const hoy = new Date();
  const d = new Date(hoy.getFullYear(), hoy.getMonth() - offset, 1);
  const k = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
  return state.mantenimientos.filter((m) => monthKey(m.fecha) === k).reduce((a, m) => a + (m.costo || 0), 0);
}

export function combustiblePorMes(state: AppState, meses = 6): { key: string; total: number }[] {
  const hoy = new Date();
  const keys: string[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`);
  }
  const acc = new Map(keys.map((k) => [k, 0]));
  for (const m of state.mantenimientos) {
    if (!m.tanqueo) continue;
    const k = monthKey(m.fecha);
    if (acc.has(k)) acc.set(k, (acc.get(k) ?? 0) + (m.costo || 0));
  }
  return keys.map((key) => ({ key, total: acc.get(key) ?? 0 }));
}

export function totalPorCategoria(state: AppState): { categoria: CategoriaMantenimiento; total: number; count: number }[] {
  const map = new Map<CategoriaMantenimiento, { total: number; count: number }>();
  for (const m of state.mantenimientos) {
    const prev = map.get(m.categoria) ?? { total: 0, count: 0 };
    map.set(m.categoria, { total: prev.total + (m.costo || 0), count: prev.count + 1 });
  }
  return [...map.entries()]
    .map(([categoria, v]) => ({ categoria, ...v }))
    .sort((a, b) => b.total - a.total);
}

/* ---------------- Combustible ---------------- */

export interface TanqueoConDatos {
  mantenimiento: Mantenimiento;
  tanqueo: Tanqueo;
  rendimientoKmL?: number;
  rendimientoKmGal?: number;
  precioLitro: number;
  costoPorKm?: number;
}

export function tanqueos(state: AppState): TanqueoConDatos[] {
  const lista = state.mantenimientos
    .filter((m) => m.tanqueo)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.km - b.km));

  const out: TanqueoConDatos[] = [];
  let previo: Mantenimiento | null = null;
  for (const m of lista) {
    const t = m.tanqueo!;
    const precioLitro = t.galones > 0 ? t.precioGalon / 3.78541 : 0;
    let rendimientoKmL: number | undefined;
    let costoPorKm: number | undefined;
    if (previo && previo.tanqueo && t.tanqueLleno && previo.tanqueo.tanqueLleno && m.km > previo.km && t.galones > 0) {
      const km = m.km - previo.km;
      rendimientoKmL = km / (t.galones * 3.78541);
      costoPorKm = m.costo / km;
    }
    out.push({
      mantenimiento: m,
      tanqueo: t,
      rendimientoKmL,
      rendimientoKmGal: rendimientoKmL !== undefined ? rendimientoKmL * 3.78541 : undefined,
      precioLitro,
      costoPorKm,
    });
    if (t.tanqueLleno) previo = m;
  }
  return out;
}

export function resumenCombustible(state: AppState) {
  const t = tanqueos(state).filter((x) => x.rendimientoKmL !== undefined);
  const ultimos = t.slice(-5);
  const promedioKmL = ultimos.length ? ultimos.reduce((a, x) => a + (x.rendimientoKmL ?? 0), 0) / ultimos.length : 0;
  const totalGalones = state.mantenimientos.reduce((a, m) => a + (m.tanqueo?.galones ?? 0), 0);
  const totalGasto = state.mantenimientos.reduce((a, m) => a + (m.tanqueo ? m.costo : 0), 0);
  return {
    promedioKmL,
    promedioKmGal: promedioKmL * 3.78541,
    totalGalones,
    totalGasto,
    mediciones: t,
  };
}

/* ---------------- Costos por km ---------------- */

export function costoPorKm(state: AppState): number {
  const v = state.vehiculo;
  if (!v) return 0;
  const candidatos = [
    ...state.mantenimientos.map((m) => m.km),
    ...(v.kmInicial !== undefined ? [v.kmInicial] : []),
  ].filter((n) => Number.isFinite(n));
  const base = candidatos.length ? Math.min(...candidatos) : v.kmActual;
  const kmRecorridos = Math.max(1, v.kmActual - base);
  const total = state.mantenimientos.reduce((a, m) => a + (m.costo || 0), 0);
  return total / kmRecorridos;
}

/* ---------------- Alertas ---------------- */

export function alertasActivas(state: AppState): Alerta[] {
  return state.alertas.filter((a) => a.activa);
}

export function proximoVencimientoLegal(state: AppState): DocumentoConEstado | undefined {
  return documentosConVencimiento(state)[0];
}

export function kmFaltantesProximo(state: AppState): number {
  const ds = desgastes(state);
  if (!ds.length) return 0;
  return Math.min(...ds.map((d) => d.kmRestantes));
}

/** Ritmo de uso en km/día, calculado con el historial real de la moto. */
export function ritmoKmDiario(state: AppState): number {
  const v = state.vehiculo;
  if (!v) return 0;
  const puntos = [
    ...state.mantenimientos.map((m) => ({ fecha: m.fecha, km: m.km })),
    { fecha: isoDate(), km: v.kmActual },
  ].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  if (!primero || !ultimo) return 0;
  const dias = Math.max(1, daysBetween(primero.fecha, ultimo.fecha));
  const km = Math.max(0, ultimo.km - primero.km);
  return km / dias;
}

/** Días estimados hasta el próximo servicio según el ritmo real de uso. */
export function diasProyectados(d: Desgaste, ritmo: number): number | null {
  if (ritmo <= 0.5) return null;
  return Math.round(d.kmRestantes / ritmo);
}

export function edadMeses(desde: string, hasta = isoDate()): number {
  const a = parseISO(desde);
  const b = parseISO(hasta);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

/* ---------------- KPIs reales y proyecciones ---------------- */

/** Factor de conversión galones → litros (US gallon). */
const GALON_A_LITRO = 3.785;

/**
 * Consumo real de combustible basado en tramos válidos.
 *
 * Usa SOLO intervalos entre tanqueos consecutivos donde ambos tienen
 * tanqueLleno === true y el kilometraje es estrictamente creciente.
 * Los registros inválidos se descartan en vez de promediar basura.
 */
export function consumoReal(state: AppState): {
  kmL: number | null;
  kmGal: number | null;
  muestras: number;
  desde: string | null;
} {
  const lista = state.mantenimientos
    .filter((m) => m.tanqueo)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.km - b.km));

  const tramos: number[] = [];
  let previo: { km: number; fecha: string } | null = null;
  let primeraFecha: string | null = null;

  for (const m of lista) {
    const t = m.tanqueo!;
    // Solo consideramos tanqueos con tanque lleno como puntos de referencia
    if (!t.tanqueLleno) continue;

    if (previo !== null && m.km > previo.km && t.galones > 0) {
      const km = m.km - previo.km;
      const litros = t.galones * GALON_A_LITRO;
      tramos.push(km / litros);
    }

    if (primeraFecha === null) primeraFecha = m.fecha;
    previo = { km: m.km, fecha: m.fecha };
  }

  if (tramos.length === 0) {
    return { kmL: null, kmGal: null, muestras: 0, desde: null };
  }

  const kmL = tramos.reduce((a, b) => a + b, 0) / tramos.length;
  return {
    kmL: Math.round(kmL * 100) / 100,
    kmGal: Math.round(kmL * GALON_A_LITRO * 100) / 100,
    muestras: tramos.length,
    desde: primeraFecha,
  };
}

/**
 * Desglose del costo por kilómetro recorrido.
 *
 * Calcula el costo/km de solo combustible vs el total (combustible +
 * mantenimientos + documentos pagados) sobre los km del periodo con datos.
 */
export function desgloseCostoKm(state: AppState): {
  soloCombustible: number;
  total: number;
  km: number;
} {
  const v = state.vehiculo;
  if (!v) return { soloCombustible: 0, total: 0, km: 0 };

  // Determinamos el rango de km con datos
  const candidatos = [
    ...state.mantenimientos.map((m) => m.km),
    ...(v.kmInicial !== undefined ? [v.kmInicial] : []),
  ].filter((n) => Number.isFinite(n));
  const base = candidatos.length ? Math.min(...candidatos) : v.kmActual;
  const kmRecorridos = Math.max(1, v.kmActual - base);

  // Costo solo de combustible (tanqueos)
  const costoCombustible = state.mantenimientos.reduce((a, m) => a + (m.tanqueo ? m.costo || 0 : 0), 0);

  // Costo de mantenimientos (sin tanqueos)
  const costoMantenimiento = state.mantenimientos.reduce(
    (a, m) => a + (m.tanqueo ? 0 : m.costo || 0),
    0,
  );

  // Costo de documentos pagados
  const costoDocumentos = state.documentos.reduce((a, d) => a + (d.valor || 0), 0);

  const costoTotal = costoCombustible + costoMantenimiento + costoDocumentos;

  return {
    soloCombustible: Math.round((costoCombustible / kmRecorridos) * 100) / 100,
    total: Math.round((costoTotal / kmRecorridos) * 100) / 100,
    km: kmRecorridos,
  };
}

/**
 * Alerta de caída de consumo de combustible.
 *
 * Compara el rendimiento del último tramo válido contra el promedio de los
 * últimos 5 tramos válidos. Se activa si el último cae más de un 15%
 * respecto al promedio.
 */
export function alertaConsumo(state: AppState): {
  caidaPct: number;
  media: number;
  ultimo: number;
  activa: boolean;
} {
  // Obtenemos los tramos válidos de consumo (mismo criterio que consumoReal)
  const lista = state.mantenimientos
    .filter((m) => m.tanqueo)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.km - b.km));

  const tramos: number[] = [];
  let previo: { km: number } | null = null;

  for (const m of lista) {
    const t = m.tanqueo!;
    if (!t.tanqueLleno) continue;
    if (previo !== null && m.km > previo.km && t.galones > 0) {
      const km = m.km - previo.km;
      const litros = t.galones * GALON_A_LITRO;
      tramos.push(km / litros);
    }
    if (t.tanqueLleno) previo = { km: m.km };
  }

  // Necesitamos al menos 2 tramos para comparar
  if (tramos.length < 2) {
    return { caidaPct: 0, media: 0, ultimo: 0, activa: false };
  }

  const ultimo = tramos[tramos.length - 1];
  // Promedio de los últimos 5 tramos (incluyendo el último)
  const ultimos5 = tramos.slice(-5);
  const media = ultimos5.reduce((a, b) => a + b, 0) / ultimos5.length;

  if (media === 0) {
    return { caidaPct: 0, media: 0, ultimo, activa: false };
  }

  // Caída porcentual: positivo = el último es menor que el promedio
  const caidaPct = Math.round(((media - ultimo) / media) * 10000) / 100;
  const activa = caidaPct > 15;

  return {
    caidaPct,
    media: Math.round(media * 100) / 100,
    ultimo: Math.round(ultimo * 100) / 100,
    activa,
  };
}

/**
 * Proyección de la fecha del próximo servicio.
 *
 * Usa el ritmo real de uso (km/día) para estimar cuándo se alcanzará el
 * próximo intervalo del componente. Si el ritmo es 0 o no hay datos,
 * devuelve fecha null y motivo 'sin-datos'.
 */
export function proyeccionServicio(
  d: Desgaste,
  ritmoKmDia: number,
  hoy: string = isoDate(),
): {
  fecha: string | null;
  km: number;
  motivo: "km" | "tiempo" | "sin-datos";
} {
  // Sin ritmo de uso no podemos proyectar
  if (ritmoKmDia <= 0 || d.kmRestantes <= 0) {
    return { fecha: null, km: d.proximoKm, motivo: "sin-datos" };
  }

  // Días estimados para alcanzar el próximo intervalo por km
  const diasEstimados = Math.ceil(d.kmRestantes / ritmoKmDia);
  const fechaProy = new Date(parseISO(hoy));
  fechaProy.setDate(fechaProy.getDate() + diasEstimados);

  // Comparamos con la proyección por tiempo
  const fechaTiempo = d.proximoVencimiento ? parseISO(d.proximoVencimiento) : null;

  if (fechaTiempo && fechaTiempo < fechaProy) {
    // El tiempo vence antes que el kilometraje
    return {
      fecha: d.proximoVencimiento,
      km: d.proximoKm,
      motivo: "tiempo",
    };
  }

  return {
    fecha: isoDate(fechaProy),
    km: d.proximoKm,
    motivo: "km",
  };
}

/**
 * Índice de salud del vehículo (0-100).
 *
 * Combina tres dimensiones:
 * - Plan de mantenimiento (peso 55%): % de componentes activos con vida restante > 0.
 * - Documentos legales (peso 25%): % de documentos con fecha de vencimiento que están vigentes.
 * - Tareas de checklist (peso 20%): % de tareas completadas.
 *
 * La saludVehiculo existente se mantiene sin cambios.
 */
export function indiceSalud(state: AppState): {
  score: number;
  partes: { plan: number; legal: number; tareas: number };
} {
  // 1. Plan de mantenimiento: % de componentes activos con vida restante > 0
  const activos = state.componentes.filter((c) => c.activo);
  let planScore = 100; // sin componentes = perfecto
  if (activos.length > 0) {
    const km = state.vehiculo?.kmActual ?? 0;
    const conVida = activos.filter((c) => {
      const d = desgasteDe(c, km);
      return d.restantePct > 0;
    });
    planScore = (conVida.length / activos.length) * 100;
  }

  // 2. Documentos legales: % de documentos con vencimiento que están vigentes
  const docsConFecha = state.documentos.filter((d) => Boolean(d.fechaVencimiento));
  let legalScore = 100; // sin documentos = perfecto
  if (docsConFecha.length > 0) {
    const vigentes = docsConFecha.filter((d) => {
      const dias = daysUntil(d.fechaVencimiento!, isoDate());
      return dias >= 0;
    });
    legalScore = (vigentes.length / docsConFecha.length) * 100;
  }

  // 3. Tareas de checklist: % de tareas completadas
  let tareasScore = 100; // sin tareas = perfecto
  if (state.tareas.length > 0) {
    const completadas = state.tareas.filter((t) => t.hecho);
    tareasScore = (completadas.length / state.tareas.length) * 100;
  }

  const score = Math.round(
    clamp(planScore * 0.55 + legalScore * 0.25 + tareasScore * 0.2, 0, 100),
  );

  return {
    score,
    partes: {
      plan: Math.round(planScore),
      legal: Math.round(legalScore),
      tareas: Math.round(tareasScore),
    },
  };
}
