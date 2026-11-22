// Historial real de servicios — expediente Notion · 21/11/2026
// Fuente: /opt/data/cache/scratch/notion-expediente.md

export interface MantenimientoHistorico {
  fecha: string;         // YYYY-MM-DD
  km: number | null;     // null cuando la factura no indica kilometraje
  proveedor: string;
  factura?: string;
  items: string;
  total: number;         // COP
  anulada?: boolean;     // true si hubo nota crédito
}

export interface Aditamento {
  fecha: string;
  articulo: string;
  proveedor: string;
  valor: number;         // COP (0 si no hay valor registrado)
  estado: string;
}

export interface Devolucion {
  fecha: string;
  articulo: string;
  valor: number;         // COP
  fechaReembolso: string;
}

export interface IntervaloMantenimiento {
  componente: string;
  intervaloKm: number | null;
  intervaloMeses: number | null;
  ultimoKm: number | null;
  costoEstimado: string; // texto libre (puede ser compuesto o "—")
}

/**
 * Historial completo de facturas de mantenimiento y repuestos.
 * Subtotal neto: $2.673.290 COP (excluyendo la factura anulada).
 */
export const SERVICIOS_REALES: MantenimientoHistorico[] = [
  {
    fecha: "2024-09-04",
    km: 1_028,
    proveedor: "Motoauto Store",
    factura: "FSFE7122",
    items: "2× Aceite Full Sint. 10W-40 ($128.001) + 1× Filtro Aceite ($64.500)",
    total: 192_502,
  },
  {
    fecha: "2024-09-21",
    km: null,
    proveedor: "Incolmotos Yamaha",
    factura: "B3FE90850",
    items: "1× Espejo Izq. FZN250 ($41.345 + IVA)",
    total: 49_201,
  },
  {
    fecha: "2024-10-10",
    km: null,
    proveedor: "Mercado Libre",
    items: "Motul C5 Lubricante Cadena + Cepillo + 2 Desengrasantes",
    total: 88_811,
  },
  {
    fecha: "2024-12-06",
    km: 4_500,
    proveedor: "Motor Uno SAS",
    factura: "RB16182",
    items: "Rev. 4.000 km ($0) + Combo Lub. ($5.000) + 1× Full Sint. 10W-40 ($64.100) + Filtro Aire B9L1 ($52.300) + Filtro Aceite ($74.100)",
    total: 195_500,
  },
  {
    fecha: "2025-01-03",
    km: 5_000,
    proveedor: "Motor Uno Av. Boyacá",
    items: "Cierre garantía PQR #1046114: buje amortiguador trasero, tornillo tapa lateral, ralentí y tornillería",
    total: 0,
  },
  {
    fecha: "2025-04-30",
    km: null,
    proveedor: "Yamaha 3S Bogotá",
    factura: "BMFE31283",
    items: "Lavado ($23.800) + 2× Semisint. 10W-40 ($96.000) + Filtro Aceite ($65.300) + O-Ring ($14.500) + Pastas Del. Incolbest ($46.500) + Espejo Der. B9L1 ($403.500) + Espejo Izq. B9L1 ($399.200)",
    total: 1_048_801,
  },
  {
    fecha: "2025-06-21",
    km: null,
    proveedor: "Motoauto Store",
    factura: "FSFE8899",
    items: "Lubricante cadenas ($27.600) + 1× Pastas Del. ($46.500) + 2× Pastas Tras. ($83.000) + Mano de Obra ($29.750)",
    total: 186_850,
  },
  {
    fecha: "2025-09-06",
    km: null,
    proveedor: "Incolmotos Yamaha",
    factura: "B3FE113166",
    items: "1× Pedal de Cambio XTZ250Z Ténéré ($55.714 + IVA)",
    total: 66_300,
  },
  {
    fecha: "2025-10-18",
    km: null,
    proveedor: "Motor Uno SAS",
    factura: "RB24233",
    items: "1× Filtro Aceite ($47.600) + 1× Aceite Semisint. 10W-40 ($48.000) + Mano de Obra ($18.000)",
    total: 113_600,
  },
  {
    fecha: "2025-12-01",
    km: null,
    proveedor: "Mercado Libre",
    items: "Batería Litio Hibari YB7B-B / LFPX7 (Reclamo 5443977315 por polaridad)",
    total: 236_725,
  },
  {
    fecha: "2026-01-05",
    km: null,
    proveedor: "Tienda Incolmotos",
    factura: "ECFE34697",
    items: "4× Semisint. 10W-40 ($192.000) + 2× Filtro Aceite ($95.200) — Anulada por Nota Crédito NEEC1451 (10/02/2026) por devolución de dinero",
    total: 0,
    anulada: true,
  },
  {
    fecha: "2026-09-23",
    km: 9_300,
    proveedor: "Concesionario Yamaha",
    items: "Cambio llanta trasera Metzeler (registrado en MotoApp)",
    total: 480_000,
  },
  {
    fecha: "2026-10-10",
    km: 9_100,
    proveedor: "Casa / DIY",
    items: "Engrase y tensión de cadena (protocolo 14 pasos)",
    total: 15_000,
  },
];

/**
 * Aditamentos, protecciones, equipaje y rider gear.
 * Subtotal neto: $3.936.916 COP (+ USD $33,14 guantes Fox + maniguetas sin valor).
 */
export const ADITAMENTOS: Aditamento[] = [
  {
    fecha: "2024-07-28",
    articulo: "Casco AGV AX9 E2205 Solid MPLK White (Talla L, cód. 207631A4LY)",
    proveedor: "Cascos Store SAS",
    valor: 1_599_999,
    estado: "Activo · Garantía Dainese registrada",
  },
  {
    fecha: "2024-10-08",
    articulo: "Herraje para Maletero XTZ 250 -2020",
    proveedor: "Prometálicos Armo SAS",
    valor: 190_000,
    estado: "Instalado",
  },
  {
    fecha: "2024-11-14",
    articulo: "Impermeable 33,000ft Packable Rain",
    proveedor: "Amazon",
    valor: 150_835,
    estado: "Activo",
  },
  {
    fecha: "2024-11-23",
    articulo: "Protector de Motor ($187.000) + Herraje Protección con Slider ($201.000)",
    proveedor: "Prometálicos Armo SAS",
    valor: 388_000,
    estado: "Instalado",
  },
  {
    fecha: "2025-04-03",
    articulo: "Slider de Motor Yamaha XTZ 250",
    proveedor: "Mercado Libre",
    valor: 366_000,
    estado: "Instalado",
  },
  {
    fecha: "2025-08-09",
    articulo: "Guantes Fox Racing Dirtpaw Azules",
    proveedor: "Amazon",
    valor: 33_140, // USD $33.14 ≈ COP (valor referencial)
    estado: "Activo",
  },
  {
    fecha: "2025-09-06",
    articulo: "Alforjas Impermeables Rhinowalk (compra Temu $337.535 + envío reemplazo garantía USD $41.43 / $159.547)",
    proveedor: "Temu / Rhinowalk",
    valor: 497_082,
    estado: "Reemplazo entregado 15/01/2026 vía UPS",
  },
  {
    fecha: "2025-09-10",
    articulo: "Botas Militares Masherland® Future",
    proveedor: "Mercado Libre",
    valor: 350_000,
    estado: "Activo",
  },
  {
    fecha: "2025-12-05",
    articulo: 'Kit Exploradoras Hella 16W 2" Bicolor ($232.470) + Arnés Switch ($67.500) + Extensores L MXM ($42.000) + Instalación ($53.030)',
    proveedor: "Martinech",
    valor: 395_000,
    estado: "Instalado",
  },
  {
    fecha: "2026-03-26",
    articulo: "Maniguetas de Lujo Yamaha 250 Abatibles",
    proveedor: "Mercado Libre",
    valor: 0, // Sin valor en correo
    estado: "Entregadas 26/03/2026",
  },
];

/**
 * Compras devueltas y reembolsadas (historial de descarte).
 */
export const DEVOLUCIONES: Devolucion[] = [
  {
    fecha: "2024-10-04",
    articulo: "Parrilla Cicol Mod2021 (Aolmoto / ML)",
    valor: 156_000,
    fechaReembolso: "2024-10-17",
  },
  {
    fecha: "2024-10-30",
    articulo: "Holder Soporte Celular Metálico (ML)",
    valor: 28_885,
    fechaReembolso: "2024-11-28",
  },
  {
    fecha: "2024-11-23",
    articulo: "Kit Rodilleras + Coderas Moto (ML)",
    valor: 95_000,
    fechaReembolso: "2024-11-28",
  },
];

/**
 * Tabla Maestra de Intervalos de Mantenimiento (MotoApp).
 * 7 filas según expediente Notion.
 */
export const INTERVALOS_MAESTROS: IntervaloMantenimiento[] = [
  {
    componente: "Lubricación de cadena",
    intervaloKm: 500,
    intervaloMeses: 1,
    ultimoKm: 9_100,
    costoEstimado: "$10.000",
  },
  {
    componente: "Presión de llantas",
    intervaloKm: 500,
    intervaloMeses: null, // semanal
    ultimoKm: 9_420,
    costoEstimado: "$0",
  },
  {
    componente: "Cambio de aceite",
    intervaloKm: 5_000,
    intervaloMeses: 6,
    ultimoKm: 5_000,
    costoEstimado: "$85.000",
  },
  {
    componente: "Filtro aceite / Filtro aire / Bujía / Válvulas",
    intervaloKm: 10_000,
    intervaloMeses: null, // 12–24 meses (variable)
    ultimoKm: 5_000,
    costoEstimado: "$25k / $25k / $20k / $90k",
  },
  {
    componente: "Filtro combustible externo",
    intervaloKm: 15_000,
    intervaloMeses: null,
    ultimoKm: null,
    costoEstimado: "—",
  },
  {
    componente: "Llanta trasera",
    intervaloKm: 15_000,
    intervaloMeses: 36,
    ultimoKm: 9_300,
    costoEstimado: "$480.000",
  },
  {
    componente: "Aceite horquilla / Kit arrastre / Líquido frenos",
    intervaloKm: null, // 20.000–24.000 km (rango)
    intervaloMeses: null,
    ultimoKm: 5_000,
    costoEstimado: "$200k / $250k / $60k",
  },
];
