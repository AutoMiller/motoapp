export interface FilaFicha {
  label: string;
  valor: string;
  nota?: string;
}

export interface GrupoFicha {
  titulo: string;
  filas: FilaFicha[];
}

/**
 * Ficha técnica — Yamaha XTZ 250 ABS alineada con expediente Notion.
 * Fuente: /opt/data/cache/scratch/notion-expediente.md
 */
export const FICHA_XTZ250: GrupoFicha[] = [
  {
    titulo: "Datos del vehículo",
    filas: [
      { label: "Modelo / Línea", valor: "Yamaha XTZ 250 ABS (Lander / Fuel Injection)" }, // expediente Notion
      { label: "Placa", valor: "CAM53H" }, // expediente Notion
      { label: "Año modelo", valor: "2025" }, // expediente Notion (antes 2023)
      { label: "Color", valor: "Azul / Negro" }, // expediente Notion
      { label: "VIN (Chasis)", valor: "9FKDG2848S2039378" }, // expediente Notion
      { label: "Nº Motor", valor: "G3F2E039378" }, // expediente Notion
      { label: "Fecha de compra", valor: "2024-07-29" }, // expediente Notion
      { label: "Matrícula", valor: "2024-07-31 — Soacha (Cundinamarca)" }, // expediente Notion
    ],
  },
  {
    titulo: "Motor",
    filas: [
      { label: "Tipo", valor: "Monocilíndrico 4T, SOHC, 249,5 cm³, refrigerado por aire + radiador de aceite, FI, compresión 9.8:1" }, // auditoría #38 cilindraje 249,5 cm³
      { label: "Potencia", valor: "20,4 hp" }, // expediente Notion
      { label: "Torque", valor: "20,5 N·m" }, // expediente Notion
      { label: "Ralentí", valor: "1.300 – 1.500 rpm" }, // sin confirmar en expediente
    ],
  },
  {
    titulo: "Aceite y filtros",
    filas: [
      { label: "Aceite recomendado", valor: "Yamalube 10W-40, API SL+, JASO MA" }, // auditoría #7 sin aditivos reductores de fricción, no usar especificación diésel CD (pág. 65)
      { label: "Aceite — advertencia", valor: "Sin aditivos reductores de fricción; no usar especificación diésel CD" }, // auditoría #7 pág. 65
      { label: "Capacidad sin filtro", valor: "1,35 L" }, // expediente Notion
      { label: "Capacidad con filtro", valor: "1,45 L" }, // expediente Notion
      { label: "Cambio de aceite", valor: "5.000 km o 6 meses", nota: "Bogotá: 3.000–4.000 km" }, // sin confirmar en expediente
      { label: "Filtro de aceite", valor: "Cada 10.000 km / 12 meses", nota: "ref. 1S7E34400000" }, // auditoría #10 10.000 km / 12 meses · auditoría #11 referencia 1S7E34400000
      { label: "Filtro de aire", valor: "Limpiar cada servicio · cambiar 40.000 km", nota: "ref. B9L1" }, // auditoría #13 referencia B9L1
      { label: "Filtro combustible", valor: "Externo cada 15.000 km" }, // expediente Notion
      { label: "Bujía", valor: "NGK DR8EA", nota: "gap 0,6–0,7 mm · par 18 N·m · cada 10.000 km" }, // auditoría #16 par de bujía 18 N·m: sin fuente en manual del propietario
    ],
  },
  {
    titulo: "Transmisión y ruedas",
    filas: [
      { label: "Caja de cambios", valor: "5 velocidades" }, // expediente Notion
      { label: "Cadena", valor: "paso 520 (13/40) — confirmar con el repuesto", nota: "holgura 30–40 mm" }, // auditoría #30 paso 520 (13/40) — confirmar con el repuesto
      { label: "Piñón / catalina", valor: "13 / 40 dientes" }, // expediente Notion
      { label: "Kit de arrastre", valor: "Cambiar ~22.000 km", nota: "13/40 · cadena 520" }, // expediente Notion
      { label: "Llanta delantera", valor: "80/90-21M/C 48S", nota: "Metzeler Tourance" }, // expediente Notion
      { label: "Llanta trasera", valor: "120/80-18M/C 62S", nota: "Metzeler Tourance" }, // expediente Notion
      { label: "Presión solo", valor: "18 psi delantera · 22 psi trasera" }, // expediente Notion
      { label: "Presión con pasajero", valor: "22 psi delantera · 29 psi trasera" }, // expediente Notion
    ],
  },
  {
    titulo: "Frenos y suspensión",
    filas: [
      { label: "Freno delantero", valor: "Disco 245 mm · ABS monocanal, solo rueda delantera" }, // auditoría #29 monocanal, solo rueda delantera
      { label: "Freno trasero", valor: "Disco 203 mm" }, // expediente Notion
      { label: "Líquido de frenos", valor: "DOT 4 · cada 2 años", nota: "manguera cada 4 años" }, // expediente Notion
      { label: "Pastillas traseras mín.", valor: "1,0 mm" }, // expediente Notion
      { label: "Horquilla", valor: "Telescópica 220 mm", nota: "541 cc por barra" }, // expediente Notion
      { label: "Suspensión trasera", valor: "Pro-Link 205 mm" }, // auditoría #35 suspensión trasera: Pro-Link (no Monocross)
      { label: "Grasa de suspensión", valor: "Grasa de litio cada 10.000 km" }, // expediente Notion
    ],
  },
  {
    titulo: "Capacidades y cargas",
    filas: [
      { label: "Carga máxima total", valor: "157 kg" }, // expediente Notion
      { label: "Carga baúl/parrilla", valor: "7 kg" }, // expediente Notion
      { label: "Tanque", valor: "13,6 L", nota: "reserva 4,1 L" }, // sin confirmar en expediente
      { label: "Peso en vacío", valor: "153 kg" }, // sin confirmar en expediente
      { label: "Altura del asiento", valor: "875 mm" }, // sin confirmar en expediente
      { label: "Altura al suelo", valor: "270 mm" }, // sin confirmar en expediente
      { label: "Batería", valor: "12 V · 6 Ah (XTZ7L)", nota: "VRLA libre de mantenimiento" }, // sin confirmar en expediente
      { label: "Garantía", valor: "12 meses / 20.000 km", nota: "batería 6 meses" }, // auditoría #43 garantía 12 meses / 20.000 km, batería 6 meses
      { label: "Garantía — estado", valor: "Vencida", nota: "con 21.640 km ya superó los 20.000 km; compra 29/07/2024 + 12 meses = 29/07/2025" }, // auditoría #43 nota de vencimiento
    ],
  },
];

export interface FilaTorque {
  elemento: string;
  nm: number;
  kgf: number;
}

/**
 * Torques oficiales del Manual del Propietario (expediente Notion).
 */
export const TORQUES: FilaTorque[] = [
  { elemento: "Tornillo de drenaje de aceite", nm: 20, kgf: 2.0 }, // expediente Notion
  { elemento: "Tornillos cubierta filtro de aceite", nm: 10, kgf: 1.0 }, // expediente Notion
  { elemento: "Tuerca del eje trasero", nm: 46, kgf: 4.6 }, // expediente Notion
  { elemento: "Contratuerca tensor de cadena", nm: 15, kgf: 1.5 }, // expediente Notion
  { elemento: "Tornillos fijación baúl / soporte", nm: 20, kgf: 2.0 }, // expediente Notion
];

export const MANUAL_CODIGO = "B9L-F8199-S0"; // auditoría #50 código de manual B9L-F8199-S0

export const ENLACES_UTILES = [
  { label: "Manual del propietario (Yamaha)", url: "https://www.yamaha-motor.com.ar/modelo/descargar-manual-de-servicio/xtz-250-abs" },
  { label: "Consulta SOAT y RTM (RUNT)", url: "https://www.runt.gov.co/" },
  { label: "Consulta de multas (SIMIT)", url: "https://www.simit.org.co/" },
  { label: "Pico y placa Bogotá", url: "https://www.movilidadbogota.gov.co/" },
];
