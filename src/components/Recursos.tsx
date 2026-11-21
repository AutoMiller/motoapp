import { useState } from "react";
import { BookOpen, ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import type { Recurso } from "../types";
import { useApp } from "../store/AppStore";
import { ENLACES_UTILES } from "../data/ficha";
import { GUIAS, guiaPorId, type Guia } from "../data/guias";
import { Modal } from "./ui";

const ETIQUETAS: { v: Recurso["etiqueta"]; label: string }[] = [
  { v: "manual", label: "Manual" },
  { v: "tutorial", label: "Tutorial" },
  { v: "repuesto", label: "Repuesto" },
  { v: "video", label: "Video" },
  { v: "otro", label: "Otro" },
];

function normalizarUrl(v: string): string {
  const t = v.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Manuales, enlaces y guías internas (páginas que se abren dentro de la app). */
export function Recursos() {
  const { state, capacidades, guardarRecurso, borrarRecurso } = useApp();
  const soloLectura = capacidades.soloLectura === true;
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [nota, setNota] = useState("");
  const [etiqueta, setEtiqueta] = useState<Recurso["etiqueta"]>("manual");
  const [modo, setModo] = useState<"url" | "guia">("guia");
  const [guiaId, setGuiaId] = useState<string>(GUIAS[0]?.id ?? "");
  const [abriendo, setAbriendo] = useState<Guia | null>(null);

  const guardar = () => {
    if (modo === "guia") {
      const g = guiaPorId(guiaId);
      if (!g) return;
      guardarRecurso({
        id: `r_${Date.now().toString(36)}`,
        titulo: titulo.trim() || g.titulo,
        url: "",
        nota: nota.trim() || g.resumen,
        etiqueta: "tutorial",
        guia: g.id,
      });
    } else {
      const u = normalizarUrl(url);
      if (!titulo.trim() || !u) return;
      guardarRecurso({
        id: `r_${Date.now().toString(36)}`,
        titulo: titulo.trim(),
        url: u,
        nota: nota.trim() || undefined,
        etiqueta,
      });
    }
    setTitulo("");
    setUrl("");
    setNota("");
    setAbierto(false);
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="ink flex items-center gap-1.5 text-[0.9rem] font-bold">
            <Link2 size={15} /> Manuales y enlaces
          </h3>
          <p className="ink-2 text-xs">Guías de la app y enlaces tuyos, en un solo sitio.</p>
        </div>
        {!soloLectura && (
          <button className="icon-btn" onClick={() => setAbierto((a) => !a)} aria-label="Añadir enlace">
            <Plus size={16} />
          </button>
        )}
      </div>

      {abierto && !soloLectura && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-1.5">
            <button
              onClick={() => setModo("guia")}
              className={`chip ${modo === "guia" ? "chip-brand" : ""}`}
            >
              Página de la app
            </button>
            <button
              onClick={() => setModo("url")}
              className={`chip ${modo === "url" ? "chip-brand" : ""}`}
            >
              Enlace externo
            </button>
          </div>

          {modo === "guia" ? (
            <select className="input" value={guiaId} onChange={(e) => setGuiaId(e.target.value)}>
              {GUIAS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.titulo}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input className="input" placeholder="Título · p. ej. Repuesto original" value={titulo}
                onChange={(e) => setTitulo(e.target.value)} />
              <input className="input" placeholder="https://…" value={url}
                onChange={(e) => setUrl(e.target.value)} />
              <div className="flex flex-wrap gap-1.5">
                {ETIQUETAS.map((t) => (
                  <button key={t.v} onClick={() => setEtiqueta(t.v)}
                    className={`chip ${etiqueta === t.v ? "chip-brand" : ""}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <input className="input" placeholder="Nota (opcional)" value={nota}
            onChange={(e) => setNota(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1 text-xs" onClick={guardar}
              disabled={modo === "url" && (!titulo.trim() || !url.trim())}>
              Guardar
            </button>
            <button className="btn btn-ghost text-xs" onClick={() => setAbierto(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {state.recursos.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {state.recursos.map((r) => {
            const g = r.guia ? guiaPorId(r.guia) : undefined;
            return (
              <li key={r.id} className="flex items-center gap-2 rounded-xl px-2.5 py-2"
                style={{ background: "var(--surface-2)" }}>
                {g ? (
                  <button className="min-w-0 flex-1 text-left" onClick={() => setAbriendo(g)}>
                    <span className="ink flex items-center gap-1.5 truncate text-[0.8rem] font-semibold">
                      <BookOpen size={13} /> {r.titulo}
                    </span>
                    <span className="ink-3 block truncate text-[0.68rem]">{r.nota ?? g.resumen}</span>
                  </button>
                ) : (
                  <a href={r.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                    <span className="ink block truncate text-[0.8rem] font-semibold">{r.titulo}</span>
                    <span className="ink-3 block truncate text-[0.68rem]">
                      {r.etiqueta ? `${r.etiqueta} · ` : ""}{r.nota ?? r.url}
                    </span>
                  </a>
                )}
                {!g && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="icon-btn" aria-label="Abrir">
                    <ExternalLink size={14} />
                  </a>
                )}
                {!soloLectura && (
                  <button className="icon-btn" onClick={() => borrarRecurso(r.id)} aria-label="Borrar">
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ENLACES_UTILES.map((e) => (
          <a key={e.url} href={e.url} target="_blank" rel="noreferrer" className="chip">
            {e.label}
          </a>
        ))}
      </div>

      <Modal open={abriendo !== null} onClose={() => setAbriendo(null)} title={abriendo?.titulo ?? ""}>
        {abriendo && (
          <div className="flex flex-col gap-3">
            <p className="ink-2 text-xs">{abriendo.resumen}</p>
            {abriendo.bloques.map((b) => (
              <div key={b.titulo}>
                <p className="ink text-[0.8rem] font-bold">{b.titulo}</p>
                <ul className="ink-2 mt-1 flex flex-col gap-1 text-[0.75rem] leading-relaxed">
                  {b.items.map((it) => (
                    <li key={it} className="flex gap-1.5">
                      <span style={{ color: "var(--brand)" }}>•</span> {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="ink-3 text-[0.66rem]">Fuente: {abriendo.fuente}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
