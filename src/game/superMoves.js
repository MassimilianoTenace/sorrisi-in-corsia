// Tempi, battute ed effetti di ogni mossa speciale. "at" e "applyAt" sono frazioni della durata:
// applyAt è l'istante in cui i bambini ricevono la felicità.
// throws: oggetto lanciato a ogni bambino; effect: conseguenza particolare.
import { CONFIG } from '../config.js';

const VANISHING = (question) => ({
  duration: 7,
  applyAt: 0.82, // dopo la battuta, così i numeri non la coprono subito
  sound: 'magic',
  lines: [
    { at: 0.18, key: question },
    { at: 0.69, key: 'gone' },
  ],
});

export const SUPER_MOVES = {
  verticale: {},
  planche: {},
  lsit: {},
  bandiera: {},
  orsoDorato: { duration: 6.5, applyAt: 0.65, sound: 'magic' },
  pancettaSparisce: VANISHING('baconLook'),
  pancettaLancio: { duration: 5.5, applyAt: 0.5, lines: [{ at: 0.2, key: 'baconForAll' }], throws: 'bacon' },
  legoSparisce: VANISHING('legoLook'),
  rutto: { duration: 5.4, applyAt: 0.62, lines: [{ at: 0.36, key: 'burp', sound: 'burp' }], effect: 'whiteHair' },
  shakira: { duration: 6.5, lines: [{ at: 0.18, key: 'shakira' }] },
  danza: { duration: 6.5 },
  artigli: { duration: 5.5 },
  trucco: { duration: 6 },
  abito: { duration: 6, sound: 'magic' },
  giocoleria: { duration: 6 },
  boxe: { duration: 5 },
  spider: { duration: 7, applyAt: 0.45, throws: 'web' },
  rock: { duration: 6.5, sound: 'strum' },
  selfie: { duration: 5.8, sound: 'camera' },
  cilindro: {
    duration: 7.5,
    applyAt: 0.74, // il coniglietto è già uscito e i numeri non coprono subito la battuta
    sound: 'magic',
    lines: [
      { at: 0.2, key: 'hatLook' },
      { at: 0.62, key: 'rabbit' },
    ],
  },
  lezione: {
    duration: 10,
    applyAt: 0.86,
    lines: [
      { at: 0.06, key: 'lesson' },
      { at: 0.28, key: 'abc' },
      { at: 0.5, key: 'sum' },
      { at: 0.74, key: 'clear' },
    ],
  },
};

export const moveData = (id) => ({
  duration: CONFIG.superpower.duration,
  applyAt: 0.4,
  lines: [],
  ...SUPER_MOVES[id],
});
