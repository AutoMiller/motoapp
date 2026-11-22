/**
 * Debounce genérico sin dependencias.
 *
 * Agrupa llamadas repetidas dentro de una ventana de tiempo y ejecuta
 * una sola vez con el último valor recibido.  Si se llama de nuevo antes
 * de que expire el timeout, se reinicia el contador.
 *
 * Uso en MotoApp: coalescer mutaciones rápidas (marcar 10 ítems de un
 * checklist en menos de 2 s) para enviar un solo batch al backend.
 */

export interface DebounceHandle {
  /** Marca un nuevo valor pendiente; reinicia el timer. */
  schedule: (value: unknown) => void;
  /** Fuerza la ejecución inmediata del valor pendiente (si lo hay). */
  flush: () => void;
  /** Cancela el timer sin ejecutar. */
  cancel: () => void;
  /** Devuelve true si hay un valor pendiente por ejecutar. */
  isPending: () => boolean;
}

/**
 * Crea un manejador debounce.
 *
 * @param fn     función a ejecutar con el último valor acumulado
 * @param ms     ventana de espera en milisegundos (default 2000)
 */
export function createDebounce(fn: (value: unknown) => void, ms = 2_000): DebounceHandle {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: unknown = null;

  const isPending = () => pending !== null;

  const run = () => {
    timer = null;
    const value = pending;
    pending = null;
    if (value !== null) fn(value);
  };

  return {
    schedule(value) {
      pending = value;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(run, ms);
    },
    flush() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      run();
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      pending = null;
    },
    isPending,
  };
}
