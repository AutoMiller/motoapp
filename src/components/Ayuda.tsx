import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

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
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);

    // Mover foco al popover al abrir
    popoverRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [abierto]);

  const toggle = () => {
    setAbierto((prev) => {
      if (prev) {
        // Al cerrar, devolver foco al botón
        setTimeout(() => btnRef.current?.focus(), 0);
      }
      return !prev;
    });
  };

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        ref={btnRef}
        type="button"
        className="ink-3 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-[var(--surface-3)] hover:ink-2"
        onClick={toggle}
        aria-label="Cómo se calcula"
        aria-expanded={abierto}
        aria-describedby={abierto ? "ayuda-popover" : undefined}
      >
        <Info size={13} />
      </button>

      {abierto && (
        <div
          ref={popoverRef}
          id="ayuda-popover"
          tabIndex={-1}
          role="dialog"
          aria-modal={false}
          aria-describedby="ayuda-popover-body"
          className="pop absolute left-1/2 z-50 mt-2 -translate-x-1/2"
          style={{
            position: "absolute",
            left: "50%",
            top: "100%",
            marginTop: "8px",
            transform: "translateX(-50%)",
          }}
        >
          <div
            className="rounded-xl border px-3 py-2.5 shadow-lg"
            style={{
              maxWidth: "260px",
              background: "var(--surface)",
              borderColor: "var(--line)",
              boxShadow: "var(--shadow)",
            }}
          >
            {titulo && (
              <p
                className="mb-1 font-bold"
                style={{ color: "var(--ink)", fontSize: "0.72rem" }}
              >
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
        </div>
      )}
    </span>
  );
}
