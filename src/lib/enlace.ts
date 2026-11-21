import type { AppState } from "../types";

/**
 * Estado por enlace: la app puede abrirse con los datos dentro del fragmento `#`
 * de la URL. El fragmento no se envía nunca al servidor (GitHub Pages no lo ve),
 * así que nada queda publicado ni almacenado.
 *
 * Formato:  #ver      -> (nada) abre normal
 *           #dato=... -> estado comprimido (deflate + base64url) de solo lectura
 */

export interface EstadoEnlazado {
  estado: AppState;
  /** Etiqueta legible del origen, p. ej. "snapshot 2026-11-21" */
  etiqueta?: string;
}

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function inflar(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

async function desinflar(bytes: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate-raw");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(cs);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/** Lee `#dato=` / `#d=<...>` del hash. Devuelve null si no hay enlace de datos. */
export async function leerEstadoDeLaUrl(hash: string = window.location.hash): Promise<EstadoEnlazado | null> {
  const limpio = hash.replace(/^#\/?/, "");
  const m = /^(?:dato|d)=([A-Za-z0-9_-]+)/.exec(limpio);
  if (!m) return null;
  const bytes = b64urlDecode(m[1]);
  const plano = await inflar(bytes);
  const json = JSON.parse(new TextDecoder().decode(plano)) as AppState & { _etiqueta?: string };
  const { _etiqueta, ...estado } = json as AppState & { _etiqueta?: string };
  return { estado: estado as AppState, etiqueta: _etiqueta };
}

/** Comprime un estado y devuelve el valor listo para `#dato=`. */
export async function estadoAHash(estado: AppState, etiqueta?: string): Promise<string> {
  const json = JSON.stringify({ ...estado, _etiqueta: etiqueta });
  const plano = new TextEncoder().encode(json);
  const comp = await desinflar(plano);
  return b64urlEncode(comp);
}

/** URL completa para abrir la app en solo lectura con este estado. */
export async function urlConEstado(estado: AppState, base: string, etiqueta?: string): Promise<string> {
  const hash = await estadoAHash(estado, etiqueta);
  return `${base.replace(/#.*$/, "")}#dato=${hash}`;
}
