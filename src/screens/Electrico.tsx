import { AlertTriangle, Zap } from "lucide-react";
import { CAJAS } from "../data/fusibles";
import { MapaFusibles } from "../components/MapaFusibles";

export function Electrico() {
  const abs = CAJAS.abs;
  const carb = CAJAS.carburada;

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <h1 className="ink text-[1.35rem] font-extrabold tracking-tight">Sistema eléctrico</h1>
        <p className="ink-2 text-[0.8rem]">Mapa de fusibles de la Yamaha XTZ 250</p>
      </div>

      {/* Main fuse — separate card */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "var(--bad-soft)", color: "var(--bad)" }}
          >
            <Zap size={16} />
          </span>
          <h3 className="ink text-[0.92rem] font-bold">Fusible principal</h3>
        </div>

        <div className="space-y-3">
          {/* ABS */}
          <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
            <p className="ink text-[0.82rem] font-semibold">
              ABS: {abs.principal.amperaje} A
            </p>
            <p className="ink-2 text-[0.74rem]">{abs.principal.ubicacion}</p>
            <p className="ink-2 mt-1 text-[0.74rem] leading-relaxed">{abs.principal.nota}</p>
          </div>

          {/* Carburada */}
          <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
            <p className="ink text-[0.82rem] font-semibold">
              Carburada: {carb.principal.amperaje} A
            </p>
            <p className="ink-2 text-[0.74rem]">{carb.principal.ubicacion}</p>
            <p className="ink-2 mt-1 text-[0.74rem] leading-relaxed">{carb.principal.nota}</p>
          </div>
        </div>
      </div>

      {/* Interactive fuse map */}
      <MapaFusibles />

      {/* Warnings card */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "var(--bad-soft)", color: "var(--bad)" }}
          >
            <AlertTriangle size={16} />
          </span>
          <h3 className="ink text-[0.92rem] font-bold">Advertencias</h3>
        </div>

        <ul className="space-y-2.5">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--bad)" }} />
            <p className="ink text-[0.82rem] leading-relaxed">
              <strong>Nunca subas el amperaje</strong> del fusible de repuesto respecto al original.
              El manual advierte que esto puede causar daños graves al sistema eléctrico e incluso
              un incendio.
            </p>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--bad)" }} />
            <p className="ink text-[0.82rem] leading-relaxed">
              <strong>Si un fusible se funde dos veces, no insistas:</strong> hay un cortocircuito
              en el circuito. Lleva la moto a un taller especializado antes de volver a poner un
              fusible nuevo.
            </p>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--warn)" }} />
            <p className="ink text-[0.82rem] leading-relaxed">
              Usa siempre fusibles tipo cuchilla (ATC/ATO) del amperaje correcto. No sustituyas
              con alambre, monedas u otros improvisados.
            </p>
          </li>
        </ul>

        <p className="ink-3 mt-4 text-[0.68rem]">
          Fuente: {abs.fuente}, {abs.fuentePaginas} · {carb.fuente}, {carb.fuentePaginas}
        </p>
      </div>
    </div>
  );
}
