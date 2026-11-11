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

/* ------------------------------ pico y placa ----------------------------- */
const pico = await load("picoPlaca");

test("Pico y placa: exporta funciones usables", () => {
  const fns = Object.keys(pico).filter((k) => typeof pico[k] === "function");
  assert.ok(fns.length >= 1, "picoPlaca no exporta funciones");
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
console.log(`\n${ok} ok, ${fail} fallidos, ${pruebas.length} chequeos`);
process.exit(fail ? 1 : 0);
