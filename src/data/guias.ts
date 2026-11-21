/** Guías internas: páginas de consulta que viven dentro de la app (sin internet). */
export interface Guia {
  id: string;
  titulo: string;
  resumen: string;
  bloques: { titulo: string; items: string[] }[];
  fuente: string;
}

export const GUIAS: Guia[] = [
  {
    id: "llantas",
    titulo: "Calibración de llantas",
    resumen: "Presión correcta, cuándo medirla y cuándo cambiar la llanta.",
    bloques: [
      {
        titulo: "Presión (siempre en frío, sin rodar más de 2 km)",
        items: [
          "Solo piloto: 18 psi delantera · 22 psi trasera",
          "Con pasajero o carga: 22 psi delantera · 29 psi trasera",
          "Trocha o arena: bajar 2-3 psi para ganar tracción (sin pasar de 15/19)",
        ],
      },
      {
        titulo: "Cuándo revisar",
        items: [
          "Una vez por semana y siempre antes de una salida larga",
          "Después de un cambio brusco de temperatura o de rodar en barro",
          "Si la moto se siente pesada de dirección: revisa la delantera primero",
        ],
      },
      {
        titulo: "Desgaste",
        items: [
          "Mínimo legal y de seguridad: 1,6 mm de dibujo; recomendable cambiar a 3 mm",
          "Bulto, corte o cristalizado (goma dura y brillante) = cambio inmediato",
          "Delantera y trasera no se cambian al mismo tiempo: la trasera dura menos",
        ],
      },
    ],
    fuente: "Ficha XTZ 250 del proyecto · manual del propietario",
  },
  {
    id: "cadena",
    titulo: "Cadena y kit de arrastre",
    resumen: "Engrase, tensión y señales de cambio.",
    bloques: [
      {
        titulo: "Antes de cada salida off-road",
        items: [
          "Engrasar la cadena en frío, girando la rueda para cubrir todos los eslabones",
          "En barro, limpiar antes de engrasar: la grasa con arena es lija",
        ],
      },
      {
        titulo: "Tensión",
        items: [
          "Juego vertical recomendado: 30-40 mm en el punto medio del tramo inferior" /* manual pág. 75 */,
          "Medir con la moto en el piso, sin carga y sin el caballete",
          "Cadena muy tensa castiga el eje de salida; muy floja se sale",
        ],
      },
      {
        titulo: "Cuándo cambiar",
        items: [
          "Eslabón agarrotado, dientes de piñón en gancho o ruido al acelerar",
          "Cadena estirada más de lo que permite el tensor: cambia kit completo",
        ],
      },
    ],
    fuente: "Rutina declarada por el dueño (17-nov-2026) · ficha XTZ 250",
  },
  {
    id: "aceite",
    titulo: "Cambio de aceite",
    resumen: "Intervalo, cantidad y tipo.",
    bloques: [
      {
        titulo: "Cada cuánto",
        items: [
          "Cada 5.000 km o 6 meses, lo que ocurra primero" /* manual pág. 57 */,
          "En uso intenso de trocha o mucho polvo, adelantar a 3.000 km",
        ],
      },
      {
        titulo: "Qué llevar",
        items: [
          "10W-40 semisintético · 1,45 L con cambio de filtro",
          "Filtro de aceite nuevo en cada cambio",
        ],
      },
      {
        titulo: "Cómo saber que toca",
        items: [
          "Color negro opaco, olor a quemado o nivel bajo en la varilla",
          "El indicador de la app usa tu último cambio + intervalo del componente",
        ],
      },
    ],
    fuente: "Manual del propietario XTZ 250 · hábitos de servicio del dueño",
  },
  {
    id: "documentos",
    titulo: "Documentos y trámites",
    resumen: "SOAT, tecnomecánica y consultas oficiales.",
    bloques: [
      {
        titulo: "Qué revisar",
        items: [
          "SOAT vigente (la app te avisa 30 días antes)",
          "Tecnomecánica: motos nuevas a los 2 años, luego cada año",
          "Impuesto vehicular: depende del departamento (Meta)",
        ],
      },
      {
        titulo: "Consultas oficiales",
        items: [
          "RUNT: historial y vigencias — runt.gov.co",
          "SIMIT: comparendos — simit.org.co",
          "Pico y placa: Villavicencio y Bogotá (motos exentas en Bogotá)",
        ],
      },
    ],
    fuente: "Guía del proyecto · normativa vigente 2026",
  },
];

export function guiaPorId(id: string): Guia | undefined {
  return GUIAS.find((g) => g.id === id);
}
