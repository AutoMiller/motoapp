import { TORQUES } from "../data/torques";

/**
 * Tarjeta de torques oficiales — Yamaha XTZ 250 ABS.
 *
 * Lee el array TORQUES desde ../data/torques (se moverá a ficha.ts
 * cuando exista el export correspondiente en ese módulo).
 * Sin props obligatorias.
 */
export function TarjetaTorques() {
  return (
    <div className="card-flat p-4">
      <h3 className="h-sec ink mb-1">Torques oficiales</h3>
      <p className="ink-3 text-xs mb-3">Valores del manual del propietario</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="ink-2 pb-2 pt-1 text-left text-xs font-semibold">
                Elemento
              </th>
              <th className="ink-2 pb-2 pt-1 text-right text-xs font-semibold">
                N·m
              </th>
              <th className="ink-2 pb-2 pt-1 text-right text-xs font-semibold">
                kgf·m
              </th>
            </tr>
          </thead>
          <tbody>
            {TORQUES.map((t, i) => (
              <tr
                key={t.elemento}
                className={
                  i < TORQUES.length - 1 ? "border-b border-[var(--line)]" : ""
                }
              >
                <td className="ink py-2.5 pr-3">{t.elemento}</td>
                <td className="nums ink py-2.5 text-right font-semibold">
                  {t.nm}
                </td>
                <td className="nums ink-2 py-2.5 text-right">{t.kgfm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
