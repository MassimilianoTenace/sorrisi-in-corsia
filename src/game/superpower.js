import { CONFIG } from '../config.js';

// Doppio della felicità di un palloncino riuscito.
export const superGain = () => CONFIG.balloon.gain * CONFIG.superpower.multiplier;

// Tutti i bambini nella stessa stanza del volontario.
export const superAudience = (map, origin, kids) => {
  const area = map.areaAt(origin.x, origin.y);
  return kids.filter((k) => map.areaAt(k.x, k.y) === area);
};

// Le mosse si susseguono nell'ordine della lista; turn conta le volte già usate.
export const nextMove = (moves, turn) => moves[turn % moves.length];
