// Misure e giunture dei personaggi, comuni alle pose di base e a quelle dei superpoteri.
// L'origine è tra i piedi, y negativa verso l'alto, il personaggio guarda in basso a destra.
const ADULT = { leg: 30, torso: 22, head: 12, sw: 9.5, hw: 7, arm: 5.6, thigh: 7 };
const KID = { leg: 17, torso: 15, head: 11, sw: 7, hw: 6, arm: 4.4, thigh: 5.6 };

export const dimsOf = (look) => (look.kid ? KID : ADULT);

export const P = (x, y) => ({ x, y });
export const side = (sh, el, ha, kn, ft) => ({ sh, el, ha, kn, ft });

export function upright(d, hipX, hipY, headBob = 0) {
  const neck = P(hipX, hipY - d.torso);
  return {
    hip: P(hipX, hipY),
    neck,
    head: { x: neck.x + 0.5, y: neck.y - d.head * 0.82 + headBob, a: 0 },
  };
}

export function hanging(d, neck, dir, swing = 0) {
  const sh = P(neck.x + dir * d.sw, neck.y + 3.5);
  return {
    sh,
    el: P(sh.x + dir * 2.5 + swing * 0.5, sh.y + d.torso * 0.55),
    ha: P(sh.x + dir * 3 + swing, sh.y + d.torso * 0.98),
  };
}

// Figura in piedi libera: per le braccia si danno [gomito, mano] come scostamenti dalla spalla,
// per le gambe (facoltative) ginocchio e piede. "lift" solleva tutto il corpo da terra.
export function figure(d, { a, b, la, lb, hipX = 0, hipY = -d.leg, neckX = hipX, lift = 0, tilt = 0 }) {
  const hip = P(hipX, hipY - lift);
  const neck = P(neckX, hip.y - d.torso);
  const head = { x: neck.x + 0.5, y: neck.y - d.head * 0.82, a: tilt };
  const legs = (dir) => ({
    kn: P(dir * 4.5 + hipX * 0.4, hipY / 2 - lift),
    ft: P(dir < 0 ? -5.5 : 6, (dir < 0 ? -1.5 : 0) - lift),
  });
  const limbs = (dir, [el, ha], leg) => {
    const sh = P(neck.x + dir * d.sw, neck.y + 3.5);
    return side(sh, P(sh.x + el[0], sh.y + el[1]), P(sh.x + ha[0], sh.y + ha[1]), leg.kn, leg.ft);
  };
  return { hip, neck, head, a: limbs(-1, a, la ?? legs(-1)), b: limbs(1, b, lb ?? legs(1)) };
}

export const leg = (kx, ky, fx, fy) => ({ kn: P(kx, ky), ft: P(fx, fy) });
