// Personaggi disegnati a "scheletro": ogni posa è un insieme di giunture.
// L'origine è tra i piedi, y negativa verso l'alto, il personaggio guarda in basso a destra.
import { INK, shade, poly, ellipse, rrect, line, heart, finish } from './primitives.js';
import { drawToy, drawRoundBalloon, drawBalloonShape, drawPump, drawGuitar, drawNote, BALLOON_COLORS } from './props.js';
import { dimsOf, P, side, upright, hanging, figure } from './skeleton.js';
import { hairBack, hairFront, drawSmallHat } from './hair.js';
import { drawBear } from './bear.js';
import { SUPER_POSES } from './superPoses.js';
import { SUPER_ART } from './superProps.js';

export { dimsOf };

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

  // Mimmo suona per un bambino
  strum(d, { t }) {
    const strum = Math.sin(t * 15) * 3;
    const sway = Math.sin(t * 3);
    return {
      ...figure(d, { neckX: sway, tilt: sway * 0.12, a: [[-1, 15], [10, 21 + strum]], b: [[10, 11], [16, 8]] }),
      aFront: true,
    };
  },
};

export const POSE_NAMES = [...Object.keys(POSES), ...Object.keys(SUPER_POSES)];

function limb(ctx, a, b, c, width, upper, lower) {
  line(ctx, [a, b, c], INK, width + 2.4);
  line(ctx, [b, c], lower, width);
  line(ctx, [a, b], upper, width);
}

function arm(ctx, d, look, j, tint) {
  const sleeve = shade(look.topStyle === 'dress' ? look.top : look.coat ?? look.top, tint);
  const long = ['shirt', 'coat', 'pajama', 'sweater', 'spider'].includes(look.topStyle);
  const bare = look.topStyle === 'gown';
  const skin = shade(look.skin, tint);
  limb(ctx, j.sh, j.el, j.ha, d.arm, bare ? skin : sleeve, long ? sleeve : skin);
  if (look.gloves) {
    const boxing = look.topStyle !== 'spider';
    const r = d.arm * (boxing ? 1.05 : 0.6);
    ellipse(ctx, j.ha.x, j.ha.y, r, r * 0.95, shade(look.gloves, tint), INK, 1.1);
    if (boxing) ellipse(ctx, j.ha.x - 1.5, j.ha.y - 2, 1.8, 1.2, 'rgba(255,255,255,0.55)', null);
  } else {
    ellipse(ctx, j.ha.x, j.ha.y, d.arm * 0.55, d.arm * 0.55, skin, INK, 1);
  }
  if (look.claws > 0) claws(ctx, j, look.claws);
}

// Tre lunghe unghie d'acciaio che escono dal pugno.
function claws(ctx, j, length) {
  const base = Math.atan2(j.ha.y - j.el.y, j.ha.x - j.el.x);
  for (const spread of [-0.38, 0, 0.38]) {
    const a = base + spread;
    const from = P(j.ha.x + Math.cos(a) * 2, j.ha.y + Math.sin(a) * 2);
    const to = P(from.x + Math.cos(a) * length, from.y + Math.sin(a) * length);
    line(ctx, [from, to], INK, 2.8);
    line(ctx, [from, to], '#e9eef5', 1.3);
  }
}

function leg(ctx, d, look, hip, j, dir, tint) {
  const color = shade(look.bottom, tint);
  const top = P(hip.x + dir * d.hw * 0.45, hip.y - 1);
  const skirt = look.topStyle === 'dress';
  const bare = shade(look.skin, tint);
  const upper = look.shorts ? shade(look.shorts, tint) : skirt ? bare : color;
  limb(ctx, top, j.kn, j.ft, d.thigh, upper, skirt || look.shorts ? bare : color);
  const s = d.thigh / 7;
  ellipse(ctx, j.ft.x + 2.2 * s, j.ft.y - 0.5, 5.4 * s, 3.1 * s, look.shoes, INK, 1);
}

function torso(ctx, d, look, hip, neck, back, parts) {
  let dx = hip.x - neck.x;
  let dy = hip.y - neck.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  // asse (collo -> bacino) e perpendicolare
  const at = (along, across) => P(neck.x + dx * along + dy * across, neck.y + dy * along - dx * across);

  // bacino
  if (look.topStyle !== 'dress') {
    ellipse(ctx, hip.x, hip.y, d.hw, d.hw * 0.75, look.shorts ?? look.bottom, INK, 1.1);
  }

  const coat = look.topStyle === 'coat';
  const dress = look.topStyle === 'dress';
  const gown = look.topStyle === 'gown';
  const end = coat ? len + d.leg * 0.28 : dress ? len + d.leg * 0.3 : gown ? len + d.leg * 0.95 : len + 0.5;
  const endW = coat ? d.hw + 2 : dress ? d.hw + 3.5 : gown ? d.hw + 10 : d.hw;
  const color = coat ? look.coat : look.top;
  const shape = () => {
    const waistline = gown ? [at(len * 0.75, -d.hw + 1.5)] : [];
    const waistRight = gown ? [at(len * 0.75, d.hw - 1.5)] : [];
    const pts = [at(0.5, -3.5), at(1.5, -d.sw + 1), at(4.5, -d.sw - 0.6), ...waistline, at(end, -endW), at(end, endW), ...waistRight, at(4.5, d.sw + 0.6), at(1.5, d.sw - 1), at(0.5, 3.5)];
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

  if (look.jacket) {
    // giubbotto aperto: lascia vedere la maglietta
    for (const dir of [-1, 1]) {
      poly(ctx, [at(0.8, dir * 3.6), at(1.5, dir * (d.sw - 1)), at(4.5, dir * (d.sw + 0.6)), at(len, dir * d.hw), at(len, dir * (d.hw - 2.4)), at(6, dir * (d.sw - 3.4))], look.jacket, INK, 1);
    }
  }
  if (look.topStyle === 'spider') {
    for (const across of [-5, 0, 5]) line(ctx, [at(1, across * 0.4), at(len, across)], '#2b1c18', 0.6);
    for (const along of [6, 12, 17]) line(ctx, [at(along, -d.hw), at(along + 2, 0), at(along, d.hw)], '#2b1c18', 0.6);
  }
  if (look.bear && !back) {
    // la stampa segue l'inclinazione del busto
    const centre = at(len * 0.56, 0.6);
    ctx.save();
    ctx.translate(centre.x, centre.y);
    ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2);
    drawBear(ctx, 0, 0, d.torso / 29);
    ctx.restore();
    parts.add('bear');
  }

  if (!back) {
    if (look.topStyle === 'spider') {
      const p = at(len * 0.4, 0.5);
      for (const dir of [-1, 1]) {
        for (const lift of [-3.5, 0, 3.5]) line(ctx, [p, P(p.x + dir * 3.5, p.y + lift), P(p.x + dir * 5, p.y + lift * 1.4)], INK, 0.9);
      }
      ellipse(ctx, p.x, p.y, 1.6, 2.8, INK, null);
    } else if (gown) {
      poly(ctx, [at(0.6, -3.8), at(6.5, 0.6), at(0.6, 4.8)], look.skin, INK, 0.9);
      line(ctx, [at(len * 0.75, -d.hw + 1.5), at(len * 0.75, d.hw - 1.5)], '#f6c531', 2);
      for (let along = len; along < end - 2; along += 6) {
        for (const across of [-5, 3]) ellipse(ctx, at(along, across).x, at(along + 2, across).y, 0.8, 0.8, '#ffe9a8', null);
      }
    } else if (look.topStyle === 'tee') {
      ctx.beginPath();
      const p = at(0.8, 0.5);
      ctx.ellipse(p.x, p.y, 3.8, 2.3, 0, 0, Math.PI);
      finish(ctx, look.skin, INK, 0.9);
    } else if (look.topStyle === 'shirt') {
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
  if (!back && look.necklace === 'pearls') {
    for (let i = -3; i <= 3; i++) {
      const p = at(5.2 - i * i * 0.45, i * 1.45 + 0.5);
      ellipse(ctx, p.x, p.y, 0.95, 0.95, '#fffdf4', '#8d8478', 0.5);
    }
  }
  if (!back && look.necklace === 'chain') {
    // catenina sottile con un ciondolo, sopra la maglietta
    line(ctx, [at(1.2, -3.4), at(5.8, 0.5), at(1.2, 4.4)], '#c99a2e', 0.9);
    const p = at(6.4, 0.5);
    ellipse(ctx, p.x, p.y, 1.2, 1.4, '#f2c14e', INK, 0.5);
  }
  if (look.bumbag) {
    // marsupio in vita
    const p = at(len - 1, back ? -3 : 3);
    line(ctx, [at(len - 2, -d.hw), at(len - 2, d.hw)], shade(look.bumbag, -0.35), 1.6);
    rrect(ctx, p.x - 5.5, p.y - 2.5, 11, 7, 3, look.bumbag, INK, 1);
    line(ctx, [P(p.x - 3.5, p.y - 0.3), P(p.x + 3.5, p.y - 0.3)], '#1d1d22', 1.1);
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
  if (look.eyeshadow) {
    for (const x of [0, 7.2]) ellipse(ctx, x, -2.2, 2.8, 2, look.eyeshadow, null);
  }
  eye(0);
  eye(7.2);
  if (look.lashes || look.lips) {
    line(ctx, [P(-2.4, -2), P(-3.5, -3.1)], INK, 0.9);
    line(ctx, [P(9.2, -2), P(10.3, -3.1)], INK, 0.9);
  }
  const browTilt = { sad: -1.6, surprised: 0, fierce: 2.2 }[expression] ?? 0.4;
  const browY = expression === 'surprised' ? -6 : -4.6;
  const brow = look.beard || look.thickBrows ? 2 : 1.2;
  const browColor = shade(look.brow ?? look.hair, 0.05);
  if (expression === 'fierce') {
    line(ctx, [P(-2.6, -5.8), P(2.2, -3.4)], browColor, 2);
    line(ctx, [P(5.2, -3.4), P(9.8, -5.8)], browColor, 2);
  } else {
    line(ctx, [P(-2.6, browY - Math.min(0, -browTilt)), P(2, browY - Math.max(0, -browTilt) - 0.2)], browColor, brow);
    line(ctx, [P(5.4, browY - Math.max(0, -browTilt) - 0.2), P(9.6, browY - Math.min(0, -browTilt))], browColor, brow);
  }

  // naso
  line(ctx, [P(4.4, 0.8), P(5.4, 3), P(3.9, 3.5)], shade(look.skin, -0.32), 1.1);

  if (look.beard) beard(ctx, look);

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
    if (look.lips) line(ctx, [P(mx - 2.7, my + 1.1), P(mx, my + 2), P(mx + 2.7, my + 1.1)], look.lips, 1.7);
  }
  if (look.lips && expression !== 'happy') ellipse(ctx, mx, my + (expression === 'joy' ? -0.7 : 0.2), 3, 0.9, look.lips, null);
  if (look.beard) line(ctx, [P(0.6, 5), P(4.2, 4.2), P(7.8, 5)], look.beard, 1.7);
  else {
    const rosy = look.blush ? 'rgba(235, 50, 90, 0.7)' : 'rgba(235, 90, 90, 0.35)';
    ellipse(ctx, -3.6, 4.2, look.blush ? 3 : 2.2, look.blush ? 2 : 1.4, rosy, null);
    ellipse(ctx, 10, 4, look.blush ? 1.9 : 1.4, look.blush ? 1.7 : 1.2, rosy, null);
  }
  if (look.shades) {
    for (const x of [0, 7.4]) rrect(ctx, x - 3.4, -3.4, 6.8, 5, 2, '#17131c', INK, 0.8);
    line(ctx, [P(3.4, -1.8), P(4, -1.8)], INK, 1.2);
  } else if (look.glasses) {
    const frame = look.glassesColor ?? '#4a3b55';
    ellipse(ctx, 0, -0.8, 3.4, 3.4, null, frame, 1);
    ellipse(ctx, 7.4, -0.8, 3.4, 3.4, null, frame, 1);
    line(ctx, [P(3.4, -1.2), P(4, -1.2)], frame, 1);
    line(ctx, [P(-3.4, -1), P(-8, -1.5)], frame, 1);
  }
  ctx.restore();
}

// Barba piena oppure corta.
function beard(ctx, look) {
  const chin = look.beardStyle === 'full' ? 15.5 : 13.2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-8.6, 0.5);
  ctx.bezierCurveTo(-8.8, 9, -2, chin + 0.4, 3.6, chin);
  ctx.bezierCurveTo(8.6, chin - 0.4, 11.4, 8.5, 11.2, 2.5);
  ctx.bezierCurveTo(10, 5.4, 8.6, 4.8, 7.2, 4.5);
  ctx.quadraticCurveTo(4, 3.6, 1, 4.6);
  ctx.bezierCurveTo(-2.5, 6, -6.2, 4.4, -8.6, 0.5);
  if (look.beardStyle === 'short') ctx.globalAlpha = 0.82;
  finish(ctx, look.beard, INK, 0.8);
  ellipse(ctx, 4.2, 7.4, 3.9, 2.4, look.skin, null);
  ctx.restore();
}

// Maschera dell'Uomo Ragno: copre tutta la testa.
function mask(ctx, color, r, back) {
  ellipse(ctx, 0, 0, r * 1.02, r * 1.06, color, INK, 1.3);
  const centre = back ? P(0, 0) : P(r * 0.3, r * 0.1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    line(ctx, [centre, P(Math.cos(a) * r, Math.sin(a) * r)], INK, 0.6);
  }
  for (const k of [0.4, 0.75]) ellipse(ctx, centre.x * (1 - k * 0.6), centre.y * (1 - k * 0.6), r * k * 0.9, r * k * 0.9, null, INK, 0.5);
  if (back) return;
  for (const [x, dir] of [[-r * 0.14, -1], [r * 0.62, 1]]) {
    ellipse(ctx, x, -r * 0.08, r * 0.28, r * 0.22, '#ffffff', INK, 1.5, dir * 0.45);
  }
}

// Di fronte la chioma sta dietro al busto, per non coprire la maglietta.
function rearHair(ctx, d, look, h) {
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.a);
  hairBack(ctx, look, d.head);
  ctx.restore();
}

function head(ctx, d, look, h, back, expression, t, parts) {
  const r = d.head;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.a);
  // collo
  rrect(ctx, -3, r * 0.6, 6, r * 0.55, 2, shade(look.mask ?? look.skin, -0.12), INK, 0.9);
  ellipse(ctx, 0, 0, r, r * 1.04, look.skin, INK, 1.3);
  if (look.mask) {
    mask(ctx, look.mask, r, back);
    ctx.restore();
    return;
  }
  if (!back) {
    ellipse(ctx, -r * 0.78, r * 0.12, r * 0.19, r * 0.27, look.skin, INK, 0.9);
    face(ctx, look, r, expression, t);
    if (look.necklace === 'choker') {
      line(ctx, [P(-3.4, r * 0.98), P(0.5, r * 1.1), P(3.4, r * 0.98)], '#17131c', 1.7);
      heart(ctx, 0.8, r * 1.26, 2.1, '#f2c14e');
    }
  }
  hairFront(ctx, look, r, back);
  if (back) {
    hairBack(ctx, look, r);
    ellipse(ctx, -r * 0.98, r * 0.18, r * 0.16, r * 0.24, look.skin, INK, 0.9);
    ellipse(ctx, r * 0.98, r * 0.18, r * 0.16, r * 0.24, look.skin, INK, 0.9);
  }
  if (look.earrings) earrings(ctx, look.earrings, r, back);
  if (look.headband) line(ctx, [P(-r * 0.98, -r * 0.4), P(0, -r * 0.68), P(r * 0.98, -r * 0.4)], look.headband, 3);
  if (look.tiara) {
    poly(ctx, [P(-6, -r * 1.02), P(-5, -r * 1.42), P(-2, -r * 1.2), P(0.5, -r * 1.65), P(3, -r * 1.2), P(6, -r * 1.42), P(7, -r * 1.02)], '#ffd94a', INK, 0.9);
    ellipse(ctx, 0.5, -r * 1.22, 1.2, 1.2, '#7fd8ff', INK, 0.5);
  }
  if (look.smallHat) {
    drawSmallHat(ctx, look.smallHat, r, back);
    parts.add('smallHat');
  }
  ctx.restore();
}

function earrings(ctx, { type, color }, r, back) {
  const spots = back ? [-r * 0.98, r * 0.98] : [-r * 0.8];
  for (const x of spots) {
    if (type === 'hoop') ellipse(ctx, x, r * 0.62, r * 0.2, r * 0.26, null, color, 1.5);
    else ellipse(ctx, x, r * 0.5, type === 'disc' ? 2.2 : 1.2, type === 'disc' ? 2.2 : 1.2, color, INK, 0.7);
  }
}

// Grappolo di palloncini legato alla cintura, più quelli lunghi in tasca.
function balloonBunch(ctx, hip, t) {
  const spots = [
    [-25, -68, 8, 0],
    [-15, -80, 8.5, 1],
    [-30, -52, 7, 2],
  ];
  for (const [x, y, r, i] of spots) {
    const sx = x + hip.x + Math.sin(t * 1.7 + i * 2) * 2;
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
    const pts = [P(hip.x - 7 + i * 1.2, hip.y + 7), P(hip.x - 13 + i * 2.6, hip.y - 2 + i)];
    line(ctx, pts, INK, 3.8);
    line(ctx, pts, color, 2.4);
  });
}

// Strumento portato in mano mentre si cammina o si festeggia.
function carriedGuitar(ctx, hand) {
  drawGuitar(ctx, hand.x - 5, hand.y + 15, 0.34, { s: 0.92 });
}

/**
 * opts: pose, t, phase, back, flip, expression, progress, frizz,
 *       gear ('balloons' | 'guitar'), toy, balloon {shape, color}, making {shape, color}
 * Ritorna i nomi degli accessori disegnati (utile nelle prove).
 */
export function drawCharacter(ctx, baseLook, opts = {}) {
  const { pose = 'stand', t = 0, back = false, flip = false, progress = 0, gear = null } = opts;
  const parts = new Set();
  const d = dimsOf(baseLook);
  const superArt = SUPER_ART[pose];
  const env = { t, phase: opts.phase ?? 0, progress, p: progress };
  const j = (POSES[pose] ?? SUPER_POSES[pose])(d, env);
  const mirrored = flip !== Boolean(j.mirror);
  env.mirrored = mirrored; // le scritte vanno contro-specchiate per restare leggibili
  // capelli bianchi e arruffati (effetto di un superpotere)
  let look = opts.frizz ? { ...baseLook, style: 'frizz', hair: '#f4f3ee', roots: null, brow: baseLook.hair } : baseLook;
  if (superArt?.outfit) look = { ...look, ...superArt.outfit(look, env) };
  const expression = j.expression ?? opts.expression ?? 'happy';
  const making = pose === 'pump' ? opts.making : null;
  const holdingArm = (opts.toy || opts.balloon) && ['stand', 'walk', 'bed', 'sit'].includes(pose);
  const handsFree = !superArt && pose !== 'pump' && pose !== 'strum';

  if (holdingArm) {
    const n = j.neck;
    j.b.el = P(d.sw + 5, n.y + d.torso * 0.62);
    j.b.ha = P(d.sw + 10, n.y + d.torso * 0.42);
  }

  ctx.save();
  if (mirrored) ctx.scale(-1, 1);

  if (gear === 'balloons') {
    balloonBunch(ctx, j.hip, t);
    parts.add('balloons');
  }
  if (opts.balloon && !back) heldBalloon(ctx, j.b.ha, opts.balloon, t);
  superArt?.behind?.(ctx, j, env, parts);

  if (!j.aFront) arm(ctx, d, look, j.a, -0.14);
  if (gear === 'balloons' && handsFree) {
    drawPump(ctx, j.a.ha.x - 1, j.a.ha.y + 3, 0.2);
    parts.add('pump');
  }
  if (gear === 'guitar' && handsFree) {
    carriedGuitar(ctx, j.a.ha);
    parts.add('guitar');
  }
  if (j.legs !== false) {
    leg(ctx, d, look, j.hip, j.a, -1, -0.14);
    leg(ctx, d, look, j.hip, j.b, 1, 0);
  }
  // durante il superpotere la pompa resta appesa alla cintura, senza coprire la maglietta
  if (gear === 'balloons' && superArt && !j.pumpInUse) {
    drawPump(ctx, j.hip.x - d.hw - 6, j.hip.y + 5, -0.35);
    parts.add('pump');
  }
  if (!back && !look.mask) rearHair(ctx, d, look, j.head);
  torso(ctx, d, look, j.hip, j.neck, back, parts);
  if (gear === 'balloons') spareBalloons(ctx, j.hip);
  superArt?.waist?.(ctx, j, env, parts);
  if (gear === 'guitar' && pose === 'strum') {
    drawGuitar(ctx, j.hip.x - 4, j.hip.y + 4, 1.12);
    parts.add('guitar');
  }
  if (j.aFront) arm(ctx, d, look, j.a, -0.06);
  head(ctx, d, look, j.head, back, expression, t, parts);

  arm(ctx, d, look, j.b, 0);
  if (making) {
    drawMaking(ctx, j, making, progress, t);
    parts.add('pump');
  }
  superArt?.over?.(ctx, j, env, parts);
  if (pose === 'strum') {
    for (let i = 0; i < 3; i++) {
      const u = (t * 0.8 + i / 3) % 1;
      drawNote(ctx, 24 + u * 16 + i * 3, -48 - u * 38, 0.85, BALLOON_COLORS[i]);
    }
  }

  if (opts.balloon && back) heldBalloon(ctx, j.b.ha, opts.balloon, t);
  if (opts.toy) drawToy(ctx, opts.toy, j.b.ha.x + 2, j.b.ha.y - 3, look.kid ? 0.85 : 0.9);
  ctx.restore();
  return [...parts];
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
