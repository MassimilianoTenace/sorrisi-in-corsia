// Giunture dei superpoteri. env: { t: tempo, p: avanzamento 0..1 della mossa }.
// Oltre alle giunture una posa può indicare: aFront (braccio sinistro davanti al busto),
// mirror (specchiata), expression, pumpInUse (la pompa è in mano) e legs: false.
import { P, side, figure, leg } from './skeleton.js';

const REST_A = [[-2.5, 12], [-3, 21.5]];
const REST_B = [[2.5, 12], [3, 21.5]];

// Magia dell'oggetto che sparisce: tasca -> si mostra -> bacchetta -> non c'è più.
export const VANISH = { show: 0.12, wand: 0.45, gone: 0.68 };

function vanishingAct(d, { t, p }) {
  if (p < VANISH.show) return figure(d, { a: REST_A, b: [[5, 12], [-3, 20]] });
  const shown = [[9, 10], [18, 3 + Math.sin(t * 3)]];
  if (p < VANISH.wand) return figure(d, { a: [[-8, 9], [-6, 19]], b: shown, tilt: 0.08 });
  if (p < VANISH.gone) {
    const w = Math.sin(t * 11);
    return { ...figure(d, { a: [[0, 13], [9 + w * 2, 13 + w * 3]], b: shown }), aFront: true };
  }
  return figure(d, { a: [[-10, 3], [-14, -8]], b: [[10, 9], [17, 4]], tilt: -0.1 });
}

// Cilindro: dietro la schiena -> si mostra -> capovolto, tocchi di bacchetta -> coniglietto.
export const HAT = { show: 0.1, flip: 0.24, rabbit: 0.56 };
// Lezione: la lavagna compare, poi si scrive una riga alla volta (ABC, la somma, il sole).
export const LESSON = { rows: [0.2, 0.44, 0.64], writing: 0.12 };

export const SUPER_POSES = {
  // --- calisthenics ---
  verticale(d, { t }) {
    const s = Math.sin(t * 4) * 5;
    return {
      hip: P(s * 0.3, -45),
      neck: P(0, -23),
      head: { x: 0, y: -13, a: Math.PI },
      a: side(P(-9, -22), P(-11, -11), P(-10, -1), P(-4 + s, -60), P(-8 + s * 2, -74)),
      b: side(P(9, -22), P(11, -11), P(11, 0), P(4 + s * 0.3, -60), P(8 - s, -75)),
    };
  },
  planche(d, { t }) {
    const s = Math.sin(t * 9) * 0.8;
    return {
      hip: P(-9, -27 + s),
      neck: P(13, -27),
      head: { x: 24, y: -33, a: 0.2 },
      a: side(P(7, -27), P(4, -18), P(2, -10), P(-24, -29 + s), P(-39, -31 + s * 2)),
      b: side(P(12, -23), P(10, -15), P(9, -7), P(-23, -24 + s), P(-38, -24 + s * 2)),
    };
  },
  lsit(d, { t }) {
    const s = Math.sin(t * 8) * 1;
    return {
      hip: P(-2, -14),
      neck: P(-2, -35),
      head: { x: -1, y: -45.5, a: 0 },
      a: side(P(-10, -32), P(-12, -22), P(-9, -11), P(13, -18 + s), P(29, -21 + s * 2)),
      b: side(P(6, -31), P(9, -20), P(6, -8), P(16, -11 + s), P(34, -12 + s * 2)),
    };
  },
  bandiera(d, { t }) {
    const s = Math.sin(t * 6) * 1.5;
    return {
      hip: P(14, -43 + s),
      neck: P(-8, -43),
      head: { x: -8, y: -57, a: 0.12 },
      a: side(P(-9, -49), P(-17, -56), P(-24, -63), P(29, -45 + s * 1.5), P(45, -47 + s * 2)),
      b: side(P(-7, -37), P(-16, -32), P(-24, -27), P(29, -38 + s * 1.5), P(44, -37 + s * 2)),
    };
  },

  // Gianni: prima gonfia, poi mostra l'orsetto d'oro
  orsoDorato(d, { t, p }) {
    if (p < 0.45) {
      const push = Math.abs(Math.sin(t * 11)) * 5;
      return { ...figure(d, { a: [[4, 13], [14, 8 + push]], b: [[5, 12], [9, 11]] }), aFront: true, pumpInUse: true };
    }
    const w = Math.sin(t * 5) * 1.5;
    return figure(d, { a: [[-10, 1], [-10, -13 + w]], b: [[9, 8], [17, 1 + w]] });
  },

  pancettaSparisce: vanishingAct,
  legoSparisce: vanishingAct,

  pancettaLancio(d, { t, p }) {
    if (p < 0.18) return figure(d, { a: REST_A, b: [[5, 12], [-3, 20]] });
    const swing = (u) => [[8 + u * 4, -2 + u * 10], [2 + u * 19, -14 + u * 19]];
    const mirrored = (arm) => arm.map(([x, y]) => [-x, y]);
    return figure(d, { a: mirrored(swing((t * 1.6 + 0.5) % 1)), b: swing((t * 1.6) % 1) });
  },

  rutto(d, { t, p }) {
    if (p < 0.35) {
      return { ...figure(d, { a: [[-5, 11], [6, 17]], b: [[4, 12], [-8, 18]], tilt: -0.08 }), aFront: true, expression: 'neutral' };
    }
    if (p < 0.72) {
      const q = Math.sin(t * 40) * 0.6;
      return { ...figure(d, { a: [[-9, 8], [-15, 14]], b: [[9, 8], [15, 14]], tilt: -0.3, neckX: -2 + q }), expression: 'surprised' };
    }
    return figure(d, { a: REST_A, b: [[8, 9], [-2, -1]], tilt: 0.12 });
  },

  // Sabrina balla sopra la scatola
  shakira(d, { t }) {
    const s = Math.sin(t * 8) * 6;
    const w = Math.sin(t * 8 + 1.4) * 4;
    const box = 15;
    return figure(d, {
      hipX: s,
      neckX: -s * 0.3,
      lift: box,
      tilt: s * 0.025,
      a: [[-11, 2 + w], [-8, -11 - w]],
      b: [[11, 2 - w], [8, -11 + w]],
      la: leg(-4 + s * 0.9, -d.leg / 2 - box, -6, -box - 1.5),
      lb: leg(5 + s * 0.9, -d.leg / 2 - box, 6, -box),
    });
  },

  // Mariafrancesca: arabesque, quinta posizione sulle punte, piroetta
  danza(d, { t, p }) {
    const s = Math.sin(t * 2.5);
    if (p < 0.36) {
      return figure(d, {
        neckX: 7,
        tilt: 0.1,
        a: [[-10, 5], [-20, 6 + s * 2]],
        b: [[10, 0], [20, -8 - s * 2]],
        la: leg(-17, -29 + s, -32, -34 + s * 2),
        lb: leg(2, -15, 1, 0),
      });
    }
    if (p < 0.68) {
      const lift = 4 + Math.abs(s) * 2;
      return figure(d, {
        lift,
        tilt: s * 0.08,
        a: [[-11, -9], [2, -28]],
        b: [[11, -9], [-2, -28]],
        la: leg(-2, -d.leg / 2 - lift, 2, -lift - 2),
        lb: leg(3, -d.leg / 2 - lift, -2, -lift),
      });
    }
    return {
      ...figure(d, {
        lift: 4,
        a: [[-8, 10], [6, 17]],
        b: [[8, 10], [-6, 17]],
        la: leg(-2, -19, -1, -4),
        lb: leg(15, -23, 3, -18),
      }),
      aFront: true,
      mirror: Math.floor(t * 6) % 2 === 1,
    };
  },

  artigli(d, { t }) {
    const w = Math.sin(t * 6) * 5;
    return {
      ...figure(d, {
        hipY: -d.leg + 4,
        tilt: 0.06,
        a: [[-11, 7], [-17, -1 + w]],
        b: [[11, 7], [17, -1 - w]],
        la: leg(-11, -14, -13, -1.5),
        lb: leg(11, -13, 14, 0),
      }),
      expression: 'fierce',
    };
  },

  // Giovanna: rossetto, poi pennello, poi matita
  trucco(d, { t, p }) {
    const dab = Math.sin(t * 13) * 1.3;
    const hand = p < 0.4 ? [8 + dab, -1] : p < 0.7 ? [9 + dab, -8 + Math.cos(t * 13) * 1.5] : [9, -13 + dab];
    return { ...figure(d, { a: [[-8, 9], [-9, 1]], b: [[12, 8], hand], tilt: 0.07 }), expression: p < 0.7 ? 'neutral' : 'joy' };
  },

  abito(d, { t, p }) {
    const s = Math.sin(t * 3) * 2;
    return {
      ...figure(d, { a: [[-9, 10], [-17, 18 + s]], b: [[10, 8], [17, -2 - s]], tilt: 0.1, neckX: s * 0.4 }),
      mirror: p > 0.55 && p < 0.75 && Math.floor(t * 7) % 2 === 1,
    };
  },

  giocoleria(d, { t }) {
    const s = Math.sin(t * 10) * 3;
    return {
      ...figure(d, { a: [[-5, 12], [-3, 13 + s]], b: [[5, 12], [6, 13 - s]], tilt: Math.sin(t * 3) * 0.06 }),
      expression: 'joy',
    };
  },

  // Vincenzo: guardia, diretto destro, guardia, diretto sinistro
  boxe(d, { t }) {
    const beat = Math.floor(t * 5) % 4;
    const guardA = [[2, 12], [12, 1]];
    const guardB = [[8, 11], [6, 0]];
    return {
      ...figure(d, {
        lift: Math.abs(Math.sin(t * 10)) * 2,
        hipX: beat === 1 ? 2 : beat === 3 ? 1 : 0,
        a: beat === 3 ? [[19, 4], [39, 0]] : guardA,
        b: beat === 1 ? [[14, 1], [28, -2]] : guardB,
        la: leg(-9, -15, -12, -1.5),
        lb: leg(9, -14, 11, 0),
      }),
      aFront: true,
      expression: 'fierce',
      punch: beat === 1 ? 'b' : beat === 3 ? 'a' : null,
    };
  },

  // Emmanuele: lancia la ragnatela, si accovaccia, si appende a testa in giù, doppio lancio
  spider(d, { p }) {
    if (p < 0.28) return { ...figure(d, { a: [[-9, 9], [-12, 18]], b: [[11, -2], [22, -10]] }), trick: 'shoot' };
    if (p < 0.5) {
      return {
        ...figure(d, {
          hipY: -15,
          neckX: 3,
          a: [[-3, 15], [4, 29]],
          b: [[12, 2], [22, -6]],
          la: leg(-18, -18, -13, -1.5),
          lb: leg(18, -17, 15, 0),
        }),
        trick: 'crouch',
      };
    }
    if (p < 0.76) {
      return {
        hip: P(0, -58),
        neck: P(0, -36),
        head: { x: 0, y: -26, a: Math.PI },
        a: side(P(-9, -39), P(-17, -52), P(-2, -66), P(-15, -70), P(-1, -84)),
        b: side(P(9, -39), P(17, -50), P(3, -72), P(15, -70), P(1, -84)),
        trick: 'hang',
      };
    }
    return {
      ...figure(d, {
        a: [[-11, -2], [-22, -9]],
        b: [[11, -2], [22, -9]],
        la: leg(-10, -15, -13, -1.5),
        lb: leg(10, -14, 12, 0),
      }),
      trick: 'double',
    };
  },

  rock(d, { t }) {
    const bang = Math.sin(t * 9);
    const strum = Math.sin(t * 19) * 3;
    return {
      ...figure(d, {
        hipX: bang * 1.5,
        hipY: -d.leg + 2,
        tilt: bang * 0.24,
        a: [[-1, 15], [10, 21 + strum]],
        b: [[10, 11], [16, 8]],
        la: leg(-12, -15, -15, -1.5),
        lb: leg(12, -14, 14, 0),
      }),
      aFront: true,
      expression: 'joy',
    };
  },

  // Martina: il cilindro nella destra, la bacchetta nella sinistra
  cilindro(d, { t, p }) {
    if (p < HAT.show) return figure(d, { a: REST_A, b: [[5, 12], [-8, 15]] });
    if (p < HAT.flip) return { ...figure(d, { a: [[-10, 5], [-17, -3]], b: [[9, 9], [18, 3]], tilt: 0.1 }), expression: 'happy' };
    const held = [[9, 13], [19, 14]];
    if (p < HAT.rabbit) {
      const tap = Math.sin(t * 11) * 2.5;
      // la punta della bacchetta batte sulla tesa
      return { ...figure(d, { a: [[2, 11], [16, 2 + tap]], b: held, tilt: 0.1 }), aFront: true };
    }
    return figure(d, { a: [[-11, 1], [-15, -11 + Math.sin(t * 4) * 1.5]], b: held, tilt: -0.08 });
  },

  // Ida: indica la lavagna con la bacchetta e gesticola con l'altra mano
  lezione(d, { t, p }) {
    const talk = Math.sin(t * 5) * 3;
    if (p < LESSON.rows[0]) return figure(d, { a: REST_A, b: [[10, 8], [15, -2]], tilt: 0.04 });
    const row = LESSON.rows.filter((at) => p >= at).length - 1;
    const asking = p >= 0.82;
    const reach = [[10, -2], [11, 3], [12, 8]][row];
    return {
      ...figure(d, {
        a: asking ? [[-10, 3], [-17, -5 + talk]] : [[-10, 9], [-15, 5 + talk]],
        b: [[9, 8], [reach[0] + Math.sin(t * 9) * 0.8, reach[1]]],
        tilt: asking ? -0.1 : 0.08 + Math.sin(t * 2.5) * 0.04,
        neckX: asking ? -1 : 1,
      }),
      row,
      expression: asking ? 'joy' : 'happy',
    };
  },

  // Anna cambia posa tra uno scatto e l'altro
  selfie(d, { t }) {
    const pose = Math.floor(t / 1.4) % 3;
    const other = [
      [[-9, 6], [-4, -6]],
      [[-11, 9], [-3, 18]],
      [[-10, 1], [-13, -12]],
    ][pose];
    return {
      ...figure(d, { a: other, b: [[13, 1], [24, -10]], tilt: [0.16, -0.14, 0.04][pose], neckX: [1, -1, 0][pose] }),
      expression: pose === 1 ? 'happy' : 'joy',
    };
  },
};
