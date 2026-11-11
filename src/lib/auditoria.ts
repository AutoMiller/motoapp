import type { AppState } from "../types";
import { isoDate } from "./format";

export type SeveridadHallazgo = "alta" | "media" | "baja";

export interface Hallazgo {
  codigo: string;
  severidad: SeveridadHallazgo;
  mensaje: string;
}

/**
 * Revisa la consistencia de los datos cargados a mano y devuelve
 * una lista de hallazgos con su severidad y mensaje en castellano.
 *
 * Si no hay vehículo cargado, no se evalúa nada y retorna arreglo vacío.
 */
export function auditoria(state: AppState, hoy?: string): Hallazgo[] {
  const hallazgos: Hallazgo[] = [];
  const fechaHoy = hoy ?? isoDate();

  // Sin vehículo cargado no se evalúa nada
  if (!state.vehiculo) {
    return hallazgos;
  }

  const { vehiculo, mantenimientos, documentos, componentes } = state;

  // 1. km-retroceso (alta) — mantenimiento con km > vehiculo.kmActual
  const kmRetrocesos = mantenimientos.filter((m) => m.km > vehiculo.kmActual);
  if (kmRetrocesos.length > 0) {
    hallazgos.push({
      codigo: "km-retroceso",
      severidad: "alta",
      mensaje: `${kmRetrocesos.length} registro(s) de mantenimiento tienen kilómetros mayores al odómetro actual del vehículo.`,
    });
  }

  // 2. fecha-futura (media) — mantenimiento con fecha posterior a hoy
  for (const m of mantenimientos) {
    if (m.fecha > fechaHoy) {
      hallazgos.push({
        codigo: "fecha-futura",
        severidad: "media",
        mensaje: `El mantenimiento "${m.titulo}" tiene una fecha (${m.fecha}) posterior a la fecha actual.`,
      });
    }
  }

  // 3. doc-sin-fecha (media) — documento sin fechaVencimiento
  for (const doc of documentos) {
    if (!doc.fechaVencimiento) {
      hallazgos.push({
        codigo: "doc-sin-fecha",
        severidad: "media",
        mensaje: `El documento "${doc.nombre}" (${doc.tipo}) no tiene fecha de vencimiento registrada.`,
      });
    }
  }

  // 4. componente-sin-intervalo (alta) — componente activo con intervaloKm <= 0 y intervaloMeses <= 0
  for (const comp of componentes) {
    if (comp.activo && comp.intervaloKm <= 0 && comp.intervaloMeses <= 0) {
      hallazgos.push({
        codigo: "componente-sin-intervalo",
        severidad: "alta",
        mensaje: `El componente "${comp.nombre}" está activo pero no tiene intervalo de mantenimiento definido, por lo que no se puede calcular su desgaste.`,
      });
    }
  }

  // 5. tanqueo-incompleto (media) — mantenimiento con tanqueo y galones <= 0
  for (const m of mantenimientos) {
    if (m.tanqueo !== undefined && m.tanqueo.galones <= 0) {
      hallazgos.push({
        codigo: "tanqueo-incompleto",
        severidad: "media",
        mensaje: `El tanqueo registrado en "${m.titulo}" no tiene galones registrados (galones <= 0).`,
      });
    }
  }

  // 6. odo-no-monotonico (media) — ordenando por fecha ascendente, algún km menor que el anterior
  const ordenados = [...mantenimientos].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  for (let i = 1; i < ordenados.length; i++) {
    if (ordenados[i].km < ordenados[i - 1].km) {
      hallazgos.push({
        codigo: "odo-no-monotonico",
        severidad: "media",
        mensaje: `El odómetro retrocede entre "${ordenados[i - 1].titulo}" (${ordenados[i - 1].km} km) y "${ordenados[i].titulo}" (${ordenados[i].km} km).`,
      });
    }
  }

  return hallazgos;
}
