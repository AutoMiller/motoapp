/**
 * Presiones de llantas — Yamaha XTZ 250 ABS.
 *
 * Off-road: referencia piloto ~60 kg (Trail.Hacker OS).
 * Asfalto: valores fríos del manual del propietario.
 */

export interface PresionOffRoad {
  terreno: string;
  delantera: string;
  trasera: string;
  nota: string;
}

export const PRESIONES_OFFROAD: PresionOffRoad[] = [
  {
    terreno: "Arena / Lodo profundo",
    delantera: "14–16 psi",
    trasera: "14–16 psi",
    nota: "Máxima tracción",
  },
  {
    terreno: "Trocha mixta / Piedras",
    delantera: "16–20 psi",
    trasera: "16–20 psi",
    nota: "Equilibrio agarre y protección de rin",
  },
  {
    terreno: "Ripio / Asfalto de enlace",
    delantera: "20–23 psi",
    trasera: "23–26 psi",
    nota: "+2–3 psi con equipaje o pasajero",
  },
];

export interface PresionesAsfalto {
  solo: string;
  conPasajero: string;
  fuente: string;
}

export const PRESIONES_ASFALTO: PresionesAsfalto = {
  solo: "18 / 22 psi",
  conPasajero: "22 / 29 psi",
  fuente: "manual",
};
