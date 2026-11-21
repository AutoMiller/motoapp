#!/usr/bin/env python3
"""Genera los iconos PNG de la PWA de MotoApp.

Uso:  python3 tools/iconos.py

Identidad: fondo oscuro (--bg del tema .dark), baldosa naranja brand-600
(#ea580c) con degradado a brand-500 (#f97316) y la "M" en blanco, en la misma
línea visual que el favicon SVG que ya trae index.html.

Se escribe directamente en public/ para que Vite los copie tal cual a dist/.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "public"

OSCURO = (10, 14, 19)          # --bg del tema .dark
NARANJA = (234, 88, 12)        # brand-600
NARANJA_CLARO = (249, 115, 22)  # brand-500
BLANCO = (255, 255, 255)

FUENTE = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

SS = 4  # supermuestreo para bordes limpios


def degradado(lado: int, c1, c2) -> Image.Image:
    """Degradado diagonal de c1 a c2."""
    datos: list[tuple[int, int, int]] = []
    for y in range(lado):
        for x in range(lado):
            t = (x + y) / (2 * (lado - 1))
            datos.append(tuple(round(a + (b - a) * t) for a, b in zip(c1, c2)))
    img = Image.new("RGB", (lado, lado))
    img.putdata(datos)
    return img


def mascara_redondeada(lado: int, radio: int) -> Image.Image:
    m = Image.new("L", (lado, lado), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, lado - 1, lado - 1), radius=radio, fill=255)
    return m


def letra(lado: int, texto: str, caja: int) -> Image.Image:
    """La letra escalada para ocupar `caja` px de alto, centrada."""
    fuente = ImageFont.truetype(FUENTE, caja)
    capa = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    izq, arriba, der, abajo = d.textbbox((0, 0), texto, font=fuente)
    d.text(
        ((lado - (der - izq)) / 2 - izq, (lado - (abajo - arriba)) / 2 - arriba),
        texto,
        font=fuente,
        fill=BLANCO,
    )
    return capa


def icono(lado: int, *, maskable: bool, esquinas: bool) -> Image.Image:
    """Icono cuadrado. `maskable` encoge el dibujo al 80% (zona segura)."""
    n = lado * SS
    fondo = Image.new("RGBA", (n, n), OSCURO + (255,))

    # Área del dibujo: 78% para "any", 62% para maskable (cabe en el círculo seguro)
    area = int(n * (0.62 if maskable else 0.78))
    off = (n - area) // 2

    baldosa = degradado(area, NARANJA_CLARO, NARANJA)
    radio = 0 if not esquinas else int(area * 0.26)
    fondo.paste(baldosa, (off, off), mascara_redondeada(area, radio))

    # Sombra suave bajo la baldosa
    marca = letra(area, "M", int(area * 0.62))
    fondo.alpha_composite(marca, (off, off))

    img = fondo.resize((lado, lado), Image.Resampling.LANCZOS)
    if esquinas:
        img.putalpha(mascara_redondeada(n, int(n * 0.22)).resize((lado, lado), Image.Resampling.LANCZOS))
    return img


def main() -> None:
    SALIDA.mkdir(parents=True, exist_ok=True)
    salidas = [
        ("icon-192.png", icono(192, maskable=False, esquinas=True)),
        ("icon-512.png", icono(512, maskable=False, esquinas=True)),
        ("icon-maskable-512.png", icono(512, maskable=True, esquinas=False)),
        ("apple-touch-icon.png", icono(180, maskable=False, esquinas=False)),
    ]
    for nombre, img in salidas:
        destino = SALIDA / nombre
        img.save(destino, "PNG", optimize=True)
        print(f"{destino.relative_to(RAIZ)}  {destino.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
