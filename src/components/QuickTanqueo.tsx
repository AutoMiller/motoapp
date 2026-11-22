import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Fuel, X } from "lucide-react";
import { useApp } from "../store/AppStore";
import { isoDate, money, num } from "../lib/format";
import { aNumero, findLastFullTank, calcCostPerKm } from "../lib/tanqueo";

/* ------------------------------------------------------------------ */
/*  QuickTanqueo – bottom sheet de tanqueo rápido (< 10 s)             */
/* ------------------------------------------------------------------ */

export function QuickTanqueo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, registrarMantenimiento } = useApp();
  const v = state.vehiculo;
  const kmActual = v?.kmActual ?? 0;

  // Campos del formulario
  const [fecha, setFecha] = useState(isoDate());
  const [odometro, setOdometro] = useState("");
  const [costo, setCosto] = useState("");
  const [galones, setGalones] = useState("");
  const [precioGalon, setPrecioGalon] = useState("");
  const [tanqueLleno, setTanqueLleno] = useState(true);

  // Toast propio
  const [toast, setToast] = useState<string | null>(null);

  // Track qué campo está "en foco" para no sobrescribirlo al calcular
  const activeField = useRef<"costo" | "galones" | "precioGalon" | "">("");

  // Refs para focus
  const odometroRef = useRef<HTMLInputElement>(null);

  /* ---- Reset al abrir ---- */
  useEffect(() => {
    if (!open) return;
    setFecha(isoDate());
    setOdometro(v ? String(v.kmActual) : "");
    setCosto("");
    setGalones("");
    setPrecioGalon("");
    setTanqueLleno(true);
    activeField.current = "";
    setToast(null);
    // Focus al primer campo
    const t = window.setTimeout(() => odometroRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open, v]);

  /* ---- Cerrar con Escape ---- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* ---- Focus trap básico ---- */
  useEffect(() => {
    if (!open) return;
    const el = document.querySelector<HTMLElement>("[data-qt-sheet]");
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    el.addEventListener("keydown", trap);
    return () => el.removeEventListener("keydown", trap);
  }, [open]);

  /* ---- Cálculo automático del tercer campo ---- */
  // Si dos de {costo, galones, precioGalon} tienen valor, calcula el tercero
  const calcCosto = useMemo(() => {
    const g = aNumero(galones);
    const p = aNumero(precioGalon);
    if (g > 0 && p > 0) return Math.round(g * p);
    return null;
  }, [galones, precioGalon]);

  const calcGalones = useMemo(() => {
    const c = aNumero(costo);
    const p = aNumero(precioGalon);
    if (c > 0 && p > 0) return +(c / p).toFixed(2);
    return null;
  }, [costo, precioGalon]);

  const calcPrecioGalon = useMemo(() => {
    const c = aNumero(costo);
    const g = aNumero(galones);
    if (c > 0 && g > 0) return +(c / g).toFixed(0);
    return null;
  }, [costo, galones]);

  /* ---- Validaciones suaves ---- */
  const odometroNum = aNumero(odometro);
  const galonesNum = aNumero(galones);
  const costoNum = aNumero(costo) ?? (calcCosto ?? 0);
  const precioNum = aNumero(precioGalon) ?? (calcPrecioGalon ?? 0);

  const warnings: string[] = [];
  if (odometroNum > 0 && odometroNum < kmActual) {
    warnings.push(`Queda por debajo del odómetro actual (${num(kmActual)} km)`);
  }
  if (odometroNum > 0 && kmActual > 0) {
    const salto = odometroNum - kmActual;
    if (salto > 1_000) {
      warnings.push(`Salto de ${num(salto)} km, ¿está bien?`);
    }
  }

  // Botón desactivado si falta odómetro, galones o costo
  const canSave = odometroNum > 0 && galonesNum > 0 && costoNum > 0;

  /* ---- Guardar ---- */
  const handleSave = useCallback(() => {
    const kmNum = Math.round(odometroNum);
    const gal = galonesNum;
    const cst = Math.round(costoNum);
    const ppg = precioNum;

    registrarMantenimiento({
      fecha,
      km: kmNum,
      categoria: "combustible",
      titulo: "Tanqueo de combustible",
      tipo: "preventivo",
      costo: cst,
      tanqueo: {
        galones: gal,
        precioGalon: ppg,
        odometro: kmNum,
        tanqueLleno,
      },
    });

    // Calcular rendimiento para el toast
    if (tanqueLleno) {
      const prev = findLastFullTank(state.mantenimientos, kmNum);
      if (prev) {
        const kmDiff = kmNum - prev.km;
        const kmPerGal = kmDiff / gal;
        const costPerKm = calcCostPerKm(cst, kmDiff);
        setToast(
          `Guardado · ${Math.round(kmPerGal)} km/gal · ${money(costPerKm ?? 0)}/km`,
        );
      } else {
        setToast("Guardado");
      }
    } else {
      setToast("Guardado");
    }

    onClose();
    // Auto-cerrar toast a los 4 s
    const t = window.setTimeout(() => setToast(null), 4_000);
    return () => window.clearTimeout(t);
  }, [
    fecha, odometroNum, galonesNum, costoNum, precioNum, tanqueLleno,
    registrarMantenimiento, state.mantenimientos, onClose,
  ]);

  /* ---- Handlers con tracking de campo activo ---- */
  const onCostoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    activeField.current = "costo";
    setCosto(e.target.value);
  };
  const onGalonesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    activeField.current = "galones";
    setGalones(e.target.value);
  };
  const onPrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    activeField.current = "precioGalon";
    setPrecioGalon(e.target.value);
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className="fixed inset-0 z-[68] transition-opacity"
        style={{ background: "rgb(0 0 0 / .45)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        data-qt-sheet
        role="dialog"
        aria-modal="true"
        aria-label="Tanqueo rápido"
        className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
        }}
      >
        <div className="mx-auto flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl shadow-2xl" style={{ background: "var(--surface)" }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Fuel size={18} style={{ color: "var(--brand)" }} />
              <h2 className="ink text-[1rem] font-bold">Tanqueo rápido</h2>
            </div>
            <button
              className="icon-btn"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={17} />
            </button>
          </div>

          {/* Campos */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            {/* Fecha */}
            <label className="field">
              <span className="label">Fecha</span>
              <input
                className="input"
                type="date"
                value={fecha}
                max={isoDate()}
                onChange={(e) => setFecha(e.target.value)}
              />
            </label>

            {/* Odómetro */}
            <label className="field">
              <span className="label">Odómetro (km)</span>
              <input
                ref={odometroRef}
                className="input nums"
                inputMode="numeric"
                placeholder={String(kmActual)}
                value={odometro}
                onChange={(e) => setOdometro(e.target.value)}
              />
              {v && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="ink-3 text-[0.7rem]">
                    Anterior: {num(kmActual)} km
                  </span>
                  {odometroNum === 0 && (
                    <button
                      className="btn btn-soft text-[0.65rem] px-2 py-0.5"
                      onClick={() => setOdometro(String(kmActual))}
                    >
                      usar el mismo
                    </button>
                  )}
                </div>
              )}
            </label>

            {/* Costo total */}
            <label className="field">
              <span className="label">Costo total</span>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 ink-2 text-sm font-semibold"
                  style={{ pointerEvents: "none" }}
                >
                  $
                </span>
                <input
                  className="input nums"
                  inputMode="numeric"
                  style={{ paddingLeft: "1.5rem" }}
                  placeholder="0"
                  value={costo}
                  onChange={onCostoChange}
                />
              </div>
              {calcCosto !== null && activeField.current !== "costo" && (
                <span className="ink-3 mt-0.5 text-[0.7rem]">
                  Calculado: {money(calcCosto)}
                </span>
              )}
            </label>

            {/* Galones */}
            <label className="field">
              <span className="label">Galones</span>
              <input
                className="input nums"
                inputMode="decimal"
                placeholder="3.1"
                value={galones}
                onChange={onGalonesChange}
              />
              {calcGalones !== null && activeField.current !== "galones" && (
                <span className="ink-3 mt-0.5 text-[0.7rem]">
                  Calculado: {calcGalones} gal
                </span>
              )}
            </label>

            {/* Precio/galón */}
            <label className="field">
              <span className="label">Precio / galón</span>
              <input
                className="input nums"
                inputMode="decimal"
                placeholder="20000"
                value={precioGalon}
                onChange={onPrecioChange}
              />
              {calcPrecioGalon !== null && activeField.current !== "precioGalon" && (
                <span className="ink-3 mt-0.5 text-[0.7rem]">
                  Calculado: {money(calcPrecioGalon)}
                </span>
              )}
            </label>

            {/* Switch Tanque lleno */}
            <div className="flex items-center justify-between rounded-2xl border border-[var(--line)] px-3 py-2" style={{ background: "var(--surface-2)" }}>
              <div>
                <div className="ink text-sm font-semibold">Tanque lleno</div>
                <div className="ink-3 text-[0.68rem]">
                  Necesario para calcular km/gal real
                </div>
              </div>
              <button
                role="switch"
                aria-checked={tanqueLleno}
                onClick={() => setTanqueLleno(!tanqueLleno)}
                className="relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors"
                style={{
                  width: "3rem",
                  height: "2.5rem",
                  background: tanqueLleno ? "var(--brand)" : "var(--surface-3)",
                  minWidth: "3rem",
                  minHeight: "2.5rem",
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: tanqueLleno ? "translateX(1.25rem)" : "translateX(0)",
                  }}
                />
              </button>
            </div>

            {/* Avisos */}
            {warnings.length > 0 && (
              <div aria-live="polite">
                {warnings.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                    style={{
                      background: "var(--warn-soft)",
                      color: "var(--warn)",
                    }}
                  >
                    ⚠ {w}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer con botón Guardar */}
          <div className="shrink-0 border-t border-[var(--line)] px-4 py-3" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
            <button
              className="btn btn-primary w-full justify-center py-2.5 text-sm font-bold"
              disabled={!canSave}
              onClick={handleSave}
            >
              Guardar tanqueo
            </button>
          </div>
        </div>
      </div>

      {/* Toast propio */}
      {toast && (
        <div
          aria-live="assertive"
          className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 animate-bounce"
          style={{
            background: "var(--ok)",
            color: "#fff",
            borderRadius: "1rem",
            padding: "0.6rem 1.2rem",
            fontSize: "0.82rem",
            fontWeight: 600,
            boxShadow: "0 4px 14px rgb(0 0 0 / .25)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
