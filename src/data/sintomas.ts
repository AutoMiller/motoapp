/**
 * Síntomas eléctricos comunes en la XTZ 250 y su secuencia de diagnóstico.
 *
 * Cada síntoma contiene pasos ordenados que guían al dueño del vehículo
 * desde la revisión más simple (fusible) hasta la conclusión de llevar
 * la moto a taller.  Los `fusibleId` hacen referencia al `puesto` de la
 * caja de fusibles ABS (o "principal" para el fusible principal).
 * En la variante carburada los puestos son null; el componente debe
 * resolver el nombre del circuito en su lugar.
 */

export interface PasoDiagnostico {
  orden: number;
  accion: string;
  detalle: string;
  /**
   * Referencia al fusible relacionado.
   * - número → `puesto` en CAJAS.abs.caja
   * - "principal" → fusible principal (15 A ABS / 20 A carburada)
   * - undefined → paso sin fusible asociado
   */
  fusibleId?: number | "principal";
}

export interface SintomaElectrico {
  id: string;
  titulo: string;
  pasos: PasoDiagnostico[];
}

export const SINTOMAS: SintomaElectrico[] = [
  {
    id: "no-arranca",
    titulo: "No arranca nada",
    pasos: [
      {
        orden: 1,
        accion: "Revisar el fusible principal",
        detalle:
          "Abre el panel B (detrás del carenado lateral) y saca el fusible principal. Mira si el filamento de dentro está roto. Si está fundido, cámbialo por uno del mismo amperaje (15 A en ABS, 20 A en carburada).",
        fusibleId: "principal",
      },
      {
        orden: 2,
        accion: "Comprobar la batería y sus bornes",
        detalle:
          "Mide el voltaje en los bornes con la moto apagada: por debajo de 12,4 V la batería está descargada y no mueve el arranque. Revisa que los bornes estén apretados y sin sulfato. En la variante carburada, además, hay un fusible de encendido dentro de la caja; en la ABS no existe como fusible separado.",
      },
      {
        orden: 3,
        accion: "Medir continuidad del portafusible",
        detalle:
          "Con un multímetro en ohmios, toca las dos patas del portafusible del principal. Debe marcar ~0 Ω. Si no hay continuidad, el problema es el portafusible o el cable, no el fusible.",
      },
      {
        orden: 4,
        accion: "Revisar la conexión a masa (chasis)",
        detalle:
          "Localiza el cable negro grueso que va de la batería al chasis. Desconéctalo, límpialo con lija fina y vuelve a apretar. Una masa floja mata todo el sistema.",
      },
      {
        orden: 5,
        accion: "Verificar borne de batería",
        detalle:
          "Asegúrate de que los bornes de la batería estén limpios y bien apretados. Mide el voltaje: debe ser ≥12 V en reposo. Si está muy bajo, carga o reemplaza la batería.",
      },
      {
        orden: 6,
        accion: "Si se vuelve a fundir, hay un corto",
        detalle:
          "Si al poner un fusible nuevo se funde al instante, hay un cortocircuito en el sistema. No insistas: lleva la moto a un taller electricista.",
      },
    ],
  },
  {
    id: "no-luz-delantera",
    titulo: "No enciende la luz delantera",
    pasos: [
      {
        orden: 1,
        accion: "Revisar el fusible del faro",
        detalle:
          "En la caja de fusibles debajo del asiento, localiza el fusible del faro (en carburada está etiquetado «Faro», 10 A). Verifica visualmente el filamento.",
      },
      {
        orden: 2,
        accion: "Probar la bombilla directamente",
        detalle:
          "Saca la bombilla del faro y conéctala directamente a la batería (12 V) por unos segundos. Si no enciende, la bombilla está quemada: cámbiala.",
      },
      {
        orden: 3,
        accion: "Revisar el conector del faro",
        detalle:
          "Desconecta el conector eléctrico del faro. Revisa que los pines no estén oxidados o doblados. Limpia con spray de contactos si es necesario.",
      },
      {
        orden: 4,
        accion: "Revisar la masa del faro",
        detalle:
          "El faro tiene un cable de masa que va al chasis. Desconéctalo, límpialo y vuelve a apretar. Una mala masa hace que la luz no encienda o parpadee.",
      },
      {
        orden: 5,
        accion: "Si se vuelve a fundir, hay un corto",
        detalle:
          "Si el fusible del faro se funde repetidamente, hay un cortocircuito en el circuito del faro. No insistas: taller especializado.",
      },
    ],
  },
  {
    id: "no-suena-pito",
    titulo: "No suena el pito",
    pasos: [
      {
        orden: 1,
        accion: "Revisar el fusible de señalización",
        detalle:
          "En la caja de fusibles, busca el fusible de señalización (en carburada: «Sistema de señalización», 10 A; en ABS está dentro del circuito del puesto 2). Verifica el filamento.",
        fusibleId: 2,
      },
      {
        orden: 2,
        accion: "Probar el pito directamente",
        detalle:
          "Desconecta el cable del pito y toca los dos bornes del pito con cables directamente a la batería (+ y -). Si no suena, el pito está dañado.",
      },
      {
        orden: 3,
        accion: "Revisar el contacto del manubrio",
        detalle:
          "El botón del pito en el manubrio es un contacto metálico que se desgasta. Presiónalo varias veces rápido. Si a veces suena, el contacto está desgastado.",
      },
      {
        orden: 4,
        accion: "Revisar la masa del pito",
        detalle:
          "El pito se conecta a masa por el chasis. Revisa el punto de fijación: debe estar limpio y bien apretado.",
      },
      {
        orden: 5,
        accion: "Si se vuelve a fundir, hay un corto",
        detalle:
          "Si el fusible de señalización se funde al tocar el pito, hay un cortocircuito en su cableado. No insistas: taller.",
      },
    ],
  },
  {
    id: "no-direccionales",
    titulo: "No funcionan los direccionales",
    pasos: [
      {
        orden: 1,
        accion: "Revisar el fusible de señalización",
        detalle:
          "En la caja de fusibles, localiza el fusible de señalización (en carburada: «Sistema de señalización», 10 A). Si está fundido, los direccionales no reciben energía.",
        fusibleId: 2,
      },
      {
        orden: 2,
        accion: "Verificar las bombillas",
        detalle:
          "Saca las bombillas de las direccionales (delantera y trasera) y míralas: el filamento debe estar intacto. Prueba intercambiando la izquierda con la derecha.",
      },
      {
        orden: 3,
        accion: "Revisar el interruptor del manubrio",
        detalle:
          "El palanca de direccionales es un interruptor que puede oxidarse. Muévela varias veces arriba y abajo. Si a veces funciona, el interruptor necesita limpieza o reemplazo.",
      },
      {
        orden: 4,
        accion: "Revisar el flasher (relé intermitente)",
        detalle:
          "El flasher es un pequeño relé que hace parpadear las luces. Si las direccionales están fijas (sin parpadear) o no encienden nada, puede estar dañado.",
      },
      {
        orden: 5,
        accion: "Si se vuelve a fundir, hay un corto",
        detalle:
          "Si el fusible de señalización se funde al activar direccionales, hay un cortocircuito. No insistas: taller.",
      },
    ],
  },
  {
    id: "tablero-muerto",
    titulo: "Tablero muerto o se reinicia",
    pasos: [
      {
        orden: 1,
        accion: "Revisar el fusible secundario (respaldo)",
        detalle:
          "En la caja de fusibles ABS, el puesto 3 es el fusible secundario de respaldo (7.5 A) que alimenta la memoria del tablero. Si está fundido, el tablero pierde datos o se apaga.",
        fusibleId: 3,
      },
      {
        orden: 2,
        accion: "Revisar el fusible principal",
        detalle:
          "Si el tablero está completamente muerto (sin nada encendido), revisa también el fusible principal detrás del panel B.",
        fusibleId: "principal",
      },
      {
        orden: 3,
        accion: "Verificar el conector del tablero",
        detalle:
          "El tablero tiene un conector multipin en la parte trasera. Desconéctalo y revisa que los pines no estén oxidados ni doblados. Limpia con spray de contactos.",
      },
      {
        orden: 4,
        accion: "Revisar la masa del tablero",
        detalle:
          "El tablero tiene su propia masa al chasis. Revisa que el cable negro esté bien conectado y limpio.",
      },
      {
        orden: 5,
        accion: "Si se vuelve a fundir, hay un corto",
        detalle:
          "Si el fusible secundario se funde repetidamente, hay un cortocircuito en el circuito del tablero. No insistas: taller.",
      },
    ],
  },
  {
    id: "abs-encendido",
    titulo: "Luz de ABS encendida",
    pasos: [
      {
        orden: 1,
        accion: "Revisar el fusible de la bomba del ABS",
        detalle:
          "En la caja de fusibles ABS, el puesto 2 es la bomba del ABS (10 A). Si está fundido, el sistema ABS no funciona y la luz queda fija.",
        fusibleId: 2,
      },
      {
        orden: 2,
        accion: "Revisar el fusible del solenoide del ABS",
        detalle:
          "El puesto 1 es el solenoide del ABS. Aunque el manual no publica su amperaje, léelo en el propio fusible. Si está fundido, reemplázalo con el mismo amperaje.",
        fusibleId: 1,
      },
      {
        orden: 3,
        accion: "Verificar los sensores de rueda",
        detalle:
          "Los sensores ABS están en cada rueda. Revisa que los cables no estén cortados ni pellizcados y que los conectores estén bien puestos.",
      },
      {
        orden: 4,
        accion: "Reiniciar el sistema",
        detalle:
          "Apaga la moto, desconecta el borne negativo de la batería por 1 minuto y vuelve a conectarlo. Enciende y verifica si la luz de ABS se apaga después de unos segundos.",
      },
      {
        orden: 5,
        accion: "Si la luz persiste, taller ABS",
        detalle:
          "Si los fusibles están bien y la luz de ABS sigue encendida, el módulo ABS o un sensor puede estar dañado. Necesitas un taller con escáner ABS.",
      },
    ],
  },
  {
    id: "fusible-se-funde",
    titulo: "Se funde el fusible al instante",
    pasos: [
      {
        orden: 1,
        accion: "No subas el amperaje",
        detalle:
          "Nunca pongas un fusible de mayor amperaje. Si el circuito es de 10 A, usa 10 A. Poner uno de 20 A puede derretir cables y causar un incendio.",
        fusibleId: "principal",
      },
      {
        orden: 2,
        accion: "Identifica qué circuito se funde",
        detalle:
          "Anota qué fusible es el que se funde (número de puesto y amperaje). Esto te dice qué circuito tiene el cortocircuito.",
      },
      {
        orden: 3,
        accion: "Desconecta los consumidores del circuito",
        detalle:
          "Con el fusible nuevo puesto, desconecta uno por uno los componentes de ese circuito (luces, pito, etc.) y enciende la moto. Cuando deje de fundirse, el último desconectado es el culpable.",
      },
      {
        orden: 4,
        accion: "Revisa el cableado del componente culpable",
        detalle:
          "Mira el cableado del componente que identificaste: busca cables roídos, pelados o tocando el chasis. Un cable pelado tocando metal es un cortocircuito directo.",
      },
      {
        orden: 5,
        accion: "Si no encuentras el corto, taller",
        detalle:
          "Un cortocircuito que no puedes localizar visualmente requiere un multímetro y experiencia. Lleva la moto a un taller electricista de motos.",
      },
    ],
  },
];
