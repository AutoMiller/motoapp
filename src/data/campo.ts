/* ------------------------------------------------------------------ */
/*  Manual de campo — Trail.Hacker OS (sección 5 del expediente)       */
/* ------------------------------------------------------------------ */

// ── 1. Mapa Exacto de Llaves y Copas ────────────────────────────────

export interface Llave {
  zona: string;
  herramienta: string;
}

export const LLAVES: Llave[] = [
  { zona: "Silla y compartimento de batería", herramienta: "Copa #8 (caja roja con ratchet y extensor)" },
  { zona: "Defensas Armo Parts", herramienta: "Copa #8 + Bristol #5" },
  { zona: "Portacelular Ulefone", herramienta: "Bristol #4" },
  { zona: "Freno trasero", herramienta: "Bristol #6" },
  { zona: "Ajustes generales y diagnóstico", herramienta: "Leatherman Wave+ · Ratchet Wera 8001 A / 711L · Multímetro Truper MUT-33" },
];

// ── 2. 6 Reparaciones DIY Dominadas ─────────────────────────────────

export const REPARACIONES_DIY: string[] = [
  "Filtro de aire lateral: Acceso, limpieza y verificación de sellado de caja-filtro.",
  "Cambio de aceite cada 5.000 km: Control estricto con TRIP 2 (1,35 L solo aceite / 1,45 L con filtro; torque drenaje 20 N·m).",
  "Control de óxido: Inspección de chasis, basculante y amortiguadores; lijado a metal limpio y pintura con anticorrosivo negro.",
  "Lavada profunda de cadena (14 pasos): Limpieza de cadena + tapa y piñón de salida.",
  "Limpieza eléctrica y protección de arnés: Cinta de carrocería/tela automotriz en puntos de roce y protectores dieléctricos.",
  "Cambio de batería y diagnóstico eléctrico: Verificación de voltaje y regulador con multímetro (confirmar polo + a la izquierda).",
];

// ── 3. Protocolo de Cadena de 14 Pasos (Manual Pág. 69) ────────────

export interface ProtocoloCadena {
  implementos: string[];
  pasos: { n: number; titulo: string; detalle: string; minutos?: number }[];
  notaTiempos: string;
}

export const PROTOCOLO_CADENA: ProtocoloCadena = {
  implementos: [
    "Gato lateral",
    "Queroseno",
    "Desengrasante seguro para O-ring",
    "Trapo desechable",
    "Trapo limpio",
    "Copas para tapa de piñón",
    "Cepillo de 3 caras",
    "Lubricante de cadena",
    "Guantes",
  ],
  pasos: [
    { n: 1, titulo: "Elevar la moto", detalle: "Colocar el gato lateral y asegurar la moto en posición vertical con la rueda trasera al aire." },
    { n: 2, titulo: "Retirar tapa del piñón de salida", detalle: "Usar las copas para desenroscar los tornillos de la tapa del piñón de salida y retirarla." },
    { n: 3, titulo: "Pre-limpieza con queroseno", detalle: "Aplicar queroseno sobre la cadena, el piñón de salida y la catalina para ablandar el barro y la grasa vieja." },
    { n: 4, titulo: "Aplicar desengrasante", detalle: "Rociar desengrasante seguro para O-ring sobre toda la cadena y dejar actuar 3 minutos.", minutos: 3 },
    { n: 5, titulo: "Cepillar la cadena", detalle: "Usar el cepillo de 3 caras para frotar la cadena por todas sus caras, eliminando suciedad incrustada." },
    { n: 6, titulo: "Cepillar piñón y catalina", detalle: "Limpiar a fondo el piñón de salida y la catalina con el cepillo." },
    { n: 7, titulo: "Enjuagar con queroseno", detalle: "Pasar trapo desechable impregnado en queroseno para retirar los residuos de desengrasante y suciedad." },
    { n: 8, titulo: "Secar la cadena", detalle: "Secar la cadena con el trapo limpio, girando la rueda trasera a mano para cubrir todo el recorrido." },
    { n: 9, titulo: "Secar piñón y catalina", detalle: "Secar a fondo el piñón de salida y la catalina antes de lubricar." },
    { n: 10, titulo: "Reinstalar tapa del piñón", detalle: "Colocar la tapa del piñón de salida y ajustar los tornillos con las copas." },
    { n: 11, titulo: "Lubricar la cara interna de la cadena", detalle: "Aplicar lubricante de cadena girando la rueda y cubriendo cada eslabón. Dejar reposar 20–30 minutos antes de rodar.", minutos: 30 },
    { n: 12, titulo: "Revisar tensión de cadena", detalle: "Verificar que la holgura de la cadena esté entre 30–40 mm según el manual." },
    { n: 13, titulo: "Verificar alineación de rueda", detalle: "Consultar manual pág. 69." },
    { n: 14, titulo: "Revisión final y limpieza del área", detalle: "Consultar manual pág. 69." },
  ],
  notaTiempos:
    "Desengrasante: dejar actuar 3 min (paso 4). Tras lubricar: reposar 20–30 min antes de rodar (paso 11).",
};

// ── 4. Presiones de Llantas Off-Road (Referencia Piloto ~60 kg) ─────

export interface PresionTerreno {
  terreno: string;
  delantera: string;
  trasera: string;
  nota: string;
}

export const PRESIONES_TERRENO: PresionTerreno[] = [
  { terreno: "Arena / Lodo profundo", delantera: "14–16 psi", trasera: "14–16 psi", nota: "Máxima tracción" },
  { terreno: "Trocha mixta / Piedras", delantera: "16–20 psi", trasera: "16–20 psi", nota: "Equilibrio agarre y protección de rin" },
  { terreno: "Ripio / Asfalto de enlace", delantera: "20–23 psi", trasera: "23–26 psi", nota: "+2–3 psi con equipaje o pasajero" },
];

// ── 5. Protocolo de Emergencia en Caso de Robo ──────────────────────

export interface ProtocoloRobo {
  pasos: string[];
}

export const PROTOCOLO_ROBO: ProtocoloRobo = {
  pasos: [
    "Rastrear ubicación en tiempo real con Tags Samsung + Android ocultos bajo el sillín (y GPS Self Security una vez instalado).",
    "Radicar denuncia ante la SIJIN y obtener número de radicado SPOA.",
    "Adjuntar expediente fotográfico y tarjeta de propiedad/factura.",
  ],
};
