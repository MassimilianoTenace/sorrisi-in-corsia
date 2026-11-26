import { Game } from '../src/game/game.js';

// Generatore ripetibile (mulberry32).
export function seeded(seed = 1) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newGame(seed = 1) {
  const events = [];
  const game = new Game({ rng: seeded(seed), onEvent: (e) => events.push(e) });
  return { game, events };
}

export function run(game, seconds) {
  for (let t = 0; t < seconds; t += 0.05) game.update(0.05);
}

// Avanza finché la condizione è vera; fallisce se non succede entro il limite.
export function until(game, condition, limit = 60) {
  for (let t = 0; t < limit; t += 0.05) {
    if (condition()) return t;
    game.update(0.05);
  }
  throw new Error(`condizione non raggiunta in ${limit} secondi`);
}

export const place = (who, x, y) => {
  who.x = x;
  who.y = y;
  who.stop();
};
