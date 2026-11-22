#!/usr/bin/env node
/**
 * Chequeos de lógica pura (sin DOM, sin red) para MotoApp.
 *
 * Cero dependencias nuevas: usa el esbuild que ya trae Vite para empaquetar
 * cada módulo de src/lib y lo evalúa con node:assert.
 *
 *   node tools/checks/run.mjs
 *
 * Las reglas verificadas salen de docs/research/03-normativa-colombia.md y del
 * plan de mantenimiento del manual B8L-F8199-S0, no de ocurrencias.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("../..", import.meta.url).pathname;
const esbuild = join(root, "node_modules/.bin/esbuild");
const out = mkdtempSync(join(tmpdir(), "motoapp-checks-"));

async function load(mod) {
  const file = join(out, `${mod.replace(/\W/g, "_")}.mjs`);
  execFileSync(esbuild, [join(root, "src/lib", `${mod}.ts`), "--bundle", "--format=esm",
    "--platform=node", `--outfile=${file}`, "--log-level=error"], { stdio: "inherit" });
  return import(pathToFileURL(file).href);
}

const pruebas = [];
const test = (nombre, fn) => pruebas.push({ nombre, fn });
const HOY = "2026-11-11";

/* ------------------------------- legal ---------------------------------- */
const legal = await load("legal");

test("SOAT 2026 por cilindraje: 250cc paga la banda >200", () => {
  assert.equal(legal.soatPorCilindraje(250), 761400);
});

test("SOAT 2026: 150cc cae en 101–200", () => {
  assert.equal(legal.soatPorCilindraje(150), 343300);
});

test("SOAT 2026: cilindraje inválido no inventa tarifa", () => {
  assert.equal(legal.soatPorCilindraje(0), 0);
  assert.equal(legal.soatPorCilindraje(-5), 0);
});

test("RTM: primera a los 2 años de matrícula, luego anual", () => {
  assert.equal(legal.proximaRTM("2024-03-15", null, "2026-11-11"), "2027-03-15");
  assert.equal(legal.proximaRTM("2024-03-15", "2026-05-01", "2026-11-11"), "2027-05-01");
});

test("RTM: matrícula reciente todavía no vence", () => {
  assert.equal(legal.proximaRTM("2026-01-20", null, "2026-11-11"), "2028-01-20");
});

test("Impuesto: 250cc en Bogotá = 1,5% del avalúo", () => {
  const r = legal.impuestoEstimado(10_000_000, "bogota", 250);
  assert.equal(r.valor, 150_000);
  assert.equal(r.exento, false);
});

test("Impuesto: 125cc o menos exenta", () => {
  const r = legal.impuestoEstimado(10_000_000, "bogota", 125);
  assert.equal(r.valor, 0);
  assert.equal(r.exento, true);
});

/* -------------------------------- calc ---------------------------------- */
const calc = await load("calc");

/** Componente con la fecha de hoy: así solo pesa el kilometraje. */
function componente(extra = {}) {
  return {
    id: "c1", nombre: "Aceite", categoria: "motor", activo: true,
    ultimoKm: 0, ultimaFecha: HOY, intervaloKm: 5000, intervaloMeses: 6,
    costoEstimado: 80000, ...extra,
  };
}

test("Desgaste: a mitad de intervalo por km queda al día", () => {
  const d = calc.desgasteDe(componente(), 2500, HOY);
  assert.equal(Math.round(d.restantePct * 100), 50);
  assert.equal(d.estado, "ok");
});

test("Desgaste: umbrales 35% / 15% / 2%", () => {
  const estado = (km) => calc.desgasteDe(componente(), km, HOY).estado;
  assert.equal(estado(3500), "proximo");   // queda 30%
  assert.equal(estado(4500), "urgente");   // queda 10%
  assert.equal(estado(4950), "vencido");   // queda 1%
});

test("Desgaste: pasado el intervalo marca vencido con km excedidos", () => {
  const d = calc.desgasteDe(componente(), 5600, HOY);
  assert.equal(d.estado, "vencido");
  assert.ok(d.kmExcedidos >= 600, `kmExcedidos=${d.kmExcedidos}`);
  assert.equal(d.kmRestantes, 0);
});

test("Desgaste: el tiempo solo vence, sin mover el odómetro", () => {
  const d = calc.desgasteDe(componente({ ultimaFecha: "2026-01-01" }), 0, HOY);
  assert.equal(d.kmRestantes, 5000);
  assert.ok(d.diasRestantes < 0, `diasRestantes=${d.diasRestantes}`);
  assert.equal(d.estado, "vencido");
});

test("Salud del vehículo sin datos = 100", () => {
  assert.equal(calc.saludVehiculo({ vehiculo: null, componentes: [], documentos: [], mantenimientos: [], alertas: [] }), 100);
});

test("Salud: castiga el documento vencido (45% del score)", () => {
  const sinDocs = { vehiculo: null, componentes: [], documentos: [], mantenimientos: [], alertas: [] };
  const conVencido = {
    ...sinDocs,
    documentos: [{ id: "soat", nombre: "SOAT", fechaVencimiento: "2026-01-01" }],
  };
  assert.equal(calc.saludVehiculo(sinDocs), 100);
  assert.equal(calc.saludVehiculo(conVencido), 55);
});

test("Tanqueos: rendimiento entre dos tanqueos llenos", () => {
  const st = {
    vehiculo: { kmActual: 1500 }, componentes: [], documentos: [], alertas: [],
    mantenimientos: [
      { id: "1", fecha: "2026-10-01", km: 1000, costo: 120000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
      { id: "2", fecha: "2026-10-10", km: 1500, costo: 160000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
    ],
  };
  const t = calc.tanqueos(st);
  const ultimo = t[t.length - 1];
  assert.ok(ultimo.rendimientoKmL, "sin rendimiento");
  // 500 km / (10 gal * 3.78541) = 13.21 km/L
  assert.ok(Math.abs(ultimo.rendimientoKmL - 13.2) < 0.1, `kml=${ultimo.rendimientoKmL}`);
});

test("Tanqueos: sin dos llenos seguidos no inventa rendimiento", () => {
  const st = {
    vehiculo: { kmActual: 1000 }, componentes: [], documentos: [], alertas: [],
    mantenimientos: [
      { id: "1", fecha: "2026-10-01", km: 500, costo: 50000, categoria: "combustible",
        tanqueo: { galones: 5, precioGalon: 16000, tanqueLleno: false } },
      { id: "2", fecha: "2026-10-10", km: 1000, costo: 160000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
    ],
  };
  assert.equal(calc.tanqueos(st).at(-1).rendimientoKmL, undefined);
});

test("Avisos: documento vencido genera aviso crítico", () => {
  const st = {
    vehiculo: { kmActual: 1000 }, componentes: [], mantenimientos: [], alertas: [],
    documentos: [{ id: "soat", nombre: "SOAT", fechaVencimiento: "2026-01-01" }],
  };
  const a = calc.avisosDelDia(st, HOY).find((x) => x.id === "doc-soat");
  assert.ok(a, "no generó aviso");
  assert.equal(a.severidad, "critico");
});

test("Ritmo km/día con historial real", () => {
  const st = {
    vehiculo: { kmActual: 1000 }, componentes: [], documentos: [], alertas: [],
    mantenimientos: [{ id: "1", fecha: "2026-10-12", km: 0, costo: 0, categoria: "otro" }],
  };
  // 1000 km en 30 días
  const r = calc.ritmoKmDiario(st);
  assert.ok(r > 20 && r < 45, `ritmo=${r}`);
});

/* --------------------------- KPIs reales --------------------------- */

test("consumoReal ignora tanqueos sin tanqueLleno", () => {
  const st = {
    vehiculo: { kmActual: 2000 }, componentes: [], documentos: [], alertas: [],
    mantenimientos: [
      { id: "1", fecha: "2026-10-01", km: 1000, costo: 100000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
      { id: "2", fecha: "2026-10-10", km: 1500, costo: 80000, categoria: "combustible",
        tanqueo: { galones: 8, precioGalon: 16000, tanqueLleno: false } },
      { id: "3", fecha: "2026-10-20", km: 2000, costo: 100000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
    ],
  };
  const r = calc.consumoReal(st);
  // Solo hay un tramo válido: 1000→2000 (1000 km / 10 gal × 3.785 = 26.42 km/L)
  assert.equal(r.muestras, 1, `muestras=${r.muestras}`);
  assert.ok(r.kmL !== null, "kmL no debe ser null");
  assert.ok(Math.abs(r.kmL - 26.42) < 0.1, `kmL=${r.kmL}`);
});

test("consumoReal descarta km no creciente", () => {
  const st = {
    vehiculo: { kmActual: 2000 }, componentes: [], documentos: [], alertas: [],
    mantenimientos: [
      { id: "1", fecha: "2026-10-01", km: 1000, costo: 100000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
      { id: "2", fecha: "2026-10-10", km: 900, costo: 100000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
      { id: "3", fecha: "2026-10-20", km: 2000, costo: 100000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
    ],
  };
  const r = calc.consumoReal(st);
  // El tramo 1000→900 se descarta; solo 1000→2000 es válido (1 tramo)
  assert.equal(r.muestras, 1, `muestras=${r.muestras}`);
  assert.ok(r.kmL !== null, "kmL no debe ser null");
});

test("consumoReal: kmGal = kmL × 3,785", () => {
  const st = {
    vehiculo: { kmActual: 2000 }, componentes: [], documentos: [], alertas: [],
    mantenimientos: [
      { id: "1", fecha: "2026-10-01", km: 1000, costo: 100000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
      { id: "2", fecha: "2026-10-20", km: 2000, costo: 100000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
    ],
  };
  const r = calc.consumoReal(st);
  assert.ok(r.kmL !== null && r.kmGal !== null, "ambos deben tener valor");
  // kmGal debe ser kmL × 3.785
  assert.ok(Math.abs(r.kmGal - r.kmL * 3.785) < 0.1, `kmGal=${r.kmGal} vs kmL*3.785=${r.kmL * 3.785}`);
});

test("alertaConsumo no se activa con datos insuficientes", () => {
  const st = {
    vehiculo: { kmActual: 1500 }, componentes: [], documentos: [], alertas: [],
    mantenimientos: [
      { id: "1", fecha: "2026-10-01", km: 1000, costo: 100000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
      { id: "2", fecha: "2026-10-20", km: 1500, costo: 100000, categoria: "combustible",
        tanqueo: { galones: 10, precioGalon: 16000, tanqueLleno: true } },
    ],
  };
  const r = calc.alertaConsumo(st);
  // Con solo 1 tramo válido, no hay suficientes datos para comparar
  assert.equal(r.activa, false, "no debe activarse con 1 tramo");
  assert.equal(r.caidaPct, 0);
});

test("proyeccionServicio devuelve null con ritmo 0", () => {
  const comp = {
    id: "c1", nombre: "Aceite", categoria: "motor", activo: true,
    ultimoKm: 0, ultimaFecha: HOY, intervaloKm: 5000, intervaloMeses: 6,
    costoEstimado: 80000,
  };
  const d = calc.desgasteDe(comp, 1000, HOY);
  const r = calc.proyeccionServicio(d, 0, HOY);
  assert.equal(r.fecha, null, "fecha debe ser null con ritmo 0");
  assert.equal(r.motivo, "sin-datos");
});

test("indiceSalud entre 0 y 100 con estado vacío", () => {
  const st = {
    vehiculo: null, componentes: [], documentos: [], mantenimientos: [],
    alertas: [], tareas: [],
  };
  const r = calc.indiceSalud(st);
  assert.ok(r.score >= 0 && r.score <= 100, `score=${r.score}`);
  // Con todo vacío, cada parte debe ser 100
  assert.equal(r.partes.plan, 100);
  assert.equal(r.partes.legal, 100);
  assert.equal(r.partes.tareas, 100);
  assert.equal(r.score, 100);
});

/* ------------------------------ pico y placa ----------------------------- */
const pico = await load("picoPlaca");

test("Pico y placa: exporta funciones usables", () => {
  const fns = Object.keys(pico).filter((k) => typeof pico[k] === "function");
  assert.ok(fns.length >= 1, "picoPlaca no exporta funciones");
});

/* ------------------------------- auditoría ------------------------------- */
let auditoria = null;
try {
  auditoria = await load("auditoria");
} catch {
  /* el módulo todavía no existe: los chequeos de abajo fallan a propósito */
}

function estadoBase(extra = {}) {
  return {
    version: 1,
    vehiculo: { id: "v1", placa: "ABC12D", apodo: "XTZ", marca: "Yamaha", linea: "XTZ 250",
      modelo: 2021, color: "azul", cilindraje: 249, kmActual: 10000, fechaMatricula: "2024-03-15",
      ciudad: "bogota", archivado: false, creado: "2026-01-01" },
    documentos: [], componentes: [], mantenimientos: [], alertas: [],
    talleres: [], ordenes: [], puntos: [], tareas: [],
    ajustes: { nombre: "", tema: "auto", ciudad: "bogota", tipoVehiculo: "moto", moneda: "COP",
      mostrarPuntos: true, picoPlacaDigitos: {}, picoPlacaActivo: true },
    onboardingCompleto: true,
    ...extra,
  };
}

test("Auditoría: estado limpio no inventa hallazgos", () => {
  assert.ok(auditoria?.auditoria, "falta exportar auditoria() en src/lib/auditoria.ts");
  assert.deepEqual(auditoria.auditoria(estadoBase(), HOY), []);
});

test("Auditoría: detecta mantenimiento con km por encima del odómetro", () => {
  const st = estadoBase({
    mantenimientos: [{ id: "m1", vehiculoId: "v1", fecha: "2026-10-01", km: 12000,
      categoria: "aceite", titulo: "Cambio de aceite", tipo: "preventivo", costo: 80000 }],
  });
  const h = auditoria.auditoria(st, HOY);
  assert.ok(h.some((x) => x.codigo === "km-retroceso" && x.severidad === "alta"), JSON.stringify(h));
});

test("Auditoría: detecta fechas futuras", () => {
  const st = estadoBase({
    mantenimientos: [{ id: "m1", vehiculoId: "v1", fecha: "2027-01-15", km: 9000,
      categoria: "aceite", titulo: "Cambio de aceite", tipo: "preventivo", costo: 80000 }],
  });
  const h = auditoria.auditoria(st, HOY);
  assert.ok(h.some((x) => x.codigo === "fecha-futura"), JSON.stringify(h));
});

test("Auditoría: documento sin fecha de vencimiento", () => {
  const st = estadoBase({ documentos: [{ id: "d1", vehiculoId: "v1", tipo: "soat", nombre: "SOAT" }] });
  const h = auditoria.auditoria(st, HOY);
  assert.ok(h.some((x) => x.codigo === "doc-sin-fecha"), JSON.stringify(h));
});

test("Auditoría: componente sin intervalo no puede calcular desgaste", () => {
  const st = estadoBase({
    componentes: [{ id: "c1", vehiculoId: "v1", nombre: "Bujía", categoria: "bujia",
      intervaloKm: 0, intervaloMeses: 0, vidaUtilKm: 0, costoEstimado: 0, ultimoKm: 0,
      ultimaFecha: HOY, activo: true }],
  });
  const h = auditoria.auditoria(st, HOY);
  assert.ok(h.some((x) => x.codigo === "componente-sin-intervalo" && x.severidad === "alta"), JSON.stringify(h));
});

test("Auditoría: tanqueo sin galones", () => {
  const st = estadoBase({
    mantenimientos: [{ id: "m1", vehiculoId: "v1", fecha: "2026-10-01", km: 9500,
      categoria: "combustible", titulo: "Tanqueo", tipo: "preventivo", costo: 50000,
      tanqueo: { galones: 0, precioGalon: 16000, odometro: 9500, tanqueLleno: true } }],
  });
  const h = auditoria.auditoria(st, HOY);
  assert.ok(h.some((x) => x.codigo === "tanqueo-incompleto"), JSON.stringify(h));
});

test("Auditoría: odómetro no monotónico entre mantenimientos", () => {
  const st = estadoBase({
    mantenimientos: [
      { id: "m1", vehiculoId: "v1", fecha: "2026-09-01", km: 9000, categoria: "aceite",
        titulo: "Aceite", tipo: "preventivo", costo: 80000 },
      { id: "m2", vehiculoId: "v1", fecha: "2026-10-01", km: 8500, categoria: "frenos",
        titulo: "Pastillas", tipo: "correctivo", costo: 40000 },
    ],
  });
  const h = auditoria.auditoria(st, HOY);
  assert.ok(h.some((x) => x.codigo === "odo-no-monotonico"), JSON.stringify(h));
});

test("Auditoría: sin vehículo o sin datos no lanza ni inventa hallazgos", () => {
  assert.ok(auditoria?.auditoria, "falta exportar auditoria() en src/lib/auditoria.ts");
  // Sin vehículo cargado la regla es no evaluar nada.
  assert.deepEqual(auditoria.auditoria(estadoBase({ vehiculo: null }), HOY), []);
  // Con vehículo pero colecciones vacías tampoco hay nada que reportar.
  assert.deepEqual(
    auditoria.auditoria(estadoBase({ kmActual: 0, documentos: [], componentes: [], mantenimientos: [] }), HOY),
    [],
  );
  // Y con el odómetro en cero un mantenimiento en cero no es un retroceso.
  const base = estadoBase();
  const st = estadoBase({
    vehiculo: { ...base.vehiculo, kmActual: 0 },
    mantenimientos: [{ id: "m1", vehiculoId: "v1", fecha: "2026-10-01", km: 0,
      categoria: "aceite", titulo: "Aceite", tipo: "preventivo", costo: 0 }],
  });
  assert.deepEqual(auditoria.auditoria(st, HOY), []);
});

test("Auditoría: acumula varios hallazgos y solo usa severidades válidas", () => {
  const st = estadoBase({
    mantenimientos: [
      { id: "m1", vehiculoId: "v1", fecha: "2026-10-01", km: 12000, categoria: "combustible",
        titulo: "Tanqueo", tipo: "preventivo", costo: 50000,
        tanqueo: { galones: 0, precioGalon: 16000, odometro: 12000, tanqueLleno: true } },
    ],
    documentos: [{ id: "d1", vehiculoId: "v1", tipo: "soat", nombre: "SOAT" }],
    componentes: [{ id: "c1", vehiculoId: "v1", nombre: "Bujía", categoria: "bujia",
      intervaloKm: 0, intervaloMeses: 0, vidaUtilKm: 0, costoEstimado: 0, ultimoKm: 0,
      ultimaFecha: HOY, activo: true }],
  });
  const h = auditoria.auditoria(st, HOY);
  const codigos = new Set(h.map((x) => x.codigo));
  for (const esperado of ["km-retroceso", "tanqueo-incompleto", "doc-sin-fecha", "componente-sin-intervalo"]) {
    assert.ok(codigos.has(esperado), `falta ${esperado} en ${JSON.stringify([...codigos])}`);
  }
  // Cada hallazgo debe poder pintarse en pantalla: severidad conocida y mensaje con texto.
  const validas = ["alta", "media", "baja"];
  for (const x of h) {
    assert.ok(validas.includes(x.severidad), `severidad inválida: ${x.severidad}`);
    assert.ok(typeof x.mensaje === "string" && x.mensaje.trim().length > 0, `mensaje vacío en ${x.codigo}`);
  }
  // El agrupado por severidad que usa la tarjeta cubre el total, sin sobrantes ni duplicados.
  const agrupados = validas.reduce((n, sev) => n + h.filter((x) => x.severidad === sev).length, 0);
  assert.equal(agrupados, h.length);
});

/* -------------------------- catálogo de piezas -------------------------- */
const partesOut = mkdtempSync(join(tmpdir(), "motoapp-partes-"));

async function loadPartes() {
  const file = join(partesOut, "partes.mjs");
  execFileSync(
    esbuild,
    [
      join(root, "src/data/partes.ts"),
      "--bundle",
      "--format=esm",
      "--platform=node",
      `--outfile=${file}`,
      "--log-level=error",
    ],
    { stdio: "inherit" },
  );
  return import(pathToFileURL(file).href);
}

const partes = await loadPartes();

test("Piezas: toda pieza tiene al menos 1 placement", () => {
  for (const p of partes.CATALOGO_PIEZAS) {
    assert.ok(
      p.placements.length >= 1,
      `${p.partId} no tiene placements`,
    );
  }
});

test("Piezas: matchIds y matchKeywords no vacíos", () => {
  for (const p of partes.CATALOGO_PIEZAS) {
    assert.ok(
      p.matchIds.length >= 1,
      `${p.partId} tiene matchIds vacío`,
    );
    assert.ok(
      p.matchKeywords.length >= 1,
      `${p.partId} tiene matchKeywords vacío`,
    );
  }
});

test("Piezas: piezasDeAngulo('left') devuelve más de 8", () => {
  const left = partes.piezasDeAngulo("left");
  assert.ok(
    left.length > 8,
    `piezasDeAngulo('left')=${left.length} (esperado > 8)`,
  );
});

test("Piezas: buscarPiezaDeComponente('Cambio de aceite','aceite') devuelve aceite-motor", () => {
  const r = partes.buscarPiezaDeComponente("Cambio de aceite", "aceite");
  assert.equal(
    r?.partId,
    "aceite-motor",
    `devolvió ${r?.partId ?? null}`,
  );
});

test("Piezas: buscarPiezaDeComponente('Cadena','cadena') devuelve la pieza de cadena", () => {
  const r = partes.buscarPiezaDeComponente("Cadena", "cadena");
  assert.equal(
    r?.partId,
    "cadena",
    `devolvió ${r?.partId ?? null}`,
  );
});

/* ------------------------------- runner --------------------------------- */
let ok = 0;
let fail = 0;
for (const p of pruebas) {
  try {
    p.fn();
    ok++;
    console.log(`  ok   ${p.nombre}`);
  } catch (e) {
    fail++;
    console.log(`  FAIL ${p.nombre}\n       ${String(e.message).split("\n")[0]}`);
  }
}
rmSync(out, { recursive: true, force: true });
rmSync(partesOut, { recursive: true, force: true });
console.log(`\n${ok} ok, ${fail} fallidos, ${pruebas.length} chequeos`);
process.exit(fail ? 1 : 0);
