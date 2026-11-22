import type { AppState, Componente } from "../types";
import { desgastes, type Desgaste } from "./calc";

/**
 * Zonas del perfil de la moto.
 *
 * Las coordenadas son porcentajes sobre la ilustración `public/moto-perfil.webp`
 * (perfil izquierdo del manual B9L-F8199-S0, pág. 2-1), recortado a la moto.
 */
export type ZonaId =
  | "motor"
  | "transmision"
  | "tren-delantero"
  | "tren-trasero"
  | "admision-asiento"
  | "controles-direccion";

export type EstadoZona = "ok" | "warning" | "critical";

export interface Zona {
  id: ZonaId;
  nombre: string;
  x: number; // %
  y: number; // %
  descripcion: string;
  /** Palabras que emparejan un componente del plan con esta zona. */
  claves: string[];
}

export const ZONAS: Zona[] = [
  {
    id: "motor",
    nombre: "Motor y lubricación",
    x: 42,
    y: 63,
    descripcion: "Aceite, filtro, bujía, válvulas y refrigeración.",
    claves: ["aceite", "motor", "bujia", "bujía", "valvula", "válvula", "refriger", "inyec", "carbur"],
  },
  {
    id: "transmision",
    nombre: "Transmisión",
    x: 62,
    y: 71,
    descripcion: "Cadena, piñón, catalina y kit de arrastre.",
    claves: ["cadena", "arrastre", "piñon", "piñón", "catalina", "sprocket"],
  },
  {
    id: "tren-delantero",
    nombre: "Tren delantero",
    x: 12,
    y: 70,
    descripcion: "Llanta, disco, pastillas, líquido y horquilla.",
    claves: ["delanter", "horquilla", "llanta del", "disco del", "pastilla del", "freno del", "abs del"],
  },
  {
    id: "tren-trasero",
    nombre: "Tren trasero",
    x: 77,
    y: 77,
    descripcion: "Llanta, pastillas traseras, amortiguador y bieletas.",
    claves: ["traser", "llanta tras", "amortiguador", "pro-link", "prolink", "bieleta", "buje"],
  },
  {
    id: "admision-asiento",
    nombre: "Admisión y asiento",
    x: 55,
    y: 37,
    descripcion: "Filtro de aire, batería, fusibles y herramientas.",
    claves: ["filtro de aire", "aire", "bateria", "batería", "fusible", "herramienta", "kit"],
  },
  {
    id: "controles-direccion",
    nombre: "Controles y dirección",
    x: 29,
    y: 26,
    descripcion: "Guayas, luces, direccionales, espejos y rodamientos.",
    claves: ["guaya", "cable", "luz", "faro", "direccional", "espejo", "direccion", "dirección", "manubrio"],
  },
];

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Asigna cada componente a una zona; lo que no empareja cae en `motor` por cercanía al bloque central. */
export function zonaDeComponente(c: Pick<Componente, "nombre" | "categoria">): ZonaId {
  const texto = norm(`${c.nombre} ${c.categoria}`);
  // el tren trasero se revisa antes que "llanta" suelta
  for (const z of ZONAS) {
    if (z.claves.some((k) => texto.includes(norm(k)))) return z.id;
  }
  return "motor";
}

export interface ZonaResumen {
  zona: Zona;
  componentes: Desgaste[];
  estado: EstadoZona;
  criticos: number;
  avisos: number;
  /** El componente más urgente, para el subtítulo del pin. */
  urgente: Desgaste | null;
}

const peor = (a: EstadoZona, b: EstadoZona): EstadoZona => {
  const orden: EstadoZona[] = ["ok", "warning", "critical"];
  return orden.indexOf(a) >= orden.indexOf(b) ? a : b;
};

function estadoDe(d: Desgaste): EstadoZona {
  if (d.restantePct <= 0 || d.kmRestantes <= 0) return "critical";
  if (d.restantePct <= 0.25) return "critical";
  if (d.restantePct <= 0.4) return "warning";
  return "ok";
}

export function resumenZonas(state: AppState): ZonaResumen[] {
  const porZona = new Map<ZonaId, Desgaste[]>();
  for (const d of desgastes(state)) {
    const id = zonaDeComponente(d.componente);
    porZona.set(id, [...(porZona.get(id) ?? []), d]);
  }

  return ZONAS.map((zona) => {
    const componentes = (porZona.get(zona.id) ?? []).sort((a, b) => a.restantePct - b.restantePct);
    let estado: EstadoZona = "ok";
    let criticos = 0;
    let avisos = 0;
    for (const d of componentes) {
      const e = estadoDe(d);
      estado = peor(estado, e);
      if (e === "critical") criticos += 1;
      else if (e === "warning") avisos += 1;
    }
    return { zona, componentes, estado, criticos, avisos, urgente: componentes[0] ?? null };
  });
}
