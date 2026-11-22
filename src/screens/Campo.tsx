import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, Key, Wrench, Link2, Gauge, ShieldAlert } from "lucide-react";
import { Chip } from "../components/ui";
import {
  LLAVES,
  REPARACIONES_DIY,
  PROTOCOLO_CADENA,
  PRESIONES_TERRENO,
  PROTOCOLO_ROBO,
} from "../data/campo";

/* ------------------------------------------------------------------ */
/*  Acordeón simple sin dependencias externas                          */
/* ------------------------------------------------------------------ */

function AcordeonGrupo({
  titulo,
  icono,
  abierto,
  onToggle,
  children,
}: {
  titulo: string;
  icono: React.ReactNode;
  abierto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
        onClick={onToggle}
        aria-expanded={abierto}
      >
        <span className="shrink-0 text-[var(--brand)]">{icono}</span>
        <span className="ink flex-1 text-[0.92rem] font-semibold">{titulo}</span>
        {abierto ? <ChevronUp size={18} className="ink-2" /> : <ChevronDown size={18} className="ink-2" />}
      </button>
      {abierto && <div className="border-t border-[var(--line)] px-4 py-3">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chips de temporizador                                              */
/* ------------------------------------------------------------------ */

function ChipTiempo({ minutos, etiqueta }: { minutos: number; etiqueta: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warn-soft)] px-2.5 py-0.5 text-[0.72rem] font-bold text-[var(--warn)]">
      <Clock size={12} />
      {minutos} min — {etiqueta}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Pantalla Campo                                                      */
/* ------------------------------------------------------------------ */

export function Campo() {
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({
    llaves: true,
  });

  const toggle = (key: string) =>
    setAbiertos((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">Manual de Campo</h1>
      <p className="ink-2 mb-5 text-sm">Trail.Hacker OS — referencia rápida para el dueño</p>

      <div className="flex flex-col gap-3">
        {/* 1. Llaves y Copas */}
        <AcordeonGrupo
          titulo="Mapa de Llaves y Copas"
          icono={<Key size={18} />}
          abierto={!!abiertos.llaves}
          onToggle={() => toggle("llaves")}
        >
          <div className="flex flex-col gap-2">
            {LLAVES.map((l, i) => (
              <div key={i} className="rounded-xl bg-[var(--surface-2)] p-3">
                <p className="ink text-[0.82rem] font-semibold">{l.zona}</p>
                <p className="ink-2 mt-0.5 text-[0.78rem]">{l.herramienta}</p>
              </div>
            ))}
          </div>
        </AcordeonGrupo>

        {/* 2. Reparaciones DIY */}
        <AcordeonGrupo
          titulo="Reparaciones DIY"
          icono={<Wrench size={18} />}
          abierto={!!abiertos.diy}
          onToggle={() => toggle("diy")}
        >
          <ul className="flex flex-col gap-2">
            {REPARACIONES_DIY.map((r, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-[var(--surface-2)] p-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ok-soft)] text-[0.65rem] font-bold text-[var(--ok)]">
                  {i + 1}
                </span>
                <span className="ink-2 text-[0.82rem] leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </AcordeonGrupo>

        {/* 3. Protocolo de Cadena */}
        <AcordeonGrupo
          titulo="Protocolo de Cadena (14 pasos)"
          icono={<Link2 size={18} />}
          abierto={!!abiertos.cadena}
          onToggle={() => toggle("cadena")}
        >
          <div className="flex flex-col gap-3">
            {/* Nota de tiempos */}
            <div className="rounded-xl bg-[var(--warn-soft)] p-3">
              <p className="ink-2 text-[0.78rem] leading-relaxed">{PROTOCOLO_CADENA.notaTiempos}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <ChipTiempo minutos={3} etiqueta="desengrasante" />
                <ChipTiempo minutos={30} etiqueta="reposo tras lubricar" />
              </div>
            </div>

            {/* Implementos */}
            <div>
              <p className="ink mb-1.5 text-[0.78rem] font-semibold uppercase tracking-wide">Implementos</p>
              <div className="flex flex-wrap gap-1.5">
                {PROTOCOLO_CADENA.implementos.map((imp, i) => (
                  <Chip key={i} tono="info">{imp}</Chip>
                ))}
              </div>
            </div>

            {/* Pasos */}
            <ol className="flex flex-col gap-2">
              {PROTOCOLO_CADENA.pasos.map((p) => (
                <li key={p.n} className="flex items-start gap-2.5 rounded-xl bg-[var(--surface-2)] p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[0.7rem] font-bold text-[var(--brand)]">
                    {p.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="ink text-[0.82rem] font-semibold">{p.titulo}</p>
                    <p className="ink-2 mt-0.5 text-[0.78rem] leading-relaxed">{p.detalle}</p>
                    {p.minutos && (
                      <div className="mt-1.5">
                        <ChipTiempo minutos={p.minutos} etiqueta={p.n === 4 ? "dejar actuar" : "reposo antes de rodar"} />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </AcordeonGrupo>

        {/* 4. Presiones de Llantas */}
        <AcordeonGrupo
          titulo="Presiones de Llantas Off-Road"
          icono={<Gauge size={18} />}
          abierto={!!abiertos.presiones}
          onToggle={() => toggle("presiones")}
        >
          <p className="ink-2 mb-2 text-[0.78rem]">Referencia para piloto ~60 kg</p>
          <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-left text-[0.82rem]">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                  <th className="px-3 py-2 font-semibold">Terreno</th>
                  <th className="px-3 py-2 font-semibold">Delantera</th>
                  <th className="px-3 py-2 font-semibold">Trasera</th>
                  <th className="px-3 py-2 font-semibold">Nota</th>
                </tr>
              </thead>
              <tbody>
                {PRESIONES_TERRENO.map((p, i) => (
                  <tr key={i} className="border-b border-[var(--line)] last:border-b-0">
                    <td className="ink px-3 py-2 font-medium">{p.terreno}</td>
                    <td className="ink-2 px-3 py-2">{p.delantera}</td>
                    <td className="ink-2 px-3 py-2">{p.trasera}</td>
                    <td className="ink-3 px-3 py-2 text-[0.78rem]">{p.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AcordeonGrupo>

        {/* 5. Protocolo de Robo */}
        <AcordeonGrupo
          titulo="Protocolo de Emergencia — Robo"
          icono={<ShieldAlert size={18} />}
          abierto={!!abiertos.robo}
          onToggle={() => toggle("robo")}
        >
          <ol className="flex flex-col gap-2">
            {PROTOCOLO_ROBO.pasos.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl bg-[var(--bad-soft)] p-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bad)] text-[0.7rem] font-bold text-white">
                  {i + 1}
                </span>
                <span className="ink-2 text-[0.82rem] leading-relaxed">{p}</span>
              </li>
            ))}
          </ol>
        </AcordeonGrupo>
      </div>
    </div>
  );
}
