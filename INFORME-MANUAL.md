# INFORME-MANUAL.md — Auditoría contra manual Yamaha XTZ 250 ABS

**Manual:** B9L-F8199-S0, XTZ250 ABS Colombia 2019, 109 páginas, español.  
**Fecha:** 2026-11-21  
**Archivos modificados:** `src/data/ficha.ts`, `src/data/guias.ts`

---

## Tabla de comparación

| Dato | Valor en app (antes) | Valor en manual | Página | Estado |
|---|---|---|---|---|
| Cilindraje | 249 cc | 249,5 cm³ | 96 | Corregido |
| API aceite | SG o superior | SL o superior | 96 | Corregido |
| Filtro de aceite | Cada 10.000 km | Cada 5.000 km / 12 meses | 57 | Corregido |
| Filtro de aire | Cambiar 10.000 km | Cambiar 40.000 km | 53 | Corregido |
| Bujía | NGK DR8EA | NGK DR8EA-N | 62 | Corregido |
| Reserva combustible | 3,7 L | 4,1 L | 35, 96 | Corregido |
| Peso | 151–152 kg (en marcha) | 153 kg (en vacío) | 96 | Corregido |
| Presión llantas solo | 18/22 psi | 18/22 psi (125/150 kPa) | 70 | Coincide |
| Presión con pasajero | 22/29 psi | 22/29 psi (150/200 kPa) | 70 | Coincide |
| Aceite motor | 10W-40 JASO MA | 10W-40 JASO MA | 96 | Coincide |
| Capacidad aceite | 1,35 / 1,45 L | 1,35 / 1,45 L | 96 | Coincide |
| Cambio aceite | 5.000 km / 6 meses | 5.000 km / 6 meses | 57 | Coincide |
| Bujía gap | 0,6–0,7 mm | 0,6–0,7 mm | 62 | Coincide |
| Batería | XTZ7L 12 V 6 Ah | XTZ7L 12 V 6,0 Ah | 97 | Coincide |
| Tanque | 13,6 L | 13,6 L | 96 | Coincide |
| Combustible | — | Gasolina sin plomo (E10 ok) | 35 | Sin cambiar |
| Líquido frenos | DOT 4, c/2 años | DOT 4, c/2 años | 74 | Coincide |
| Manguera freno | c/4 años | c/4 años | 54 | Coincide |
| Holgura cadena | 30–40 mm | 30,0–40,0 mm | 75 | Coincide |
| Ralentí | 1.300–1.500 rpm | 1.300–1.500 rpm | 68 | Coincide |
| Altura asiento | 875 mm | 875 mm | 96 | Coincide |
| Altura suelo | 270 mm | 270 mm | 96 | Coincide |
| Llanta delantera | 80/90-21 48S | 80/90-21M/C 48S | 96 | Coincide |
| Llanta trasera | 120/80-18 62S | 120/80-18M/C 62S | 96 | Coincide |

## Correcciones en guiás.ts

| Dato | Antes | Después | Página |
|---|---|---|---|
| Intervalo aceite | 5.000 km / 4 meses | 5.000 km / 6 meses | 57 |
| Tensión cadena | 25–35 mm | 30–40 mm | 75 |

## Datos sin fuente en el manual

Potencia, torque, tipo alimentación, transmisión, tamaño cadena (428×130),  
piñón/catalina (13/40), kit arrastre, medidas disco freno, horquilla 41 mm / 220 mm,  
suspensión 205 mm, aceite horquilla 541 cc, consumo real. Se conservan con  
comentario `// sin fuente en el manual`.

## Fusibles (verificación del extracto del issue)

- Fusible principal: 15,0 A detrás del panel B — manual pág. 83-84 ✓
- Fusible solenoide ABS: 10,0 A — manual pág. 84 ✓
- Fusible bomba ABS: 10,0 A — manual pág. 84 ✓
- Fusible secundario: 7,5 A — manual pág. 84 ✓
- Dos fusibles de repuesto — manual pág. 84 ✓
