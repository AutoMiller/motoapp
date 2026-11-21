import { useState } from "react";
import { AlertTriangle, Zap } from "lucide-react";
import { CAJAS, type VarianteFusibles } from "../data/fusibles";
import { MapaFusibles } from "../components/MapaFusibles";

export function Electrico() {
  const [variante, setVariante] = useState<VarianteFusibles>("abs");
  const caja = CAJAS[variante];

  return (
    <div className="flex flex-col gap-4">
      {/* Principal de la variante elegida */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "var(--bad-soft)", color: "var(--bad)" }}
          >
            <Zap size={16} />
          </span>
          <h3 className="ink text-[0.92rem] font-bold">Fusible principal</h3>
          <span className="chip ml-auto text-[0.7rem] font-bold" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
            {caja.principal.amperaje} A
          </span>
        </div>

        <p className="ink-2 text-[0.76rem]">{caja.principal.ubicacion}</p>
        <p className="ink-2 mt-1.5 text-[0.76rem] leading-relaxed">{caja.principal.nota}</p>

        <p className="ink-3 mt-2 text-[0.7rem]">
          {caja.etiqueta}
        </p>
      </div>

      {/* Mapa interactivo (con el selector de variante) */}
      <MapaFusibles variante={variante} onVariante={setVariante} />

      {/* Advertencias */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "var(--bad-soft)", color: "var(--bad)" }}
          >
            <AlertTriangle size={16} />
          </span>
          <h3 className="ink text-[0.92rem] font-bold">Antes de tocarlos</h3>
        </div>

        <ul className="space-y-2.5">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--bad)" }} />
            <p className="ink text-[0.82rem] leading-relaxed">
              <strong>Nunca subas el amperaje.</strong> El manual advierte daños graves al sistema
              eléctrico e incluso incendio. Un fusible de más amperaje no «aguanta más»: deja de
              proteger.
            </p>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--bad)" }} />
            <p className="ink text-[0.82rem] leading-relaxed">
              <strong>Si se funde dos veces, no insistas:</strong> hay un cortocircuito. Apaga la
              moto y llévala al taller.
            </p>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--warn)" }} />
            <p className="ink text-[0.82rem] leading-relaxed">
              Solo fusibles de cuchilla (ATC/ATO) del amperaje correcto. Nada de alambre ni papel
              de aluminio.
            </p>
          </li>
        </ul>

        <p className="ink-3 mt-4 text-[0.68rem]">
          Fuente: {caja.fuente}, {caja.fuentePaginas}.
        </p>
      </div>
    </div>
  );
}
