import type { Mantenimiento, Tanqueo } from "../types";

/** Convierte una cadena numérica (acepta comas como decimales) a number. */
export function aNumero(s: string): number {
  const limpio = s.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(limpio);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Busca el último tanqueo con tanqueLleno=true antes del odómetro dado.
 * Devuelve { tanqueo, km } o null.
 */
export function findLastFullTank(
  mantenimientos: Mantenimiento[],
  beforeKm: number,
): { tanqueo: Tanqueo; km: number } | null {
  for (const m of mantenimientos) {
    if (m.tanqueo && m.tanqueo.tanqueLleno && m.km < beforeKm) {
      return { tanqueo: m.tanqueo, km: m.km };
    }
  }
  return null;
}

/** Calcula km/galón entre el tanqueo anterior lleno y el actual. */
export function calcKmPerGal(
  mantenimientos: Mantenimiento[],
  odometro: number,
): number | null {
  const prev = findLastFullTank(mantenimientos, odometro);
  if (!prev) return null;
  const diff = odometro - prev.km;
  if (diff <= 0) return null;
  return diff; // km recorridos desde el último tanque lleno
}

/** Calcula costo por km dado un costo total y la distancia recorrida. */
export function calcCostPerKm(costo: number, kmDiff: number): number | null {
  if (kmDiff <= 0 || costo <= 0) return null;
  return costo / kmDiff;
}
