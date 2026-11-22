const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/**
 * Devuelve una cadena relativa en español: "hace 3 semanas", "hoy", "ayer", etc.
 * Recibe una fecha ISO (YYYY-MM-DD) y una referencia (por defecto hoy).
 */
export function relativa(iso: string, hoy = new Date()): string {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, (m || 1) - 1, d || 1);
  const diffMs = hoy.getTime() - fecha.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "ayer";
  if (diffDays === -1) return "mañana";
  if (diffDays > 0 && diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays > 0 && diffDays < 28) return `hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays > 0 && diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
  if (diffDays > 0) return `hace ${Math.floor(diffDays / 365)} años`;

  // Futuro
  if (diffDays > -7) return `en ${Math.abs(diffDays)} días`;
  if (diffDays > -28) return `en ${Math.floor(Math.abs(diffDays) / 7)} semanas`;
  if (diffDays > -365) return `en ${Math.floor(Math.abs(diffDays) / 30)} meses`;
  return `en ${Math.floor(Math.abs(diffDays) / 365)} años`;
}

/** Fecha exacta corta: "10 oct 2026". */
export function fechaExacta(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES_CORTOS[(m || 1) - 1]} ${y}`;
}
