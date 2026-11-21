/* MotoApp · service worker manual (sin dependencias de build).
 *
 * Estrategia:
 *   - Instalación: precarga el cascarón (`./` y `./index.html`), el manifest y
 *     los iconos. Como los nombres de los assets traen hash, después de bajar
 *     el index se leen sus <script>/<link> y se cachean tal cual: así la
 *     primera visita ya deja la app completa en caché.
 *   - Navegación: network-first con timeout; si no hay red (o tarda), sirve el
 *     index cacheado. Online siempre ve la versión nueva.
 *   - Assets del mismo origen: cache-first + revalidación en segundo plano.
 *   - Peticiones a otro origen (Apps Script, Drive, imágenes externas) NO se
 *     cachean: los datos viven en el backend y en IndexedDB, nunca aquí.
 *
 * Al cambiar el cascarón hay que subir VERSION para tirar las cachés viejas.
 */
const VERSION = "v1";
const CACHE = `motoapp-${VERSION}`;

/** Base de despliegue: /motoapp/ en GitHub Pages, / en local. */
const BASE = new URL("./", self.location.href).href;

const CASCARON = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
];

/** Navegación: si la red tarda más que esto, servimos lo cacheado. */
const TIMEOUT_MS = 4000;

/** Referencias del index (assets con hash que no se conocen al escribir el SW). */
const RE_ASSET = /(?:src|href)="([^"#?]+\.(?:js|mjs|css|woff2?|png|svg|webp|jpg|jpeg|ico))"/gi;

function esDelOrigen(url) {
  return url.origin === self.location.origin;
}

function conTimeout(promesa, ms) {
  return new Promise((resolver, rechazar) => {
    const reloj = setTimeout(() => rechazar(new Error("timeout")), ms);
    promesa.then(
      (v) => {
        clearTimeout(reloj);
        resolver(v);
      },
      (e) => {
        clearTimeout(reloj);
        rechazar(e);
      },
    );
  });
}

/** Guarda una copia sin romper la respuesta que se entrega al cliente. */
async function guardar(cache, clave, respuesta) {
  try {
    if (respuesta && respuesta.ok) await cache.put(clave, respuesta.clone());
  } catch {
    /* cuota llena o respuesta opaca: la app sigue funcionando sin caché */
  }
}

async function precargar() {
  const cache = await caches.open(CACHE);

  await Promise.all(
    CASCARON.map(async (url) => {
      try {
        const respuesta = await fetch(new Request(url, { cache: "reload" }));
        await guardar(cache, url, respuesta);
      } catch {
        /* un icono que falte no debe tumbar la instalación */
      }
    }),
  );

  // Los assets referenciados por el index (hasheados) no son predecibles en build.
  try {
    const index = (await cache.match("./index.html")) || (await cache.match("./"));
    if (!index) return;
    const html = await index.clone().text();
    const urls = new Set();
    for (const [, ruta] of html.matchAll(RE_ASSET)) {
      try {
        const url = new URL(ruta, self.location.href);
        if (esDelOrigen(url)) urls.add(url.href);
      } catch {
        /* ruta rara: se ignora */
      }
    }
    await Promise.all(
      [...urls].map(async (url) => {
        try {
          const respuesta = await fetch(new Request(url, { cache: "reload" }));
          await guardar(cache, url, respuesta);
        } catch {
          /* sin red a mitad de instalación: se cacheará al vuelo */
        }
      }),
    );
  } catch {
    /* sin HTML parseable: el runtime caching cubre el resto */
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    precargar().then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres.filter((n) => n.startsWith("motoapp-") && n !== CACHE).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

/** network-first: red → caché de la misma URL → index (cascarón). */
async function navegar(peticion) {
  const cache = await caches.open(CACHE);
  try {
    const respuesta = await conTimeout(fetch(peticion), TIMEOUT_MS);
    if (respuesta && respuesta.ok) await guardar(cache, peticion, respuesta);
    return respuesta;
  } catch {
    return (
      (await cache.match(peticion)) ||
      (await cache.match("./", { ignoreSearch: true })) ||
      (await cache.match(`${BASE}index.html`, { ignoreSearch: true })) ||
      new Response(
        "<!doctype html><meta charset=utf-8><title>MotoApp</title>" +
          '<body style="font:16px system-ui;padding:32px;background:#0a0e13;color:#e9eef6">' +
          "<h1>Sin conexión</h1><p>Abre MotoApp una vez con red para dejarla guardada.</p>",
        { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
      )
    );
  }
}

/** cache-first con revalidación: abre al instante y se actualiza sola. */
async function recurso(peticion) {
  const cache = await caches.open(CACHE);
  const cacheado = await cache.match(peticion);
  if (cacheado) {
    fetch(peticion)
      .then((respuesta) => guardar(cache, peticion, respuesta))
      .catch(() => {});
    return cacheado;
  }
  try {
    const respuesta = await fetch(peticion);
    await guardar(cache, peticion, respuesta);
    return respuesta;
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const peticion = event.request;
  if (peticion.method !== "GET") return;

  let url;
  try {
    url = new URL(peticion.url);
  } catch {
    return;
  }
  if (!esDelOrigen(url) || !url.protocol.startsWith("http")) return;
  if (url.pathname.endsWith("/sw.js")) return;

  if (peticion.mode === "navigate") {
    event.respondWith(navegar(peticion));
    return;
  }
  event.respondWith(recurso(peticion));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
