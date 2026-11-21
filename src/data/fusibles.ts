/**
 * Mapa de fusibles — Yamaha XTZ 250 (Lander), mercado colombiano.
 *
 * Fuente primaria: Manual del propietario XTZ250 ABS, código B9L-F8199-S0
 * (Yamaha Motor Co. Ltd., 1ª ed., nov. 2019 — el que se entrega en Colombia).
 *   · "Cambio de los fusibles" → pág. 6-35 y 6-36
 *   · Fusible principal detrás del panel B → pág. 6-12
 *   · Caja de fusibles debajo del asiento → pág. 3-17
 * Fuente secundaria (variante carburada): Manual de taller LANDER XTZ250
 * 20C-F8197-S0 (2007), especificaciones eléctricas 2-15.
 *
 * REGLA DE ORO: nunca poner un fusible de mayor amperaje que el especificado
 * (el manual lo advierte: daños graves al sistema eléctrico e incendio).
 */

export type VarianteFusibles = "abs" | "carburada";

export interface Fusible {
  /** 1..n dentro de la caja; null cuando el manual no numera la posición. */
  puesto: number | null;
  nombre: string;
  /** null = el manual no lo declara explícitamente; se lee en el fusible/tapa. */
  amperaje: number | null;
  protege: string[];
  /** Qué se nota cuando está fundido. */
  sintomas: string[];
  nota?: string;
}

export interface CajaFusibles {
  variante: VarianteFusibles;
  etiqueta: string;
  modelo: string;
  ubicacionCaja: string;
  principal: { amperaje: number; ubicacion: string; nota: string };
  caja: Fusible[];
  /** Filas tal como aparecen dibujadas en el manual: [arriba[], abajo[]]. */
  dibujo: number[][];
  fuente: string;
  fuentePaginas: string;
}

export const CAJAS: Record<VarianteFusibles, CajaFusibles> = {
  abs: {
    variante: "abs",
    etiqueta: "XTZ 250 ABS (2019 en adelante)",
    modelo: "B9L-F8199-S0",
    ubicacionCaja: "Debajo del asiento (pág. 3-17 del manual).",
    principal: {
      amperaje: 15,
      ubicacion: "Detrás del panel B (pág. 6-12).",
      nota: "Es el que corta todo el sistema: si está fundido, la moto queda muerta aunque la batería esté buena.",
    },
    caja: [
      {
        puesto: 1,
        nombre: "Solenoide del ABS",
        amperaje: null,
        protege: ["Válvulas del módulo ABS"],
        sintomas: [
          "La luz de ABS queda encendida o el ABS no actúa",
          "Frenadas bruscas con bloqueo de rueda",
        ],
        nota: "El manual numera el fusible pero no publica su amperaje en la tabla: léelo en el propio fusible o en la lámina de la tapa antes de reemplazarlo.",
      },
      {
        puesto: 2,
        nombre: "Bomba del ABS",
        amperaje: 10,
        protege: ["Motor/bomba hidráulica del ABS"],
        sintomas: [
          "Testigo de ABS encendido de forma fija",
          "El ABS no modula: la rueda se bloquea",
        ],
      },
      {
        puesto: 3,
        nombre: "Fusible secundario",
        amperaje: 7.5,
        protege: ["Circuito de respaldo (memoria del tablero/reloj)"],
        sintomas: [
          "El cuentakilómetros o el reloj se reinician al apagar",
          "Se pierde la hora y el parcial",
        ],
        nota: "En algunos manuales aparece como «fusible de respaldo» o «backup».",
      },
      {
        puesto: 4,
        nombre: "Repuesto",
        amperaje: null,
        protege: [],
        sintomas: [],
        nota: "No alimenta nada: es el de reserva. Úsalo para reemplazar el que se funda y repón el repuesto.",
      },
      {
        puesto: 5,
        nombre: "Repuesto",
        amperaje: null,
        protege: [],
        sintomas: [],
        nota: "Segundo repuesto. El manual recomienda llevar ambos puestos.",
      },
    ],
    dibujo: [
      [4, 5],
      [3, 2, 1],
    ],
    fuente: "Manual del propietario XTZ250 ABS (B9L-F8199-S0)",
    fuentePaginas: "págs. 6-35 y 6-36",
  },

  carburada: {
    variante: "carburada",
    etiqueta: "XTZ 250 carburada (Lander anterior a ABS)",
    modelo: "20C-F8197-S0",
    ubicacionCaja: "Debajo del asiento; el manual de taller no numera las posiciones.",
    principal: {
      amperaje: 20,
      ubicacion: "Cerca de la batería, detrás del panel lateral.",
      nota: "En la variante carburada el principal es de 20 A, no de 15 A: no los intercambies.",
    },
    caja: [
      {
        puesto: null,
        nombre: "Sistema de señalización",
        amperaje: 10,
        protege: ["Pito, direccionales, luz de freno, tablero"],
        sintomas: ["No suena el pito", "No funcionan los direccionales", "No enciende la luz de freno"],
      },
      {
        puesto: null,
        nombre: "Faro",
        amperaje: 10,
        protege: ["Luz delantera y auxiliar"],
        sintomas: ["No enciende la luz delantera", "Solo funciona la luz alta o la baja"],
      },
      {
        puesto: null,
        nombre: "Encendido",
        amperaje: 10,
        protege: ["Circuito de encendido / CDI"],
        sintomas: ["No arranca", "Se apaga en marcha"],
      },
      {
        puesto: null,
        nombre: "Respaldo (cuentakilómetros y reloj)",
        amperaje: 10,
        protege: ["Memoria del tablero"],
        sintomas: ["Se borra el parcial y la hora al apagar"],
      },
      {
        puesto: null,
        nombre: "Reserva",
        amperaje: 10,
        protege: [],
        sintomas: [],
      },
      {
        puesto: null,
        nombre: "Reserva",
        amperaje: 20,
        protege: [],
        sintomas: [],
        nota: "Reserva del principal, no de los circuitos.",
      },
    ],
    dibujo: [[], []],
    fuente: "Manual de taller LANDER XTZ250 (20C-F8197-S0), 2007",
    fuentePaginas: "especificaciones eléctricas, pág. 2-15",
  },
};

export function cajaDe(v: VarianteFusibles = "abs"): CajaFusibles {
  return CAJAS[v];
}

/** Amperajes que el manual sí declara (para el resumen y para validar). */
export function amperajesDeclarados(c: CajaFusibles): number[] {
  const set = new Set<number>([c.principal.amperaje]);
  for (const f of c.caja) if (f.amperaje != null) set.add(f.amperaje);
  return [...set].sort((a, b) => a - b);
}
