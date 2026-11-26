import { CONFIG } from '../config.js';

const H = CONFIG.happiness;

export const clampHappiness = (v) => Math.min(H.max, Math.max(H.min, v));

// Modifica la felicità di un bambino e ritorna la variazione effettiva.
export function changeHappiness(kid, delta) {
  const before = kid.happiness;
  kid.happiness = clampHappiness(before + delta);
  return kid.happiness - before;
}

export function decayed(value, dt) {
  if (value <= H.decayFloor) return value;
  return Math.max(H.decayFloor, value - H.decayPerSecond * dt);
}

// Rosso (0) -> arancione -> giallo -> verde (100).
export const happinessHue = (v) => Math.round((clampHappiness(v) / H.max) * 120);
export const happinessColor = (v) => `hsl(${happinessHue(v)}, 80%, 45%)`;

export function moodIndex(v) {
  if (v < 25) return 0;
  if (v < 50) return 1;
  if (v < 75) return 2;
  return 3;
}

export const expressionFor = (v) => ['sad', 'neutral', 'happy', 'joy'][moodIndex(v)];
