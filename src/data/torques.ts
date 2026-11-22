/**
 * Torques oficiales — Yamaha XTZ 250 ABS (manual del propietario).
 *
 * TODO: mover a ficha.ts cuando exista el export TORQUES en ese módulo.
 */

export interface Torque {
  elemento: string;
  nm: number;       // Newton·metro
  kgfm: number;     // kilogramo-fuerza·metro
}

export const TORQUES: Torque[] = [
  { elemento: "Tornillo de drenaje de aceite", nm: 20, kgfm: 2.0 },
  { elemento: "Tornillos cubierta filtro de aceite", nm: 10, kgfm: 1.0 },
  { elemento: "Tuerca del eje trasero", nm: 46, kgfm: 4.6 },
  { elemento: "Contratuerca tensor de cadena", nm: 15, kgfm: 1.5 },
  { elemento: "Tornillos fijación baúl / soporte", nm: 20, kgfm: 2.0 },
];
