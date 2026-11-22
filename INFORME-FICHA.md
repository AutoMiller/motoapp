# INFORME DE ALINEACIÓN — Ficha del Vehículo con Expediente Notion

**Fuente de verdad:** `/opt/data/cache/scratch/notion-expediente.md`  
**Archivo modificado:** `src/data/ficha.ts`  
**Fecha:** 2026-11-22

## Tabla de Cambios

| Dato | Antes | Después | Fuente |
|---|---|---|---|
| Año modelo | (no existía) | 2025 | expediente Notion |
| Placa | (no existía) | CAM53H | expediente Notion |
| Color | (no existía) | Azul / Negro | expediente Notion |
| VIN | (no existía) | 9FKDG2848S2039378 | expediente Notion |
| Nº Motor | (no existía) | G3F2E039378 | expediente Notion |
| Fecha de compra | (no existía) | 2024-07-29 | expediente Notion |
| Matrícula | (no existía) | 2024-07-31 Soacha (Cundinamarca) | expediente Notion |
| Cilindraje | 249,5 cm³ | 249 cc | expediente Notion |
| Aceite recomendado | 10W-40 JASO MA/MA2 | Yamalube 10W-40, API SL+, JASO MA | expediente Notion |
| Cadena | 428 × 130 eslabones | 520 | expediente Notion |
| Bujía | NGK DR8EA-N | NGK DR8EA | expediente Notion |
| Suspensión trasera | Monocross · 205 mm | Pro-Link 205 mm | expediente Notion |
| Freno delantero | Disco 245 × 3,5 mm · ABS | Disco 245 mm · ABS monocanal | expediente Notion |
| Freno trasero | Disco 203 × 4,5 mm | Disco 203 mm | expediente Notion |
| Pastillas traseras mín. | (no existía) | 1,0 mm | expediente Notion |
| Grasa de suspensión | (no existía) | Grasa de litio cada 10.000 km | expediente Notion |
| Carga máxima total | (no existía) | 157 kg | expediente Notion |
| Carga baúl/parrilla | (no existía) | 7 kg | expediente Notion |
| Filtro combustible | (no existía) | Externo cada 15.000 km | expediente Notion |
| Ref. filtro aceite | 38B-E3440-00-00 | 1S7E34400000 | expediente Notion |
| Llanta delantera | 80/90-21 48S | 80/90-21M/C 48S (Metzeler Tourance) | expediente Notion |
| Llanta trasera | 120/80-18 62S | 120/80-18M/C 62S (Metzeler Tourance) | expediente Notion |
| Consumo real / rendimiento | 28–33 km/l | Eliminado (no en expediente) | — |
| Ralentí | 1.300–1.500 rpm | 1.300–1.500 rpm | sin confirmar en expediente |
| Tanque, peso, alturas, batería | sin cambios | sin cambios | sin confirmar en expediente |

## Nuevo Export

- **`TORQUES`** — Array de 5 filas con torques oficiales (N·m y kgf·m) del Manual del Propietario.

## Verificación

- `npx tsc --noEmit` → 0 errores
- `npm run checks` → 27 ok, 0 fallidos
- `npm run build` → éxito
