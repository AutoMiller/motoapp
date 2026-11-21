import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

const MARGEN = 12;
const ANCHO = 260;

export function Ayuda({
  texto,
  titulo,
  className = "",
}: {
  texto: string;
  titulo?: string;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Colocar el popover dentro de la ventana: centrado en el botón pero sin salirse.
  useLayoutEffect(() => {
    if (!abierto) {
      setPos(null);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const width = Math.min(ANCHO, vw - MARGEN * 2);
    const centro = r.left + r.width / 2;
    const left = Math.min(Math.max(centro - width / 2, MARGEN), vw - width - MARGEN);
    const top = Math.min(r.bottom + 8, window.innerHeight - 24);
    setPos({ left, top, width });
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        btnRef.current?.focus();
      }
    };

    const onClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setAbierto(false);
      }
    };

    // Al desplazar o girar la pantalla, el ancla se mueve: cerramos para no dejarlo flotando.
    const onScroll = () => setAbierto(false);

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);

    popoverRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [abierto]);

  const toggle = () => {
    setAbierto((prev) => {
      if (prev) setTimeout(() => btnRef.current?.focus(), 0);
      return !prev;
    });
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`ink-3 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-[var(--surface-3)] hover:ink-2 ${className}`}
        onClick={toggle}
        aria-label="Cómo se calcula"
        aria-expanded={abierto}
        aria-describedby={abierto ? "ayuda-popover" : undefined}
      >
        <Info size={13} />
      </button>

      {abierto && pos && (
        <div
          ref={popoverRef}
          id="ayuda-popover"
          tabIndex={-1}
          role="dialog"
          aria-modal={false}
          aria-describedby="ayuda-popover-body"
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            width: pos.width,
            zIndex: 90,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: "10px 12px",
            boxShadow: "var(--shadow)",
          }}
        >
          {titulo && (
            <p className="mb-1 font-bold" style={{ color: "var(--ink)", fontSize: "0.72rem" }}>
              {titulo}
            </p>
          )}
          <p
            id="ayuda-popover-body"
            style={{ color: "var(--ink-2)", fontSize: "0.72rem", lineHeight: 1.5 }}
          >
            {texto}
          </p>
        </div>
      )}
    </>
  );
}
