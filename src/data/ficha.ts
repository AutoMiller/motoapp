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
 * Ficha técnica — Yamaha XTZ 250 ABS (manual del propietario B8L-F8199-S0,
 * ficha Yamaha Colombia y manual de taller de la versión carburada 4B41).
 * Ver docs/research/02-xtz250-mantenimiento.md
 */
export const FICHA_XTZ250: GrupoFicha[] = [
  {
    titulo: "Motor",
    filas: [
      { label: "Tipo", valor: "Monocilíndrico 4T, SOHC, 2 válvulas" }, // sin fuente en el manual
      { label: "Cilindraje", valor: "249,5 cm³", nota: "74,0 × 58,0 mm · 9,8:1" }, /* manual pág. 96 */
      { label: "Refrigeración", valor: "Aire + enfriador de aceite" }, // manual pág. 96 (enfriado por aire)
      { label: "Potencia", valor: "20,4 hp @ 8.000 rpm" }, // sin fuente en el manual
      { label: "Torque", valor: "20,5 N·m @ 6.500 rpm" }, // sin fuente en el manual
      { label: "Alimentación", valor: "Inyección electrónica", nota: "carburador en 2016–2020" }, // sin fuente en el manual
      { label: "Transmisión", valor: "5 velocidades · cadena 13/40" }, // sin fuente en el manual
      { label: "Ralentí", valor: "1.300 – 1.500 rpm" }, // manual pág. 68
    ],
  },
  {
    titulo: "Aceite y filtros",
    filas: [
      { label: "Aceite recomendado", valor: "10W-40 JASO MA/MA2", nota: "API SL o superior" }, /* manual pág. 96 */
      { label: "Capacidad sin filtro", valor: "1,35 L" }, // manual pág. 96
      { label: "Capacidad con filtro", valor: "1,45 L" }, // manual pág. 96
      { label: "Cambio de aceite", valor: "5.000 km o 6 meses", nota: "Bogotá: 3.000–4.000 km" }, // manual pág. 57
      { label: "Filtro de aceite", valor: "Cada 5.000 km / 12 meses", nota: "ref. 38B-E3440-00-00" }, /* manual pág. 57 */
      { label: "Filtro de aire", valor: "Limpiar cada servicio · cambiar 40.000 km" }, /* manual pág. 53 */
      { label: "Bujía", valor: "NGK DR8EA-N", nota: "gap 0,6–0,7 mm · par 18 N·m" }, /* manual pág. 62 */
    ],
  },
  {
    titulo: "Transmisión y ruedas",
    filas: [
      { label: "Cadena", valor: "428 × 130 eslabones", nota: "holgura 30–40 mm" }, // holgura: manual pág. 75; tamaño: sin fuente
      { label: "Piñón / catalina", valor: "13 / 40 dientes" }, // sin fuente en el manual
      { label: "Kit de arrastre", valor: "Cambiar ~22.000 km", nota: "13/40 · kit 520H×122 o 428×130" }, // sin fuente en el manual
      { label: "Llanta delantera", valor: "80/90-21 48S" }, // manual pág. 96 (80/90-21M/C 48S)
      { label: "Llanta trasera", valor: "120/80-18 62S" }, // manual pág. 96 (120/80-18M/C 62S)
      { label: "Presión solo", valor: "18 psi delantera · 22 psi trasera" }, // manual pág. 70
      { label: "Presión con pasajero", valor: "22 psi delantera · 29 psi trasera" }, // manual pág. 70
    ],
  },
  {
    titulo: "Frenos y suspensión",
    filas: [
      { label: "Freno delantero", valor: "Disco 245 × 3,5 mm · ABS" }, // disco: sin fuente; ABS: manual pág. 97
      { label: "Freno trasero", valor: "Disco 203 × 4,5 mm" }, // disco: sin fuente; manual pág. 97
      { label: "Líquido de frenos", valor: "DOT 4 · cada 2 años", nota: "tubo de freno cada 4 años" }, // manual pág. 74, 54
      { label: "Horquilla", valor: "Telescópica 41 mm · 220 mm" }, // tipo: manual pág. 97; medidas: sin fuente
      { label: "Suspensión trasera", valor: "Monocross · 205 mm" }, // tipo: manual pág. 97 (basculante); medidas: sin fuente
      { label: "Aceite de horquilla", valor: "541 cc por barra" }, // sin fuente en el manual
    ],
  },
  {
    titulo: "Eléctrico y capacidades",
    filas: [
      { label: "Batería", valor: "12 V · 6 Ah (XTZ7L)", nota: "VRLA libre de mantenimiento" }, // manual pág. 97
      { label: "Tanque", valor: "13,6 L", nota: "reserva 4,1 L" }, /* manual pág. 35, 96 */
      { label: "Peso en vacío", valor: "153 kg" }, /* manual pág. 96 */
      { label: "Altura del asiento", valor: "875 mm" }, // manual pág. 96
      { label: "Altura al suelo", valor: "270 mm" }, // manual pág. 96
      { label: "Consumo real", valor: "28 – 33 km/l", nota: "105 – 125 km/galón" }, // sin fuente en el manual
    ],
  },
];

export const ENLACES_UTILES = [
  { label: "Manual del propietario (Yamaha)", url: "https://www.yamaha-motor.com.ar/modelo/descargar-manual-de-servicio/xtz-250-abs" },
  { label: "Consulta SOAT y RTM (RUNT)", url: "https://www.runt.gov.co/" },
  { label: "Consulta de multas (SIMIT)", url: "https://www.simit.org.co/" },
  { label: "Pico y placa Bogotá", url: "https://www.movilidadbogota.gov.co/" },
];
