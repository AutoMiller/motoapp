import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  Ajustes,
  Alerta,
  AppState,
  Componente,
  Documento,
  ID,
  Mantenimiento,
  OrdenServicio,
  Recurso,
  Taller,
  Tarea,
  Vehiculo,
  Viaje,
} from "../types";
import { estadoInicial, estadoDemo, migrar, type DatosOnboarding } from "../data/seed";
import { crearBackend, type Backend, type Capacidades } from "./backend";
import { aplicarMutacion, puntosTotales } from "./mutaciones";
import { createDebounce } from "../lib/debounce";

export { PUNTOS } from "./mutaciones";

interface Aviso {
  texto: string;
  tono: "ok" | "error" | "info";
}

/** Estados de sincronización expuestos al contexto. */
export type EstadoSync = "ok" | "pendiente" | "sincronizando" | "error";

interface SyncCtx {
  estadoSync: EstadoSync;
  pendientes: number;
  ultimoSync: number | null;
  reintentar: () => void;
}

interface Ctx {
  state: AppState;
  cargado: boolean;
  capacidades: Capacidades;
  guardando: boolean;
  aviso: Aviso | null;
  errorCarga: string | null;
  sync: SyncCtx;
  recargar: () => Promise<void>;
  limpiarAviso: () => void;
  guardarVehiculo: (patch: Partial<Vehiculo>) => void;
  registrarMantenimiento: (m: Omit<Mantenimiento, "id" | "vehiculoId">) => void;
  actualizarMantenimiento: (id: ID, patch: Partial<Mantenimiento>) => void;
  borrarMantenimiento: (id: ID) => void;
  guardarDocumento: (d: Documento) => void;
  borrarDocumento: (id: ID) => void;
  guardarComponente: (c: Componente) => void;
  borrarComponente: (id: ID) => void;
  guardarAlerta: (a: Alerta) => void;
  borrarAlerta: (id: ID) => void;
  guardarTaller: (t: Taller) => void;
  borrarTaller: (id: ID) => void;
  guardarOrden: (o: OrdenServicio) => void;
  borrarOrden: (id: ID) => void;
  guardarTarea: (t: Tarea) => void;
  borrarTarea: (id: ID) => void;
  guardarRecurso: (r: Recurso) => void;
  borrarRecurso: (id: ID) => void;
  guardarViaje: (v: Viaje) => void;
  borrarViaje: (id: ID) => void;
  inicializarTareas: (lista: Tarea[]) => void;
  reiniciarTareas: (lista: Tarea[]) => void;
  guardarAjustes: (patch: Partial<Ajustes>) => void;
  sumarPuntos: (motivo: string, puntos: number) => void;
  completarOnboarding: (datos: {
    vehiculo: Vehiculo;
    componentes: Componente[];
    documentos: Documento[];
    ajustes: Partial<Ajustes>;
  }) => void;
  cargarDemo: () => void;
  reiniciar: () => void;
  importar: (json: string) => boolean;
  exportar: () => string;
  totalPuntos: number;
}

const AppCtx = createContext<Ctx | null>(null);

const INTERVALO_SYNC_MS = 15_000;
const DEBOUNCE_MS = 2_000;

/** Cola en memoria de mutaciones pendientes de sync con el backend. */
interface MutacionPendiente {
  accion: string;
  datos: unknown;
  estado: AppState;
}

export function AppProvider({ children, backendInicial, etiqueta }: {
  children: React.ReactNode;
  backendInicial?: Backend;
  /** Texto del enlace (p. ej. "snapshot 2026-11-21"); hoy solo documenta el origen. */
  etiqueta?: string;
}) {
  void etiqueta;
  const backendRef = useRef<Backend | null>(null);
  if (!backendRef.current) backendRef.current = backendInicial ?? crearBackend();
  const backend = backendRef.current;

  const [state, setState] = useState<AppState>(estadoInicial);
  const [cargado, setCargado] = useState(false);
  const [guardando, setGuardando] = useState(0);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // --- Estado de sincronización ---
  const [estadoSync, setEstadoSync] = useState<EstadoSync>("ok");
  const [ultimoSync, setUltimoSync] = useState<number | null>(null);

  const stateRef = useRef(state);
  const tokenRef = useRef("");
  const guardandoRef = useRef(0);

  // Cola en memoria de mutaciones pendientes
  const colaRef = useRef<MutacionPendiente[]>([]);

  // Debounce para coalescer mutaciones rápidas
  const debounceRef = useRef(createDebounce((_val: unknown) => {
    // Se ejecuta cuando el debounce expira: envía el estado actual al backend
    void enviarAlBackend();
  }, DEBOUNCE_MS));

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const mostrarAviso = useCallback((texto: string, tono: Aviso["tono"] = "info") => {
    setAviso({ texto, tono });
    window.setTimeout(() => setAviso(null), 6_000);
  }, []);

  /* ---------------- Carga inicial ---------------- */
  useEffect(() => {
    let vivo = true;
    void backend
      .cargar()
      .then((snap) => {
        if (!vivo) return;
        setState(migrar(snap.estado));
        tokenRef.current = snap.token;
        setErrorCarga(null);
        setCargado(true);
        setUltimoSync(Date.now());
      })
      .catch((e: Error) => {
        if (!vivo) return;
        setCargado(true);
        setErrorCarga(e.message);
      });
    return () => {
      vivo = false;
    };
  }, [backend, mostrarAviso]);

  /* ---------------- Persistencia optimista ---------------- */

  /**
   * Envía el estado actual al backend.  Si falla, el cambio local se conserva
   * y el estado pasa a 'error' para que el usuario pueda reintentar.
   */
  const enviarAlBackend = useCallback(async () => {
    const actual = stateRef.current;
    const token = tokenRef.current;

    // Si no hay cambios pendientes, no hacer nada
    if (colaRef.current.length === 0) return;

    setGuardando(1);
    setEstadoSync("sincronizando");

    try {
      let r = await backend.guardar(actual, token);

      // La hoja cambió: recargar y reaplicar la última mutación pendiente
      if (!r.ok && r.estado) {
        const pendientes = colaRef.current;
        colaRef.current = [];

        // Recargar estado remoto y reaplicar todas las mutaciones pendientes
        let reintento = migrar(r.estado);
        for (const m of pendientes) {
          reintento = aplicarMutacion(reintento, m.accion, m.datos);
        }

        const r2 = await backend.guardar(reintento, r.token);
        if (r2.ok) {
          setState(reintento);
          stateRef.current = reintento;
          tokenRef.current = r2.token;
          setEstadoSync("ok");
          setUltimoSync(Date.now());
          mostrarAviso("La hoja había cambiado: se recargó y se guardó tu cambio.", "ok");
        } else {
          // Error al reintentar: conservar cambios locales
          setState(migrar(r.estado));
          stateRef.current = migrar(r.estado);
          tokenRef.current = r.token;
          setEstadoSync("error");
          mostrarAviso("No se pudo guardar porque la hoja cambió. Inténtalo otra vez.", "error");
        }
        setGuardando(0);
        return;
      }

      if (r.ok) {
        tokenRef.current = r.token;
        colaRef.current = [];
        setEstadoSync("ok");
        setUltimoSync(Date.now());
      } else {
        // Backend rechazó pero no por conflicto: error
        setEstadoSync("error");
        mostrarAviso("No se pudo guardar el cambio.", "error");
      }
    } catch (e) {
      const msg = (e as Error).message;
      if ((e as Error).name === "StorageFullError") {
        setAviso({ texto: msg, tono: "error" });
      } else {
        mostrarAviso(`Error al guardar: ${msg}`, "error");
      }
      // Conservar cambios locales — cola se mantiene para reintento
      setEstadoSync("error");
    } finally {
      setGuardando(0);
    }
  }, [backend, mostrarAviso]);

  const mutar = useCallback(
    (accion: string, datos?: unknown) => {
      const base = stateRef.current;
      const nuevo = aplicarMutacion(base, accion, datos);
      if (nuevo === base) return;

      // 1. Aplicar inmediatamente al estado local (optimistic UI)
      stateRef.current = nuevo;
      setState(nuevo);

      // 2. Registrar en la cola de pendientes
      colaRef.current.push({ accion, datos, estado: nuevo });

      // 3. Actualizar estado de sync
      setEstadoSync((prev) => (prev === "error" ? "pendiente" : "pendiente"));

      // 4. Programar envío al backend con debounce (coalescing)
      debounceRef.current.schedule(nuevo);
    },
    [],
  );

  /** Reintento manual: envía inmediatamente sin esperar al debounce. */
  const reintentar = useCallback(() => {
    debounceRef.current.flush();
  }, []);

  /* ---------------- Modo solo lectura (datos traídos por el enlace) ---------------- */
  const soloLectura = backend.capacidades.soloLectura === true;
  const mutarSeguro = useCallback(
    (accion: string, datos?: unknown) => {
      if (soloLectura) {
        mostrarAviso("Vista de solo lectura: este enlace no guarda cambios.", "info");
        return;
      }
      mutar(accion, datos);
    },
    [soloLectura, mutar, mostrarAviso],
  );

  /* ---------------- Reintento automático al volver online ---------------- */
  useEffect(() => {
    const onOnline = () => {
      if (estadoSync === "error" || colaRef.current.length > 0) {
        void enviarAlBackend();
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [enviarAlBackend, estadoSync]);

  /* ---------------- Sincronización con la hoja ---------------- */
  useEffect(() => {
    if (!cargado || backend.capacidades.backend !== "gas") return;
    let vivo = true;
    let enCurso = false;

    const sincronizar = async () => {
      if (!vivo || enCurso || guardandoRef.current > 0) return;
      enCurso = true;
      try {
        const snap = await backend.cargar();
        if (!vivo) return;
        if (snap.token !== tokenRef.current) {
          setState(migrar(snap.estado));
          stateRef.current = migrar(snap.estado);
          tokenRef.current = snap.token;
          setUltimoSync(Date.now());
          mostrarAviso("Actualizado desde la hoja de cálculo.", "ok");
        }
      } catch {
        /* se reintenta en el próximo ciclo */
      } finally {
        enCurso = false;
      }
    };

    const timer = window.setInterval(() => {
      if (!document.hidden) void sincronizar();
    }, INTERVALO_SYNC_MS);

    const alVolver = () => {
      if (!document.hidden) void sincronizar();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      vivo = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargado, backend, mostrarAviso]);

  /* ---------------- Limpieza al desmontar ---------------- */
  useEffect(() => {
    return () => {
      debounceRef.current.cancel();
    };
  }, []);

  /* ---------------- Tema ---------------- */
  useEffect(() => {
    const raiz = document.documentElement;
    const aplicar = () => {
      const oscuro =
        state.ajustes.tema === "oscuro" ||
        (state.ajustes.tema === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      raiz.classList.toggle("dark", oscuro);
      raiz.style.colorScheme = oscuro ? "dark" : "light";
    };
    aplicar();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, [state.ajustes.tema]);

  const valor = useMemo<Ctx>(
    () => ({
      state,
      cargado,
      capacidades: backend.capacidades,
      guardando: guardando > 0,
      aviso,
      errorCarga,
      sync: {
        estadoSync,
        pendientes: colaRef.current.length,
        ultimoSync,
        reintentar,
      },
      recargar: async () => {
        try {
          const snap = await backend.cargar();
          setState(migrar(snap.estado));
          stateRef.current = migrar(snap.estado);
          tokenRef.current = snap.token;
          setErrorCarga(null);
          setUltimoSync(Date.now());
          setEstadoSync("ok");
          mostrarAviso("Datos actualizados.", "ok");
        } catch (e) {
          setErrorCarga((e as Error).message);
          mostrarAviso(`No se pudo leer la hoja: ${(e as Error).message}`, "error");
        }
      },
      limpiarAviso: () => setAviso(null),
      guardarVehiculo: (patch) => mutarSeguro("vehiculo", patch),
      registrarMantenimiento: (m) => mutarSeguro("mantenimiento:crear", m),
      actualizarMantenimiento: (id, patch) => mutarSeguro("mantenimiento:actualizar", { id, patch }),
      borrarMantenimiento: (id) => mutarSeguro("mantenimiento:borrar", id),
      guardarDocumento: (d) => mutarSeguro("documento:guardar", d),
      borrarDocumento: (id) => mutarSeguro("documento:borrar", id),
      guardarComponente: (c) => mutarSeguro("componente:guardar", c),
      borrarComponente: (id) => mutarSeguro("componente:borrar", id),
      guardarAlerta: (a) => mutarSeguro("alerta:guardar", a),
      borrarAlerta: (id) => mutarSeguro("alerta:borrar", id),
      guardarTaller: (t) => mutarSeguro("taller:guardar", t),
      borrarTaller: (id) => mutarSeguro("taller:borrar", id),
      guardarOrden: (o) => mutarSeguro("orden:guardar", o),
      borrarOrden: (id) => mutarSeguro("orden:borrar", id),
      guardarTarea: (t) => mutarSeguro("tarea:guardar", t),
      borrarTarea: (id) => mutarSeguro("tarea:borrar", id),
      guardarRecurso: (r) => mutarSeguro("recurso:guardar", r),
      borrarRecurso: (id) => mutarSeguro("recurso:borrar", id),
      guardarViaje: (v) => mutarSeguro("viaje:guardar", v),
      borrarViaje: (id) => mutarSeguro("viaje:borrar", id),
      inicializarTareas: (lista) => mutarSeguro("tareas:inicializar", lista),
      reiniciarTareas: (lista) => mutarSeguro("tareas:reiniciar", lista),
      guardarAjustes: (patch) => mutarSeguro("ajustes", patch),
      sumarPuntos: (motivo, puntos) => mutarSeguro("puntos", { motivo, puntos }),
      completarOnboarding: (datos) => mutarSeguro("onboarding", datos),
      cargarDemo: () => mutarSeguro("reemplazar", { ...estadoDemo(), esDemo: true }),
      reiniciar: () => mutarSeguro("reiniciar"),
      importar: (json: string) => {
        try {
          const data = JSON.parse(json) as AppState;
          if (!data || typeof data !== "object" || !("ajustes" in data)) return false;
          mutarSeguro("reemplazar", data);
          return true;
        } catch {
          return false;
        }
      },
      exportar: () => JSON.stringify(state, null, 2),
      totalPuntos: puntosTotales(state),
    }),
    [state, cargado, backend, guardando, aviso, errorCarga, mutarSeguro, mostrarAviso,
     estadoSync, ultimoSync, reintentar],
  );

  return <AppCtx.Provider value={valor}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}

export type { DatosOnboarding };