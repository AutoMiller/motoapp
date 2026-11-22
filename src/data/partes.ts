/**
 * Catálogo de piezas de la moto con metadatos de inspección y emparejamiento al plan.
 *
 * Cada pieza describe dónde aparece en la silueta (placements), cómo se empareja
 * con los componentes del plan de mantenimiento (matchIds / matchKeywords) y el
 * consejo de inspección que la UI muestra al tocar la pieza.
 */

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

export type BikeAngle = "left" | "front" | "right" | "rear";

export type HealthLevel = "ok" | "warning" | "critical" | "unknown";

export type TooltipMode = "auto" | "all" | "clean";

export type ZonaPieza = "motor" | "transmision" | "frenos" | "admision" | "suspension" | "controles";

export interface PartPlacement {
  angle: BikeAngle;
  anchorX: number;
  anchorY: number;
  tipX: number;
  tipY: number;
  align: "left" | "right" | "center" | "top" | "bottom";
}

export interface BikePartSpec {
  /** Identificador único de la pieza. */
  partId: string;
  /** Nombre completo de la pieza. */
  label: string;
  /** Etiqueta corta para espacios reducidos. */
  shortLabel: string;
  /** Zona mecánica a la que pertenece. */
  zone: ZonaPieza;
  /** IDs de componente del plan que coinciden exactamente. */
  matchIds: string[];
  /** Palabras clave para búsqueda difusa. */
  matchKeywords: string[];
  /** Ruta a la foto de referencia (vacío = sin imagen). */
  photoPath: string;
  /** Consejo de inspección mostrado en el tooltip. */
  inspectionTip: string;
  /** Badge con el valor o referencia de especificación. */
  specBadge: string;
  /** Posiciones en la silueta para cada ángulo. */
  placements: PartPlacement[];
}

/* ------------------------------------------------------------------ */
/*  Ángulos de la silueta                                              */
/* ------------------------------------------------------------------ */

export const ANGULOS: Record<
  BikeAngle,
  { label: string; short: string; subtitle: string; photoPath: string }
> = {
  left: {
    label: "Lateral izquierdo",
    short: "IZQ",
    subtitle: "IZQ · 0°",
    photoPath: "moto-perfil.webp",
  },
  front: {
    label: "Frontal y cabina",
    short: "FRO",
    subtitle: "FRO · 90°",
    photoPath: "",
  },
  right: {
    label: "Lateral derecho",
    short: "DER",
    subtitle: "DER · 180°",
    photoPath: "",
  },
  rear: {
    label: "Trasera y bajo asiento",
    short: "TRA",
    subtitle: "TRA · 270°",
    photoPath: "",
  },
};

/* ------------------------------------------------------------------ */
/*  Catálogo de piezas (15)                                            */
/* ------------------------------------------------------------------ */

export const CATALOGO_PIEZAS: BikePartSpec[] = [
  {
    partId: "cadena",
    label: "Lubricación de Cadena",
    shortLabel: "Cadena",
    zone: "transmision",
    matchIds: ["lubricacion-cadena", "cadena"],
    matchKeywords: ["cadena", "lubric", "tension cadena"],
    photoPath: "",
    inspectionTip:
      "Holgura recomendada 30–40 mm en el punto medio. Limpiar y lubricar cada 500 km o tras lluvia/barro.",
    specBadge: "30–40 mm",
    placements: [
      { angle: "left", anchorX: 255, anchorY: 332, tipX: 118, tipY: 416, align: "left" },
    ],
  },
  {
    partId: "kit-arrastre",
    label: "Kit de Arrastre",
    shortLabel: "Arrastre",
    zone: "transmision",
    matchIds: ["kit-arrastre", "arrastre"],
    matchKeywords: ["arrastre", "piñon", "pinon", "catalina", "corona"],
    photoPath: "",
    inspectionTip:
      "Revisar dientes afilados tipo aleta de tiburón y desgaste uniforme en corona trasera.",
    specBadge: "22.000 km",
    placements: [
      { angle: "left", anchorX: 182, anchorY: 325, tipX: 66, tipY: 230, align: "left" },
      { angle: "rear", anchorX: 332, anchorY: 332, tipX: 145, tipY: 372, align: "left" },
    ],
  },
  {
    partId: "aceite-motor",
    label: "Aceite de Motor",
    shortLabel: "Aceite",
    zone: "motor",
    matchIds: ["aceite-motor", "aceite", "cambio-aceite"],
    matchKeywords: ["aceite motor", "aceite", "lubricante motor"],
    photoPath: "",
    inspectionTip:
      "Verificar nivel en plano y frío/tibio. Capacidad estándar ~1,35 L sin filtro / 1,45 L con filtro.",
    specBadge: "10W-40",
    placements: [
      { angle: "right", anchorX: 405, anchorY: 312, tipX: 590, tipY: 415, align: "right" },
      { angle: "left", anchorX: 398, anchorY: 314, tipX: 430, tipY: 425, align: "right" },
    ],
  },
  {
    partId: "filtro-aceite",
    label: "Filtro de Aceite",
    shortLabel: "F. Aceite",
    zone: "motor",
    matchIds: ["filtro-aceite"],
    matchKeywords: ["filtro aceite", "filtro de aceite"],
    photoPath: "",
    inspectionTip:
      "Reemplazar O-rings si están planos. Apretar tapa en cruz sin exceder torque.",
    specBadge: "Cartucho",
    placements: [
      { angle: "right", anchorX: 446, anchorY: 306, tipX: 645, tipY: 325, align: "right" },
    ],
  },
  {
    partId: "bujia",
    label: "Bujía",
    shortLabel: "Bujía",
    zone: "motor",
    matchIds: ["bujia"],
    matchKeywords: ["bujia", "bujía", "encendido"],
    photoPath: "",
    inspectionTip:
      "Revisar color café claro del electrodo y calibración de luz 0,6–0,7 mm.",
    specBadge: "0,6–0,7 mm",
    placements: [
      { angle: "right", anchorX: 426, anchorY: 254, tipX: 625, tipY: 200, align: "right" },
    ],
  },
  {
    partId: "valvulas",
    label: "Calibración de Válvulas",
    shortLabel: "Válvulas",
    zone: "motor",
    matchIds: ["valvulas", "calibracion-valvulas"],
    matchKeywords: ["valvula", "válvula", "balancin"],
    photoPath: "",
    inspectionTip:
      "Medir siempre con motor totalmente frío en PMS de compresión.",
    specBadge: "En frío",
    placements: [
      { angle: "right", anchorX: 410, anchorY: 226, tipX: 550, tipY: 112, align: "right" },
      { angle: "left", anchorX: 416, anchorY: 230, tipX: 485, tipY: 94, align: "right" },
    ],
  },
  {
    partId: "filtro-aire",
    label: "Filtro de Aire",
    shortLabel: "F. Aire",
    zone: "admision",
    matchIds: ["filtro-aire"],
    matchKeywords: ["filtro aire", "filtro de aire", "admision"],
    photoPath: "",
    inspectionTip:
      "Inspeccionar más seguido tras rutas con polvo o barro. No soplar con alta presión hacia adentro.",
    specBadge: "Caja filtro",
    placements: [
      { angle: "left", anchorX: 356, anchorY: 230, tipX: 225, tipY: 102, align: "left" },
    ],
  },
  {
    partId: "bateria",
    label: "Batería y Eléctrico",
    shortLabel: "Batería",
    zone: "admision",
    matchIds: ["bateria"],
    matchKeywords: ["bateria", "batería", "litio", "fusible"],
    photoPath: "",
    inspectionTip:
      "Revisar bornes firmes, voltaje en reposo y fusibles de repuesto en el compartimento.",
    specBadge: "12,8–13,4 V",
    placements: [
      { angle: "rear", anchorX: 400, anchorY: 205, tipX: 610, tipY: 138, align: "right" },
      { angle: "right", anchorX: 334, anchorY: 224, tipX: 165, tipY: 118, align: "left" },
    ],
  },
  {
    partId: "pastillas-delanteras",
    label: "Pastillas Delanteras",
    shortLabel: "Freno Del.",
    zone: "frenos",
    matchIds: ["pastillas-delanteras", "freno-delantero"],
    matchKeywords: ["pastillas delanteras", "freno delantero", "disco delantero"],
    photoPath: "",
    inspectionTip:
      "Cambiar si el material de fricción baja de 2 mm o llega a la ranura testigo.",
    specBadge: "> 2 mm",
    placements: [
      { angle: "left", anchorX: 634, anchorY: 326, tipX: 682, tipY: 416, align: "right" },
      { angle: "front", anchorX: 432, anchorY: 342, tipX: 615, tipY: 382, align: "right" },
    ],
  },
  {
    partId: "pastillas-traseras",
    label: "Pastillas Traseras",
    shortLabel: "Freno Tra.",
    zone: "frenos",
    matchIds: ["pastillas-traseras", "freno-trasero"],
    matchKeywords: ["pastillas traseras", "freno trasero", "banda"],
    photoPath: "",
    inspectionTip:
      "Revisar desgaste parejo en ambas caras y estado del disco trasero.",
    specBadge: "> 2 mm",
    placements: [
      { angle: "right", anchorX: 186, anchorY: 326, tipX: 105, tipY: 412, align: "left" },
      { angle: "rear", anchorX: 468, anchorY: 332, tipX: 635, tipY: 372, align: "right" },
    ],
  },
  {
    partId: "liquido-frenos",
    label: "Líquido de Frenos",
    shortLabel: "Líq. Frenos",
    zone: "frenos",
    matchIds: ["liquido-frenos"],
    matchKeywords: ["liquido freno", "líquido freno", "dot 4", "dot4"],
    photoPath: "",
    inspectionTip:
      "Revisar color en mirilla; si está oscuro o cumple 12–24 meses, purgar completo con DOT 4.",
    specBadge: "DOT 4",
    placements: [
      { angle: "front", anchorX: 315, anchorY: 122, tipX: 155, tipY: 96, align: "left" },
    ],
  },
  {
    partId: "suspension-delantera",
    label: "Horquilla y Retenes",
    shortLabel: "Horquilla",
    zone: "suspension",
    matchIds: ["suspension-delantera", "horquilla", "retenes"],
    matchKeywords: ["horquilla", "reten", "barras", "suspension delantera"],
    photoPath: "",
    inspectionTip:
      "Limpiar guardapolvos tras trocha y verificar ausencia de película húmeda de aceite en barras.",
    specBadge: "Retenes/Aceite",
    placements: [
      { angle: "front", anchorX: 368, anchorY: 255, tipX: 165, tipY: 245, align: "left" },
      { angle: "left", anchorX: 564, anchorY: 240, tipX: 682, tipY: 195, align: "right" },
    ],
  },
  {
    partId: "suspension-trasera",
    label: "Monoshock y Bujes Tijera",
    shortLabel: "Monoshock",
    zone: "suspension",
    matchIds: ["monoshock", "suspension-trasera", "bujes-tijera"],
    matchKeywords: ["monoshock", "amortiguador", "tijera", "bieleta", "suspension trasera"],
    photoPath: "",
    inspectionTip:
      "Engrasar bieletas y verificar juego lateral de tijera levantando la rueda trasera.",
    specBadge: "Bieletas/Grasa",
    placements: [
      { angle: "rear", anchorX: 400, anchorY: 268, tipX: 165, tipY: 238, align: "left" },
      { angle: "left", anchorX: 318, anchorY: 278, tipX: 130, tipY: 155, align: "left" },
    ],
  },
  {
    partId: "llantas",
    label: "Llantas y Presión",
    shortLabel: "Llantas",
    zone: "suspension",
    matchIds: ["llantas", "llanta-delantera", "llanta-trasera"],
    matchKeywords: ["llanta", "neumatico", "neumático", "presion"],
    photoPath: "",
    inspectionTip:
      "Medir presión en frío antes de salir a ruta y revisar profundidad de labrado y grietas.",
    specBadge: "PSI en frío",
    placements: [
      { angle: "front", anchorX: 400, anchorY: 392, tipX: 175, tipY: 416, align: "left" },
      { angle: "rear", anchorX: 400, anchorY: 390, tipX: 610, tipY: 424, align: "right" },
    ],
  },
  {
    partId: "luces-controles",
    label: "Luces, Guayas y Dirección",
    shortLabel: "Cabina",
    zone: "controles",
    matchIds: ["luces", "guayas", "direccion"],
    matchKeywords: ["luz", "luces", "farola", "guaya", "clutch", "espejo", "direccion"],
    photoPath: "",
    inspectionTip:
      "Verificar juego libre de clutch (10–15 mm), retorno suave del acelerador y altas/bajas.",
    specBadge: "10–15 mm juego",
    placements: [
      { angle: "front", anchorX: 400, anchorY: 168, tipX: 625, tipY: 136, align: "right" },
      { angle: "left", anchorX: 545, anchorY: 150, tipX: 668, tipY: 96, align: "right" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers puros                                                      */
/* ------------------------------------------------------------------ */

/**
 * Devuelve las piezas que tienen al menos un placement en el ángulo indicado.
 */
export function piezasDeAngulo(angle: BikeAngle): BikePartSpec[] {
  return CATALOGO_PIEZAS.filter((p) => p.placements.some((pl) => pl.angle === angle));
}

/**
 * Busca una pieza del catálogo a partir del nombre de un componente del plan
 * y/o su categoría.
 *
 * Algoritmo:
 *  1. Normaliza el nombre y la categoría (minúsculas, sin tildes).
 *  2. Compara primero con matchIds (coincidencia exacta).
 *  3. Si no hay match, busca en matchKeywords (incluido).
 */
export function buscarPiezaDeComponente(nombre: string, categoria: string): BikePartSpec | null {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const n = norm(nombre);
  const c = norm(categoria);

  // Paso 1: matchIds exactos
  for (const pieza of CATALOGO_PIEZAS) {
    for (const mid of pieza.matchIds) {
      if (norm(mid) === n || norm(mid) === c) return pieza;
    }
  }

  // Paso 2: matchKeywords incluidos
  for (const pieza of CATALOGO_PIEZAS) {
    for (const kw of pieza.matchKeywords) {
      if (n.includes(norm(kw)) || c.includes(norm(kw))) return pieza;
    }
  }

  return null;
}

/**
 * Empareja cada componente del plan con su pieza del catálogo.
 * Devuelve un array con { componentId, nombre, pieza } sin romper si no hay match.
 */
export interface PiezaDelPlan {
  componentId: string;
  nombre: string;
  pieza: BikePartSpec | null;
}

export function piezasDelPlan(
  state: { componentes: Array<{ id: string; nombre: string; categoria: string }> },
): PiezaDelPlan[] {
  return state.componentes.map((comp) => ({
    componentId: comp.id,
    nombre: comp.nombre,
    pieza: buscarPiezaDeComponente(comp.nombre, comp.categoria),
  }));
}
