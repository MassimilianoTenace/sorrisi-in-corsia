// Personaggi disegnati a "scheletro": ogni posa è un insieme di giunture.
// L'origine è tra i piedi, y negativa verso l'alto, il personaggio guarda in basso a destra.
import { INK, shade, poly, ellipse, rrect, line, finish } from './primitives.js';
import { drawToy, drawRoundBalloon, drawBalloonShape, drawPump, BALLOON_COLORS } from './props.js';

const ADULT = { leg: 30, torso: 22, head: 12, sw: 9.5, hw: 7, arm: 5.6, thigh: 7 };
const KID = { leg: 17, torso: 15, head: 11, sw: 7, hw: 6, arm: 4.4, thigh: 5.6 };

export const dimsOf = (look) => (look.kid ? KID : ADULT);

const P = (x, y) => ({ x, y });
const side = (sh, el, ha, kn, ft) => ({ sh, el, ha, kn, ft });

function upright(d, hipX, hipY, headBob = 0) {
  const neck = P(hipX, hipY - d.torso);
  return {
    hip: P(hipX, hipY),
    neck,
    head: { x: neck.x + 0.5, y: neck.y - d.head * 0.82 + headBob, a: 0 },
  };
}

function hanging(d, neck, dir, swing = 0) {
  const sh = P(neck.x + dir * d.sw, neck.y + 3.5);
  return {
    sh,
    el: P(sh.x + dir * 2.5 + swing * 0.5, sh.y + d.torso * 0.55),
    ha: P(sh.x + dir * 3 + swing, sh.y + d.torso * 0.98),
  };
}

const POSES = {
  stand(d, { t }) {
    const bob = Math.sin(t * 2.2) * 0.5;
    const b = upright(d, 0, -d.leg + bob * 0.4);
    return {
      ...b,
      a: { ...hanging(d, b.neck, -1), kn: P(-4, -d.leg / 2), ft: P(-5, -1.5) },
      b: { ...hanging(d, b.neck, 1), kn: P(4, -d.leg / 2 + 0.5), ft: P(5, 0) },
    };
  },
  walk(d, { phase }) {
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const stride = d.leg * 0.26;
    const b = upright(d, 0, -d.leg - Math.abs(c) * 1.8 + 1);
    const leg = (x, v, lift) => ({
      kn: P(x * 0.4 + v * stride * 0.7 + 1.5, -d.leg / 2 - lift * 2.5),
      ft: P(x + v * stride, -lift * 5),
    });
    return {
      ...b,
      a: { ...hanging(d, b.neck, -1, s * stride), ...leg(-4, -s, Math.max(0, -c)) },
      b: { ...hanging(d, b.neck, 1, -s * stride), ...leg(4, s, Math.max(0, c)) },
    };
  },
  cheer(d, { t }) {
    const j = Math.abs(Math.sin(t * 7)) * 5;
    const b = upright(d, 0, -d.leg - j);
    const arm = (dir, w) => {
      const sh = P(dir * d.sw, b.neck.y + 3.5);
      return { sh, el: P(sh.x + dir * 7, sh.y - 1 + w), ha: P(sh.x + dir * 6, sh.y - 13 + w) };
    };
    const w = Math.sin(t * 14) * 2;
    return {
      ...b,
      a: { ...arm(-1, w), kn: P(-5, -d.leg / 2 - j), ft: P(-5, -j - 1) },
      b: { ...arm(1, -w), kn: P(5, -d.leg / 2 - j), ft: P(6, -j) },
    };
  },
  pump(d, { t, progress }) {
    const b = upright(d, 0, -d.leg);
    const n = b.neck.y;
    const farSh = P(-d.sw, n + 3.5);
    const nearSh = P(d.sw, n + 3.5);
    const legs = [
      { kn: P(-5, -d.leg / 2), ft: P(-7, -1.5) },
      { kn: P(5, -d.leg / 2), ft: P(7, 0) },
    ];
    if (progress < 0.45) {
      const push = Math.abs(Math.sin(t * 11)) * 6;
      return {
        ...b,
        a: side(farSh, P(-4, n + 15), P(9, n - 1 + push), legs[0].kn, legs[0].ft),
        b: side(nearSh, P(14, n + 16), P(13, n + 15), legs[1].kn, legs[1].ft),
      };
    }
    const twist = Math.sin(t * 17) * 2.5;
    return {
      ...b,
      a: side(farSh, P(-1, n + 17), P(10, n + 14 + twist), legs[0].kn, legs[0].ft),
      b: side(nearSh, P(19, n + 19), P(27, n + 14 - twist), legs[1].kn, legs[1].ft),
    };
  },
  sit(d, { t }) {
    const seat = d.leg * 0.6;
    const b = upright(d, -1, -seat + Math.sin(t * 2) * 0.3);
    const arm = (dir) => {
      const sh = P(b.neck.x + dir * d.sw, b.neck.y + 3.5);
      return { sh, el: P(sh.x + dir * 2, sh.y + d.torso * 0.55), ha: P(sh.x + dir + 5, b.hip.y) };
    };
    return {
      ...b,
      a: { ...arm(-1), kn: P(2, -seat + 3), ft: P(2, -2) },
      b: { ...arm(1), kn: P(10, -seat + 5), ft: P(11, 0) },
    };
  },
  bed(d, { t }) {
    const b = upright(d, 0, 0, Math.sin(t * 2) * 0.5);
    const arm = (dir) => ({
      sh: P(dir * d.sw, b.neck.y + 3.5),
      el: P(dir * (d.sw + 3), -5),
      ha: P(dir * 4 + 2, -1),
    });
    return { ...b, legs: false, a: arm(-1), b: arm(1) };
  },

  bedCheer(d, { t }) {
    const b = upright(d, 0, -Math.abs(Math.sin(t * 7)) * 4);
    const w = Math.sin(t * 14) * 2;
    const arm = (dir, v) => {
      const sh = P(dir * d.sw, b.neck.y + 3.5);
      return { sh, el: P(sh.x + dir * 7, sh.y - 1 + v), ha: P(sh.x + dir * 6, sh.y - 13 + v) };
    };
    return { ...b, legs: false, a: arm(-1, w), b: arm(1, -w) };
  },

  // --- mosse di calisthenics ---
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
};

function limb(ctx, a, b, c, width, upper, lower) {
  line(ctx, [a, b, c], INK, width + 2.4);
  line(ctx, [b, c], lower, width);
  line(ctx, [a, b], upper, width);
}

function arm(ctx, d, look, j, tint) {
  const sleeve = shade(look.topStyle === 'dress' ? look.top : look.coat ?? look.top, tint);
  const long = ['shirt', 'coat', 'pajama', 'sweater'].includes(look.topStyle);
  limb(ctx, j.sh, j.el, j.ha, d.arm, sleeve, long ? sleeve : shade(look.skin, tint));
  ellipse(ctx, j.ha.x, j.ha.y, d.arm * 0.55, d.arm * 0.55, shade(look.skin, tint), INK, 1);
}

function leg(ctx, d, look, hip, j, dir, tint) {
  const color = shade(look.bottom, tint);
  const top = P(hip.x + dir * d.hw * 0.45, hip.y - 1);
  const skirt = look.topStyle === 'dress';
  limb(ctx, top, j.kn, j.ft, d.thigh, skirt ? shade(look.skin, tint) : color, skirt ? shade(look.skin, tint) : color);
  const s = d.thigh / 7;
  ellipse(ctx, j.ft.x + 2.2 * s, j.ft.y - 0.5, 5.4 * s, 3.1 * s, look.shoes, INK, 1);
}

function torso(ctx, d, look, hip, neck, back) {
  let dx = hip.x - neck.x;
  let dy = hip.y - neck.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  // asse (collo -> bacino) e perpendicolare
  const at = (along, across) => P(neck.x + dx * along + dy * across, neck.y + dy * along - dx * across);

  // bacino
  if (look.topStyle !== 'dress') {
    ellipse(ctx, hip.x, hip.y, d.hw, d.hw * 0.75, look.bottom, INK, 1.1);
  }

  const coat = look.topStyle === 'coat';
  const dress = look.topStyle === 'dress';
  const end = coat ? len + d.leg * 0.28 : dress ? len + d.leg * 0.3 : len + 0.5;
  const endW = coat ? d.hw + 2 : dress ? d.hw + 3.5 : d.hw;
  const color = coat ? look.coat : look.top;
  const shape = () => {
    const pts = [at(0.5, -3.5), at(1.5, -d.sw + 1), at(4.5, -d.sw - 0.6), at(end, -endW), at(end, endW), at(4.5, d.sw + 0.6), at(1.5, d.sw - 1), at(0.5, 3.5)];
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
  };
  shape();
  finish(ctx, color, INK, 1.4);

  // ombra sul fianco lontano
  poly(ctx, [at(4.5, -d.sw), at(end - 0.5, -endW + 0.3), at(end - 0.5, -endW + 3), at(5, -d.sw + 3)], shade(color, -0.13), null);

  if (look.topStyle === 'pajama') {
    ctx.save();
    shape();
    ctx.clip();
    for (let along = 3; along < end; along += 5) {
      for (let across = -d.sw; across <= d.sw; across += 5.5) {
        const p = at(along, across + (Math.floor(along / 5) % 2) * 2.5);
        ellipse(ctx, p.x, p.y, 1.3, 1.3, look.dots, null);
      }
    }
    ctx.restore();
  }

  if (!back) {
    if (look.topStyle === 'shirt') {
      // collo aperto, colletto e bottoni
      poly(ctx, [at(0, -3.4), at(7.5, 1.5), at(0, 4.4)], look.skin, INK, 0.9);
      poly(ctx, [at(-0.8, -4.2), at(4.8, -4.6), at(1.2, -1.2)], shade(look.top, 0.35), INK, 0.9);
      poly(ctx, [at(-0.8, 5), at(6, 6), at(2.4, 2.2)], shade(look.top, 0.35), INK, 0.9);
      line(ctx, [at(7.5, 1.5), at(len, 1.5)], shade(look.top, -0.28), 1);
      for (let along = 10; along < len - 2; along += 4) {
        const p = at(along, 3);
        ellipse(ctx, p.x, p.y, 0.7, 0.7, shade(look.top, -0.4), null);
      }
    } else if (coat) {
      poly(ctx, [at(0, -3.8), at(11, 1), at(0, 5)], look.top, INK, 0.9);
      poly(ctx, [at(1.5, 0.2), at(10, 0), at(10, 2.2), at(1.5, 2)], '#c0392b', null);
      line(ctx, [at(11, 1), at(end, 1)], shade(look.coat, -0.3), 1);
      // stetoscopio
      line(ctx, [at(1, -4.5), at(9, -4), at(13, -1)], '#37474f', 1.5);
      const p = at(13.5, -0.5);
      ellipse(ctx, p.x, p.y, 2, 2, '#b0bec5', INK, 0.8);
      rrect(ctx, at(7, 4).x - 1, at(7, 4).y - 1, 4.5, 3.5, 0.8, '#fff', INK, 0.7);
    } else if (look.topStyle === 'scrubs') {
      poly(ctx, [at(0, -3.5), at(5.5, 0.8), at(0, 4.5)], look.skin, INK, 0.9);
      rrect(ctx, at(9, 3).x - 1.5, at(9, 3).y - 1.5, 5, 4, 0.8, shade(look.top, -0.15), INK, 0.7);
    } else {
      ctx.beginPath();
      const p = at(0.8, 0.5);
      ctx.ellipse(p.x, p.y, 3.6, 2.2, 0, 0, Math.PI);
      finish(ctx, look.topStyle === 'pajama' ? shade(look.top, 0.3) : look.skin, INK, 0.9);
    }
    if (look.badge) {
      const p = at(8, -4);
      ellipse(ctx, p.x, p.y, 2.4, 2.4, '#fff', INK, 0.8);
      ellipse(ctx, p.x, p.y, 1.1, 1.1, '#e8483f', null);
    }
  }
  if (look.belt) {
    line(ctx, [at(len - 0.5, -d.hw + 0.5), at(len - 0.5, d.hw - 0.5)], shade(look.bottom, -0.35), 2.4);
  }
}

function hairBack(ctx, look, r) {
  if (look.style === 'long') {
    rrect(ctx, -r * 1.12, -r * 0.7, r * 2.1, r * 2.05, r * 0.8, look.hair);
  } else if (look.style === 'pigtails') {
    ellipse(ctx, -r * 1.15, r * 0.25, r * 0.42, r * 0.62, look.hair, INK, 1.1, 0.5);
    ellipse(ctx, r * 1.12, r * 0.25, r * 0.42, r * 0.62, look.hair, INK, 1.1, -0.5);
  } else if (look.style === 'bun') {
    ellipse(ctx, -r * 0.35, -r * 1.12, r * 0.5, r * 0.45, look.hair);
  }
}

function hairFront(ctx, look, r, back) {
  const { style, hair } = look;
  if (back) {
    ctx.beginPath();
    ctx.arc(0, -0.5, r + 0.6, Math.PI * 0.86, Math.PI * 2.14);
    ctx.quadraticCurveTo(0, r * (style === 'quiff' || style === 'short' ? 0.78 : 1.05), -r * 0.95, r * 0.4);
    finish(ctx, style === 'cap' ? look.cap : hair, INK, 1.2);
    if (style === 'quiff') line(ctx, [P(-5, -r + 1), P(2, -r - 3), P(7, -r - 1)], shade(hair, 0.22), 1.4);
    return;
  }
  if (style === 'quiff') {
    // lati sfumati
    ctx.beginPath();
    ctx.moveTo(-r - 0.3, 1);
    ctx.quadraticCurveTo(-r - 1, -r * 0.9, -r * 0.3, -r * 0.95);
    ctx.lineTo(-r * 0.55, -r * 0.25);
    ctx.lineTo(-r * 0.68, r * 0.2);
    ctx.closePath();
    finish(ctx, shade(hair, 0.24), null);
    // ciuffo alto portato di lato
    ctx.beginPath();
    ctx.moveTo(-r * 0.92, -r * 0.35);
    ctx.bezierCurveTo(-r * 1.18, -r * 1.2, -r * 0.35, -r * 1.55, r * 0.25, -r * 1.45);
    ctx.bezierCurveTo(r * 0.75, -r * 1.62, r * 1.25, -r * 1.25, r * 1.12, -r * 0.9);
    ctx.bezierCurveTo(r * 1.1, -r * 0.7, r * 1.02, -r * 0.5, r * 0.9, -r * 0.42);
    ctx.bezierCurveTo(r * 0.55, -r * 0.82, -r * 0.05, -r * 0.62, -r * 0.5, -r * 0.62);
    ctx.quadraticCurveTo(-r * 0.62, -r * 0.2, -r * 0.7, r * 0.08);
    ctx.closePath();
    finish(ctx, hair, INK, 1.2);
    line(ctx, [P(-r * 0.45, -r * 1.05), P(r * 0.2, -r * 1.22), P(r * 0.7, -r * 1.08)], shade(hair, 0.3), 1.1);
  } else if (style === 'cap') {
    ctx.beginPath();
    ctx.arc(0, -1, r + 0.8, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(0, -r * 0.5, -r - 0.8, -1);
    finish(ctx, look.cap, INK, 1.2);
    ellipse(ctx, r * 0.75, -r * 0.5, r * 0.6, r * 0.2, shade(look.cap, -0.2), INK, 1, 0.15);
    ellipse(ctx, 0, -r - 1.5, 1.8, 1.4, shade(look.cap, 0.3), INK, 0.9);
  } else if (style === 'curly') {
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI * (0.92 + i * 0.195);
      ellipse(ctx, Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, r * 0.36, r * 0.36, hair, INK, 1);
    }
    ellipse(ctx, -1, -r * 0.78, r * 0.62, r * 0.32, hair, null);
  } else if (style === 'bald') {
    ellipse(ctx, -3, -r * 0.7, 3, 1.6, 'rgba(255,255,255,0.4)', null);
  } else {
    ctx.beginPath();
    ctx.arc(0, -0.5, r + 0.7, Math.PI * 0.98, Math.PI * 2.02);
    ctx.bezierCurveTo(r * 0.7, -r * 0.35, r * 0.25, -r * 0.75, -r * 0.05, -r * 0.55);
    ctx.bezierCurveTo(-r * 0.3, -r * 0.4, -r * 0.65, -r * 0.45, -r * 0.7, r * 0.15);
    ctx.closePath();
    finish(ctx, hair, INK, 1.2);
    if (style === 'pigtails') {
      ellipse(ctx, -r * 0.98, -r * 0.1, 2, 2, look.band ?? '#e8483f', INK, 0.8);
      ellipse(ctx, r * 0.98, -r * 0.1, 2, 2, look.band ?? '#e8483f', INK, 0.8);
    }
  }
}

function face(ctx, look, r, expression, t) {
  const k = r / 12;
  ctx.save();
  ctx.scale(k, k);
  const blink = (t * 0.7 + (look.seed ?? 0)) % 4 < 0.12;
  const eye = (x) => {
    if (expression === 'joy' || blink) {
      ctx.beginPath();
      ctx.arc(x, -0.2, 1.9, Math.PI * 1.1, Math.PI * 1.9);
      finish(ctx, null, INK, 1.4);
      return;
    }
    ellipse(ctx, x, -0.8, 2.1, 2.5, '#fff', INK, 0.7);
    ellipse(ctx, x + 0.5, -0.6, 1.25, 1.55, '#2a1a12', null);
    ellipse(ctx, x + 0.9, -1.2, 0.45, 0.45, '#fff', null);
  };
  eye(0);
  eye(7.2);
  const browTilt = expression === 'sad' ? -1.6 : expression === 'surprised' ? 0 : 0.4;
  const browY = expression === 'surprised' ? -6 : -4.6;
  const brow = look.beard ? 2 : 1.2;
  line(ctx, [P(-2.6, browY - Math.min(0, -browTilt)), P(2, browY - Math.max(0, -browTilt) - 0.2)], shade(look.hair, 0.05), brow);
  line(ctx, [P(5.4, browY - Math.max(0, -browTilt) - 0.2), P(9.6, browY - Math.min(0, -browTilt))], shade(look.hair, 0.05), brow);

  // naso
  line(ctx, [P(4.4, 0.8), P(5.4, 3), P(3.9, 3.5)], shade(look.skin, -0.32), 1.1);

  if (look.beard) {
    ctx.beginPath();
    ctx.moveTo(-8.6, 0.5);
    ctx.bezierCurveTo(-8.8, 9, -2, 13.6, 3.6, 13.2);
    ctx.bezierCurveTo(8.6, 12.8, 11.4, 8.5, 11.2, 2.5);
    ctx.bezierCurveTo(10, 5.4, 8.6, 4.8, 7.2, 4.5);
    ctx.quadraticCurveTo(4, 3.6, 1, 4.6);
    ctx.bezierCurveTo(-2.5, 6, -6.2, 4.4, -8.6, 0.5);
    finish(ctx, look.beard, INK, 0.8);
    ellipse(ctx, 4.2, 7.4, 3.9, 2.4, look.skin, null);
  }

  const mx = 4.2;
  const my = 6.6;
  ctx.beginPath();
  if (expression === 'joy') {
    ctx.moveTo(mx - 3.8, my - 0.8);
    ctx.quadraticCurveTo(mx, my + 7, mx + 3.8, my - 0.8);
    ctx.closePath();
    finish(ctx, '#7c2430', INK, 1);
    ellipse(ctx, mx, my + 1.8, 1.8, 0.9, '#f2808a', null);
  } else if (expression === 'sad') {
    ctx.arc(mx, my + 3.4, 3.4, Math.PI * 1.22, Math.PI * 1.78);
    finish(ctx, null, INK, 1.3);
    ellipse(ctx, 8.6, 3.4, 1.2, 1.9, '#7fd0ff', '#3b8fc4', 0.6);
  } else if (expression === 'surprised') {
    ellipse(ctx, mx, my + 0.8, 1.9, 2.5, '#7c2430', INK, 1);
  } else if (expression === 'neutral') {
    line(ctx, [P(mx - 2.4, my + 0.6), P(mx + 2.4, my + 0.4)], INK, 1.3);
  } else {
    ctx.arc(mx, my - 2.2, 4, Math.PI * 0.22, Math.PI * 0.78);
    finish(ctx, null, INK, 1.3);
  }
  if (look.beard) line(ctx, [P(0.6, 5), P(4.2, 4.2), P(7.8, 5)], look.beard, 1.7);
  else {
    ellipse(ctx, -3.6, 4.2, 2.2, 1.4, 'rgba(235, 90, 90, 0.35)', null);
    ellipse(ctx, 10, 4, 1.4, 1.2, 'rgba(235, 90, 90, 0.35)', null);
  }
  if (look.glasses) {
    ellipse(ctx, 0, -0.8, 3.4, 3.4, null, '#4a3b55', 1);
    ellipse(ctx, 7.4, -0.8, 3.4, 3.4, null, '#4a3b55', 1);
    line(ctx, [P(3.4, -1.2), P(4, -1.2)], '#4a3b55', 1);
    line(ctx, [P(-3.4, -1), P(-8, -1.5)], '#4a3b55', 1);
  }
  ctx.restore();
}

function head(ctx, d, look, h, back, expression, t) {
  const r = d.head;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.a);
  if (!back) hairBack(ctx, look, r);
  // collo
  rrect(ctx, -3, r * 0.6, 6, r * 0.55, 2, shade(look.skin, -0.12), INK, 0.9);
  ellipse(ctx, 0, 0, r, r * 1.04, look.skin, INK, 1.3);
  if (!back) {
    ellipse(ctx, -r * 0.78, r * 0.12, r * 0.19, r * 0.27, look.skin, INK, 0.9);
    face(ctx, look, r, expression, t);
  }
  hairFront(ctx, look, r, back);
  if (back) {
    hairBack(ctx, look, r);
    ellipse(ctx, -r * 0.98, r * 0.18, r * 0.16, r * 0.24, look.skin, INK, 0.9);
    ellipse(ctx, r * 0.98, r * 0.18, r * 0.16, r * 0.24, look.skin, INK, 0.9);
  }
  ctx.restore();
}

// Grappolo di palloncini legato alla cintura, più quelli lunghi in tasca.
function balloonBunch(ctx, hip, t) {
  const spots = [
    [-25, -68, 8, 0],
    [-15, -80, 8.5, 1],
    [-30, -52, 7, 2],
  ];
  for (const [x, y, r, i] of spots) {
    const sx = x + Math.sin(t * 1.7 + i * 2) * 2;
    const sy = y + hip.y + 30 + Math.cos(t * 2.1 + i) * 1.5;
    ctx.beginPath();
    ctx.moveTo(hip.x - 6, hip.y);
    ctx.quadraticCurveTo(sx - 1, (sy + hip.y) / 2 + 6, sx, sy + r);
    finish(ctx, null, '#6b5b52', 0.9);
    drawRoundBalloon(ctx, sx, sy, r, BALLOON_COLORS[i]);
  }
}

function spareBalloons(ctx, hip) {
  ['#52bd5a', '#b45fd6', '#ff8a2b'].forEach((color, i) => {
    const pts = [P(hip.x - 6 + i * 1.5, hip.y + 2), P(hip.x - 12 + i * 3.4, hip.y - 8 + i)];
    line(ctx, pts, INK, 3.8);
    line(ctx, pts, color, 2.4);
  });
}

function apparatus(ctx, pose) {
  if (pose === 'bandiera') {
    ellipse(ctx, -26, 0, 9, 4, '#7b8790');
    rrect(ctx, -28.5, -92, 5, 91, 2, '#c3ced6');
    ellipse(ctx, -26, -92, 4, 4, '#e8483f');
  } else if (pose === 'planche' || pose === 'lsit') {
    const bars = pose === 'planche' ? [[2, -9], [9, -6]] : [[-9, -10], [6, -7]];
    for (const [x, y] of bars) {
      line(ctx, [P(x - 5, 1), P(x - 4, y), P(x + 4, y), P(x + 5, 1)], INK, 4.4);
      line(ctx, [P(x - 5, 1), P(x - 4, y), P(x + 4, y), P(x + 5, 1)], '#e8a23a', 2.4);
    }
  }
}

/**
 * opts: pose, t, phase, back, flip, expression, progress,
 *       gear (pompa e palloncini), toy, balloon {shape, color}, making {shape, color}
 */
export function drawCharacter(ctx, look, opts = {}) {
  const { pose = 'stand', t = 0, back = false, flip = false, expression = 'happy', progress = 0 } = opts;
  const d = dimsOf(look);
  const j = POSES[pose](d, { t, phase: opts.phase ?? 0, progress });
  const making = pose === 'pump' ? opts.making : null;
  const holdingArm = (opts.toy || opts.balloon) && ['stand', 'walk', 'bed', 'sit'].includes(pose);

  if (holdingArm) {
    const n = j.neck;
    j.b.el = P(d.sw + 5, n.y + d.torso * 0.62);
    j.b.ha = P(d.sw + 10, n.y + d.torso * 0.42);
  }
  const acrobatics = ['verticale', 'planche', 'lsit', 'bandiera'].includes(pose);

  ctx.save();
  if (flip) ctx.scale(-1, 1);

  if (opts.gear && !acrobatics) balloonBunch(ctx, j.hip, t);
  if (opts.balloon && !back) heldBalloon(ctx, j.b.ha, opts.balloon, t);
  apparatus(ctx, pose);

  arm(ctx, d, look, j.a, -0.14);
  if (opts.gear && pose !== 'pump' && !acrobatics) drawPump(ctx, j.a.ha.x - 1, j.a.ha.y + 3, 0.2);
  if (j.legs !== false) {
    leg(ctx, d, look, j.hip, j.a, -1, -0.14);
    leg(ctx, d, look, j.hip, j.b, 1, 0);
  }
  torso(ctx, d, look, j.hip, j.neck, back);
  if (opts.gear && !acrobatics) spareBalloons(ctx, j.hip);
  head(ctx, d, look, j.head, back, expression, t);

  arm(ctx, d, look, j.b, 0);
  if (making) drawMaking(ctx, j, making, progress, t);

  if (opts.balloon && back) heldBalloon(ctx, j.b.ha, opts.balloon, t);
  if (opts.toy) drawToy(ctx, opts.toy, j.b.ha.x + 2, j.b.ha.y - 3, look.kid ? 0.85 : 0.9);
  ctx.restore();
}

function heldBalloon(ctx, hand, balloon, t) {
  const x = hand.x + 8 + Math.sin(t * 2) * 1.5;
  const y = hand.y - 20 + Math.cos(t * 2.4) * 1.5;
  line(ctx, [hand, P(x - 2, y + 9)], '#6b5b52', 1);
  drawBalloonShape(ctx, balloon.shape, x, y, 0.8, balloon.color);
}

function drawMaking(ctx, j, making, progress, t) {
  const a = j.a.ha;
  const b = j.b.ha;
  if (progress < 0.45) {
    // il palloncino si gonfia sulla bocchetta della pompa
    const k = progress / 0.45;
    drawPump(ctx, b.x - 2, b.y + 1, 0, a.y - (b.y - 16));
    const pts = [P(b.x, b.y + 12), P(b.x + 6 + k * 22, b.y + 11 - k * 6)];
    line(ctx, pts, INK, 5 + k * 5);
    line(ctx, pts, making.color, 3 + k * 5);
  } else {
    drawPump(ctx, j.hip.x - 9, j.hip.y + 2, -0.5);
    const k = (progress - 0.45) / 0.55;
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2 + 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(t * 13) * 0.35 * (1 - k));
    if (k < 0.55) {
      const bends = [-14, -7, 0, 7, 14].map((x, i) => P(x, (i % 2 ? 1 : -1) * k * 14));
      line(ctx, bends, INK, 8);
      line(ctx, bends, making.color, 6);
    } else {
      drawBalloonShape(ctx, making.shape, 0, -4, 0.7 + k * 0.35, making.color);
    }
    ctx.restore();
  }
}
