import type { AppState } from "../types";

const DB_NAME = "motoapp";
const DB_VERSION = 1;
const STORE = "kv";
const KEY = "estado-v1";

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cargarEstado(): Promise<AppState | null> {
  try {
    const db = await abrirDB();
    return await new Promise<AppState | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as AppState) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as AppState) : null;
    } catch {
      return null;
    }
  }
}

/** Lanza si el almacenamiento del navegador está lleno. */
export class StorageFullError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageFullError";
  }
}

export async function escribirEstado(state: AppState): Promise<void> {
  try {
    const db = await abrirDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(state, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err: any) {
    const isQuota =
      err?.name === "QuotaExceededError" ||
      err?.code === 22 || // DOMException QUOTA_EXCEEDED_ERR
      err?.name === "NS_ERROR_DOM_QUOTA_REACHED"; // Firefox
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      if (isQuota) {
        throw new StorageFullError(
          "No se pudo guardar: almacenamiento lleno. Exporta un respaldo y borra fotos."
        );
      }
      // Otro error de escritura — también lo propagamos para no fallar en silencio
      throw new StorageFullError(
        "No se pudo guardar los datos en este navegador. Exporta un respaldo como precaución."
      );
    }
  }
}

export async function borrarEstado(): Promise<void> {
  try {
    const db = await abrirDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    localStorage.removeItem(KEY);
  }
}
