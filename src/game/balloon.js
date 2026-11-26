import { CONFIG } from '../config.js';

const B = CONFIG.balloon;

// Bambini che vedono la scena: stessa stanza ed entro il raggio.
export function audienceAround(map, origin, kids, radius = B.radius) {
  const area = map.areaAt(origin.x, origin.y);
  return kids.filter(
    (k) => map.areaAt(k.x, k.y) === area && Math.hypot(k.x - origin.x, k.y - origin.y) <= radius,
  );
}

/**
 * Decide l'esito di un palloncino senza modificare nessuno.
 * forced: 'pop' | 'success' (solo per prove e debug).
 */
export function resolveBalloon({ target, audience, rng = Math.random, forced = null }) {
  const popped = forced ? forced === 'pop' : rng() < B.popChance;
  const crowd = audience.includes(target) ? audience : [target, ...audience];

  if (!popped) {
    const effects = crowd.map((kid) => ({
      kid,
      delta: kid === target ? B.gain : B.nearbyGain,
      reaction: 'happy',
    }));
    return { popped, effects };
  }

  const upset = crowd.map(() => rng() < 0.5);
  // Con almeno due spettatori c'è sempre chi si spaventa e chi ride.
  if (upset.length > 1 && upset.every((u) => u === upset[0])) {
    const i = Math.floor(rng() * upset.length);
    upset[i] = !upset[i];
  }
  const effects = crowd.map((kid, i) => ({
    kid,
    delta: upset[i] ? B.popUpset : B.popAmused,
    reaction: upset[i] ? 'upset' : 'amused',
  }));
  return { popped, effects };
}
