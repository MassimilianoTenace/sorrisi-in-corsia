// Arredi del reparto. Ogni funzione disegna un oggetto sulle sue caselle.
import { toScreen } from '../engine/iso.js';
import {
  INK, shade, poly, ellipse, rrect, line, isoRect, isoBox, onFaceY, onFaceX, onFloor, shadow, star, heart,
} from './primitives.js';
import { drawToy, drawRoundBalloon, TOY_IDS, BALLOON_COLORS } from './props.js';

const at = (x, y, z = 0) => toScreen(x, y, z);

// Gli oggetti sul lato ovest di una stanza guardano a est, gli altri a sud.
const facesEast = (item) => item.x % 7 === 0 && item.y % 10 !== 0;

// Disegna sulla facciata visibile di un mobile (u: 32 per casella, v negativa verso l'alto).
function front(ctx, item, inset, fn) {
  if (facesEast(item)) onFaceX(ctx, item.x + 1 - inset, item.y + 1 - inset, 0, fn);
  else onFaceY(ctx, item.x + inset, item.y + 1 - inset, 0, fn);
}

function legs(ctx, x, y, w, d, h, color) {
  for (const [lx, ly] of [[x, y], [x + w, y], [x, y + d], [x + w, y + d]]) {
    line(ctx, [at(lx, ly, 0), at(lx, ly, h)], INK, 4);
    line(ctx, [at(lx, ly, 0), at(lx, ly, h)], color, 2.2);
  }
}

function cabinet(ctx, item, height, color, details) {
  const i = 0.08;
  shadow(ctx, at(item.x + 0.55, item.y + 0.6).x, at(item.x + 0.55, item.y + 0.6).y, 30);
  isoBox(ctx, item.x + i, item.y + i, 1 - 2 * i, 1 - 2 * i, 0, height, color);
  front(ctx, item, i, details);
}

const DRAW = {
  bed(ctx, item, t, env) {
    const { x, y, color } = item;
    const occupant = env.occupant;
    shadow(ctx, at(x + 0.55, y + 1.05).x, at(x + 0.55, y + 1.05).y, 46, 22);
    legs(ctx, x + 0.14, y + 0.2, 0.72, 1.62, 8, '#9aa4ad');
    isoBox(ctx, x + 0.06, y + 0.02, 0.88, 0.12, 6, 32, color);
    isoBox(ctx, x + 0.08, y + 0.14, 0.84, 1.74, 7, 6, '#cfd6dd');
    isoBox(ctx, x + 0.1, y + 0.14, 0.8, 1.72, 13, 7, '#fbf8ef');
    const pillow = at(x + 0.5, y + 0.45, 22);
    ellipse(ctx, pillow.x, pillow.y, 17, 8.5, '#ffffff', INK, 1.1, 0.12);
    if (occupant) occupant.draw(ctx, at(x + 0.5, y + 0.82, 21));
    const start = occupant ? 0.92 : 0.8;
    isoBox(ctx, x + 0.08, y + start, 0.84, 1.88 - start, 13, 10, color, { top: shade(color, 0.22) });
    isoRect(ctx, x + 0.08, y + start, 0.84, 0.16, '#fff', INK, 23.5);
    for (const [px, py] of [[0.3, 1.35], [0.7, 1.55], [0.35, 1.7]]) {
      const p = at(x + px, y + py, 23.5);
      star(ctx, p.x, p.y, 4, 'rgba(255,255,255,0.65)');
    }
    if (occupant?.cast) {
      const a = at(x + 0.62, y + 1.25, 25);
      const b = at(x + 0.62, y + 1.72, 33);
      line(ctx, [a, b], INK, 12);
      line(ctx, [a, b], '#f4f1e8', 9.5);
      ellipse(ctx, b.x - 2, b.y + 1, 4, 3.4, occupant.skin);
      heart(ctx, (a.x + b.x) / 2, (a.y + b.y) / 2, 2.4, '#e8483f', null);
    }
    isoBox(ctx, x + 0.06, y + 1.86, 0.88, 0.1, 5, 20, color);
  },

  chair(ctx, item, t, env) {
    const { x, y, color } = item;
    shadow(ctx, at(x + 0.5, y + 0.55).x, at(x + 0.5, y + 0.55).y, 24);
    legs(ctx, x + 0.22, y + 0.22, 0.56, 0.56, 14, '#7a5a40');
    isoBox(ctx, x + 0.18, y + 0.16, 0.64, 0.12, 14, 28, color);
    isoBox(ctx, x + 0.18, y + 0.2, 0.64, 0.62, 12, 5, color);
    if (env.occupant) env.occupant.draw(ctx, at(x + 0.5, y + 0.55, 0));
  },

  chairSmall(ctx, item) {
    const { x, y, color } = item;
    shadow(ctx, at(x + 0.5, y + 0.55).x, at(x + 0.5, y + 0.55).y, 17);
    legs(ctx, x + 0.3, y + 0.3, 0.4, 0.4, 10, shade(color, -0.35));
    isoBox(ctx, x + 0.28, y + 0.26, 0.44, 0.08, 10, 18, color);
    isoBox(ctx, x + 0.28, y + 0.28, 0.44, 0.44, 8, 4, color);
  },

  wardrobe(ctx, item) {
    cabinet(ctx, item, 66, item.color, (c) => {
      const w = 27;
      rrect(c, 2, -62, w / 2 - 2.5, 56, 2, shade(item.color, 0.1));
      rrect(c, w / 2 + 1, -62, w / 2 - 2.5, 56, 2, shade(item.color, 0.1));
      ellipse(c, w / 2 - 2, -32, 1.4, 2, '#ffe08a');
      ellipse(c, w / 2 + 3, -32, 1.4, 2, '#ffe08a');
      star(c, 7, -50, 3.4, '#fff3a6');
    });
  },

  drawers(ctx, item) {
    cabinet(ctx, item, 32, item.color, (c) => {
      for (let i = 0; i < 3; i++) {
        rrect(c, 3, -29 + i * 9.4, 21, 8, 1.5, shade(item.color, 0.14));
        rrect(c, 10, -26 + i * 9.4, 7, 2, 1, '#6d5340', null);
      }
    });
    const top = at(item.x + 0.5, item.y + 0.5, 32);
    drawToy(ctx, 'macchinina', top.x, top.y - 6, 0.6);
  },

  nightstand(ctx, item) {
    const { x, y } = item;
    shadow(ctx, at(x + 0.5, y + 0.5).x, at(x + 0.5, y + 0.5).y, 20);
    isoBox(ctx, x + 0.22, y + 0.2, 0.56, 0.56, 0, 22, '#d7b184');
    onFaceY(ctx, x + 0.22, y + 0.76, 0, (c) => {
      rrect(c, 2.5, -19, 13, 7, 1.5, '#e8c8a0');
      ellipse(c, 9, -15.5, 1.2, 1.2, INK, null);
    });
    const p = at(x + 0.5, y + 0.45, 22);
    rrect(ctx, p.x - 1, p.y - 10, 2, 10, 0, '#8a6c52');
    poly(ctx, [{ x: p.x - 9, y: p.y - 9 }, { x: p.x + 9, y: p.y - 9 }, { x: p.x + 5, y: p.y - 18 }, { x: p.x - 5, y: p.y - 18 }], '#ffd96b');
  },

  ivstand(ctx, item) {
    const base = at(item.x + 0.5, item.y + 0.5);
    ellipse(ctx, base.x, base.y, 10, 5, '#8c969e');
    line(ctx, [base, { x: base.x, y: base.y - 58 }], INK, 3.6);
    line(ctx, [base, { x: base.x, y: base.y - 58 }], '#cdd5db', 1.8);
    line(ctx, [{ x: base.x - 9, y: base.y - 57 }, { x: base.x + 9, y: base.y - 57 }], INK, 2);
    rrect(ctx, base.x + 4, base.y - 55, 9, 14, 3, 'rgba(190, 232, 255, 0.9)');
    line(ctx, [{ x: base.x + 8.5, y: base.y - 41 }, { x: base.x + 11, y: base.y - 26 }, { x: base.x + 5, y: base.y - 18 }], '#6fa9c9', 1);
  },

  monitor(ctx, item, t) {
    const { x, y } = item;
    isoBox(ctx, x + 0.2, y + 0.2, 0.6, 0.5, 0, 24, '#aeb9c2');
    isoBox(ctx, x + 0.15, y + 0.3, 0.7, 0.28, 24, 24, '#e6ebef');
    onFaceY(ctx, x + 0.15, y + 0.58, 24, (c) => {
      rrect(c, 2.5, -20.5, 17.5, 16, 1.5, '#10362c');
      c.beginPath();
      const shift = (t * 18) % 16;
      for (let u = 0; u <= 15; u++) {
        const k = (u + shift) % 16;
        const v = k > 6 && k < 8 ? -6 : k >= 8 && k < 10 ? 3 : 0;
        c.lineTo(3.5 + u, -12 + v);
      }
      c.strokeStyle = '#5dff9b';
      c.lineWidth = 1.2;
      c.stroke();
    });
  },

  tv(ctx, item, t) {
    cabinet(ctx, item, 24, '#a97c55', (c) => {
      rrect(c, 3, -20, 21, 15, 2, '#8a6141');
    });
    const { x, y } = item;
    isoBox(ctx, x + 0.2, y + 0.12, 0.3, 0.76, 24, 32, '#41454f');
    onFaceX(ctx, x + 0.5, y + 0.88, 24, (c) => {
      c.save();
      c.beginPath();
      c.rect(2, -29, 20, 25);
      c.clip();
      const channel = (item.channel + Math.floor(t / 9)) % 3;
      if (channel === 0) {
        c.fillStyle = '#7fd1f5';
        c.fillRect(2, -29, 20, 25);
        c.fillStyle = '#69bd55';
        c.fillRect(2, -11, 20, 7);
        ellipse(c, 6 + ((t * 7) % 13), -14 - Math.abs(Math.sin(t * 4)) * 9, 3.5, 3.5, '#ef5b4c');
        ellipse(c, 18, -23, 3, 3, '#ffe066', null);
      } else if (channel === 1) {
        c.fillStyle = '#1d2457';
        c.fillRect(2, -29, 20, 25);
        for (let i = 0; i < 7; i++) ellipse(c, 3 + ((i * 7.3) % 19), -28 + ((i * 11 + t * 9) % 23), 0.7, 0.7, '#fff', null);
        const ry = -16 + Math.sin(t * 3) * 2;
        poly(c, [{ x: 8, y: ry + 6 }, { x: 12, y: ry - 8 }, { x: 16, y: ry + 6 }], '#f2f2f2');
        ellipse(c, 12, ry + 9, 1.8, 3, '#ffae2b', null);
      } else {
        c.fillStyle = '#2b9cc4';
        c.fillRect(2, -29, 20, 25);
        const fx = 4 + ((t * 5) % 16);
        ellipse(c, fx, -17, 4.5, 3, '#ff9f43');
        poly(c, [{ x: fx - 4, y: -17 }, { x: fx - 8, y: -20 }, { x: fx - 8, y: -14 }], '#ff9f43');
        ellipse(c, fx + 2, -18, 0.8, 0.8, INK, null);
      }
      c.restore();
      c.strokeStyle = INK;
      c.lineWidth = 1.2;
      c.strokeRect(2, -29, 20, 25);
    });
  },

  bathtub(ctx, item) {
    const { x, y, w, d } = item;
    shadow(ctx, at(x + 0.55, y + 1.05).x, at(x + 0.55, y + 1.05).y, 44, 20);
    isoBox(ctx, x + 0.1, y + 0.12, w - 0.2, d - 0.24, 3, 17, '#f6f7f4');
    isoRect(ctx, x + 0.2, y + 0.24, w - 0.4, d - 0.48, '#8fd6ec', INK, 20);
    for (const [bx, by, r] of [[0.35, 0.5, 5], [0.6, 0.7, 6.5], [0.45, 1.0, 4], [0.65, 1.35, 5], [0.35, 1.5, 3.5]]) {
      const p = at(x + bx, y + by, 21);
      ellipse(ctx, p.x, p.y, r, r * 0.75, '#fff', '#b8dde8', 0.8);
    }
    // paperella
    const q = at(x + 0.5, y + 1.25, 23);
    ellipse(ctx, q.x, q.y, 6, 4, '#ffd52e');
    ellipse(ctx, q.x + 3.5, q.y - 5, 3.6, 3.4, '#ffd52e');
    poly(ctx, [{ x: q.x + 6.5, y: q.y - 5 }, { x: q.x + 10, y: q.y - 4 }, { x: q.x + 6.5, y: q.y - 3 }], '#ff8a2b', INK, 0.7);
    ellipse(ctx, q.x + 4.5, q.y - 6, 0.7, 0.7, INK, null);
    const tap = at(x + 0.5, y + 0.2, 20);
    line(ctx, [tap, { x: tap.x, y: tap.y - 9 }, { x: tap.x - 6, y: tap.y - 6 }], '#7d8a93', 3);
  },

  sink(ctx, item) {
    const { x, y } = item;
    isoBox(ctx, x + 0.34, y + 0.34, 0.32, 0.32, 0, 22, '#dfe6ea');
    isoBox(ctx, x + 0.18, y + 0.2, 0.64, 0.58, 22, 8, '#fbfcfb');
    isoRect(ctx, x + 0.28, y + 0.32, 0.44, 0.36, '#a8d8e8', INK, 30.5);
    const p = at(x + 0.5, y + 0.25, 30);
    line(ctx, [p, { x: p.x, y: p.y - 8 }, { x: p.x - 5, y: p.y - 5 }], '#7d8a93', 2.6);
  },

  plant(ctx, item) {
    const p = at(item.x + 0.5, item.y + 0.55);
    shadow(ctx, p.x, p.y, 17);
    poly(ctx, [{ x: p.x - 11, y: p.y - 17 }, { x: p.x + 11, y: p.y - 17 }, { x: p.x + 7, y: p.y }, { x: p.x - 7, y: p.y }], '#cf6f45');
    rrect(ctx, p.x - 12.5, p.y - 20, 25, 5, 2, '#e08357');
    const sway = (item.x % 3) - 1;
    const leaves = [[-10, -27, -0.7], [10, -28, 0.7], [-5, -37, -0.25], [6, -39, 0.3], [0, -29, 0]];
    for (const [lx, ly, rot] of leaves) ellipse(ctx, p.x + lx + sway, p.y + ly, 6, 12, lx % 2 ? '#4f9f47' : '#63b755', INK, 1.1, rot);
    if (item.flowers) {
      for (const [fx, fy, color] of [[-9, -34, '#ff7aa8'], [4, -45, '#ffd23f'], [11, -33, '#fff']]) {
        ellipse(ctx, p.x + fx + sway, p.y + fy, 4.2, 4.2, color);
        ellipse(ctx, p.x + fx + sway, p.y + fy, 1.4, 1.4, '#f59f00', null);
      }
    }
  },

  rocket(ctx, item, t) {
    const p = at(item.x + 0.5, item.y + 0.55);
    shadow(ctx, p.x, p.y, 17);
    poly(ctx, [{ x: p.x - 9, y: p.y - 18 }, { x: p.x - 17, y: p.y - 2 }, { x: p.x - 7, y: p.y - 6 }], '#e8483f');
    poly(ctx, [{ x: p.x + 9, y: p.y - 18 }, { x: p.x + 17, y: p.y - 2 }, { x: p.x + 7, y: p.y - 6 }], '#e8483f');
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y - 6);
    ctx.bezierCurveTo(p.x - 15, p.y - 30, p.x - 6, p.y - 46, p.x, p.y - 52);
    ctx.bezierCurveTo(p.x + 6, p.y - 46, p.x + 15, p.y - 30, p.x + 8, p.y - 6);
    ctx.closePath();
    ctx.fillStyle = '#f2f4f8';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.stroke();
    ellipse(ctx, p.x, p.y - 28, 5.5, 5.5, '#7fd1f5', INK, 1.6);
    ellipse(ctx, p.x, p.y - 2, 4, 3 + Math.sin(t * 12), '#ffae2b', null);
  },

  toychest(ctx, item) {
    const { x, y, color } = item;
    isoBox(ctx, x + 0.12, y + 0.2, 0.76, 0.6, 0, 18, color);
    const p = at(x + 0.5, y + 0.5, 20);
    drawRoundBalloon(ctx, p.x + 8, p.y - 7, 6, '#ffc928');
    drawToy(ctx, 'costruzioni', p.x - 8, p.y - 5, 0.75);
    onFaceY(ctx, x + 0.12, y + 0.8, 0, (c) => {
      star(c, 12, -9, 5, '#fff3a6', INK);
    });
  },

  vending(ctx, item, t) {
    const { x, y } = item;
    isoBox(ctx, x + 0.08, y + 0.1, 0.84, 0.7, 0, 62, '#d94b45');
    onFaceY(ctx, x + 0.08, y + 0.8, 0, (c) => {
      rrect(c, 2.5, -57, 16, 36, 2, '#bfeaf2');
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          rrect(c, 4 + col * 5, -54 + row * 9, 3.6, 6, 1, BALLOON_COLORS[(row + col) % 6], INK, 0.6);
        }
      }
      rrect(c, 20.5, -52, 4.5, 14, 1, '#333');
      ellipse(c, 22.7, -34, 1.3, 1.3, Math.sin(t * 3) > 0 ? '#7dff8a' : '#2a6b34', null);
      rrect(c, 4, -14, 15, 7, 1, '#40201e');
    });
  },

  water(ctx, item) {
    const { x, y } = item;
    isoBox(ctx, x + 0.25, y + 0.25, 0.5, 0.5, 0, 28, '#eef1f2');
    const p = at(x + 0.5, y + 0.5, 28);
    rrect(ctx, p.x - 9, p.y - 25, 18, 24, 6, 'rgba(140, 205, 245, 0.92)');
    line(ctx, [{ x: p.x - 5, y: p.y - 20 }, { x: p.x - 5, y: p.y - 7 }], 'rgba(255,255,255,0.8)', 2);
  },

  desk(ctx, item) {
    const { x, y, w } = item;
    shadow(ctx, at(x + 1.05, y + 0.6).x, at(x + 1.05, y + 0.6).y, 50, 22);
    isoBox(ctx, x + 0.05, y + 0.28, w - 0.1, 0.6, 0, 27, '#7fb6a8');
    isoBox(ctx, x, y + 0.22, w, 0.72, 27, 4, '#e8d3ac');
    onFaceY(ctx, x + 0.05, y + 0.88, 0, (c) => {
      rrect(c, 20, -21, 22, 15, 3, '#fff');
      heart(c, 31, -14, 5, '#e8483f');
    });
    isoBox(ctx, x + 1.35, y + 0.4, 0.42, 0.1, 31, 17, '#3d434c');
    const p = at(x + 0.4, y + 0.6, 32);
    drawToy(ctx, 'libro', p.x, p.y - 4, 0.6);
  },

  wheelchair(ctx, item) {
    const p = at(item.x + 0.5, item.y + 0.55);
    shadow(ctx, p.x, p.y, 22);
    rrect(ctx, p.x - 13, p.y - 38, 6, 24, 2, '#3f6fb5');
    poly(ctx, [{ x: p.x - 12, y: p.y - 18 }, { x: p.x + 7, y: p.y - 14 }, { x: p.x + 12, y: p.y - 18 }, { x: p.x - 7, y: p.y - 22 }], '#5087d6');
    line(ctx, [{ x: p.x + 8, y: p.y - 15 }, { x: p.x + 13, y: p.y - 3 }], '#59646d', 2.4);
    ellipse(ctx, p.x + 13, p.y - 2, 3.5, 3.5, '#444');
    for (const [dx, dy] of [[9, -17], [-7, -10]]) {
      ellipse(ctx, p.x + dx, p.y + dy, 10, 11.5, null, INK, 3.4);
      ellipse(ctx, p.x + dx, p.y + dy, 10, 11.5, null, '#8a949c', 1.2);
      for (let a = 0; a < 3; a++) {
        const c = Math.cos((a * Math.PI) / 3) * 9;
        const s = Math.sin((a * Math.PI) / 3) * 10;
        line(ctx, [{ x: p.x + dx - c, y: p.y + dy - s }, { x: p.x + dx + c, y: p.y + dy + s }], '#8a949c', 0.8);
      }
    }
  },

  bench(ctx, item) {
    const { x, y, w } = item;
    legs(ctx, x + 0.15, y + 0.35, w - 0.3, 0.4, 12, '#6b7780');
    isoBox(ctx, x + 0.08, y + 0.28, w - 0.16, 0.52, 11, 5, '#e2a14e');
    isoBox(ctx, x + 0.08, y + 0.74, w - 0.16, 0.08, 16, 15, '#e2a14e');
  },

  toyshelf(ctx, item, t, env) {
    const { x, y } = item;
    isoBox(ctx, x + 0.06, y + 0.08, 2.88, 0.62, 0, 66, '#c98f58');
    onFaceY(ctx, x + 0.06, y + 0.7, 0, (c) => {
      rrect(c, 4, -61, 84, 56, 2, '#8d5f3a');
      line(c, [{ x: 4, y: -33 }, { x: 88, y: -33 }], '#e0ad74', 4);
      TOY_IDS.forEach((id, i) => {
        const u = 18 + (i % 3) * 28;
        const v = i < 3 ? -45 : -16;
        if (env.shelfToys.includes(id)) drawToy(c, id, u, v, 1.05);
        else {
          c.setLineDash([3, 3]);
          rrect(c, u - 9, v - 9, 18, 18, 3, null, 'rgba(255,255,255,0.45)');
          c.setLineDash([]);
        }
      });
    });
    // insegna luminosa per farsi notare
    const p = at(x + 1.5, y + 0.4, 80 + Math.sin(t * 2.5) * 3);
    star(ctx, p.x, p.y, 8, '#ffe14d', INK);
  },

  bookshelf(ctx, item) {
    const { x, y, d } = item;
    isoBox(ctx, x + 0.08, y + 0.06, 0.55, d - 0.12, 0, 52, '#b07a4c');
    onFaceX(ctx, x + 0.63, y + d - 0.06, 0, (c) => {
      for (let row = 0; row < 3; row++) {
        const v = -48 + row * 16;
        rrect(c, 3, v, 54, 13, 1, '#7d5333');
        for (let i = 0; i < 9; i++) {
          const h = 8 + ((i * 5 + row * 3) % 4);
          rrect(c, 5 + i * 5.6, v + 13 - h, 4.4, h, 0.8, BALLOON_COLORS[(i + row * 2) % 6], INK, 0.7);
        }
      }
    });
  },

  fishtank(ctx, item, t) {
    const { x, y } = item;
    isoBox(ctx, x + 0.1, y + 0.1, 0.7, 0.8, 0, 22, '#8a6141');
    isoBox(ctx, x + 0.15, y + 0.15, 0.6, 0.7, 22, 28, '#67c4e6', { top: '#2e5866' });
    onFaceX(ctx, x + 0.75, y + 0.85, 22, (c) => {
      for (let i = 0; i < 3; i++) {
        const u = 11 + Math.sin(t * (0.8 + i * 0.3) + i * 2) * 6;
        const v = -22 + i * 7;
        const dir = Math.cos(t * (0.8 + i * 0.3) + i * 2) > 0 ? 1 : -1;
        const color = ['#ff9f43', '#ffe14d', '#ff6b81'][i];
        ellipse(c, u, v, 3.5, 2.2, color, INK, 0.7);
        poly(c, [{ x: u - dir * 3, y: v }, { x: u - dir * 6, y: v - 2.5 }, { x: u - dir * 6, y: v + 2.5 }], color, INK, 0.7);
      }
      line(c, [{ x: 5, y: -1 }, { x: 3, y: -8 }, { x: 6, y: -13 }], '#3f9d52', 2);
    });
  },

  slide(ctx, item) {
    const { x, y } = item;
    // torretta in fondo, scivolo che scende verso sud
    legs(ctx, x + 0.4, y + 0.2, 1.2, 0.9, 44, '#e8483f');
    isoBox(ctx, x + 0.35, y + 0.15, 1.3, 1.0, 40, 6, '#ffc928');
    poly(ctx, [at(x + 0.35, y + 0.15, 62), at(x + 1.65, y + 0.15, 62), at(x + 1.0, y + 0.15, 84)], '#3f8fe8');
    for (const px of [0.4, 1.6]) line(ctx, [at(x + px, y + 0.2, 44), at(x + px, y + 0.2, 62)], '#e8483f', 3);
    poly(ctx, [at(x + 0.55, y + 1.15, 45), at(x + 1.45, y + 1.15, 45), at(x + 1.45, y + 2.8, 5), at(x + 0.55, y + 2.8, 5)], '#52bd5a');
    for (const px of [0.55, 1.45]) {
      line(ctx, [at(x + px, y + 1.15, 49), at(x + px, y + 2.8, 9)], INK, 5);
      line(ctx, [at(x + px, y + 1.15, 49), at(x + px, y + 2.8, 9)], '#ffc928', 3);
    }
  },

  table(ctx, item) {
    const { x, y, w } = item;
    shadow(ctx, at(x + w / 2, y + 0.55).x, at(x + w / 2, y + 0.55).y, 44, 20);
    legs(ctx, x + 0.2, y + 0.24, w - 0.4, 0.52, 18, '#4a8fe0');
    isoBox(ctx, x + 0.08, y + 0.12, w - 0.16, 0.76, 18, 4, '#ffd966');
    const a = at(x + 0.6, y + 0.5, 24);
    drawToy(ctx, 'pennarelli', a.x, a.y - 4, 0.7);
    isoRect(ctx, x + 1.05, y + 0.3, 0.45, 0.35, '#fff', INK, 22.5);
  },

  rockinghorse(ctx, item, t) {
    const p = at(item.x + 0.5, item.y + 0.55);
    shadow(ctx, p.x, p.y, 22);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.sin(t * 1.8) * 0.07);
    ctx.beginPath();
    ctx.arc(0, -26, 28, Math.PI * 0.25, Math.PI * 0.75);
    ctx.strokeStyle = '#a0522d';
    ctx.lineWidth = 4;
    ctx.stroke();
    for (const lx of [-11, 9]) line(ctx, [{ x: lx, y: -18 }, { x: lx * 1.3, y: -1 }], '#c98a4c', 5);
    ellipse(ctx, -1, -22, 16, 9, '#e0a35c');
    poly(ctx, [{ x: 6, y: -25 }, { x: 13, y: -43 }, { x: 22, y: -40 }, { x: 22, y: -34 }, { x: 15, y: -33 }, { x: 14, y: -20 }], '#e0a35c');
    line(ctx, [{ x: 12, y: -43 }, { x: 5, y: -29 }], '#6b3f22', 4);
    ellipse(ctx, 16, -39, 1.3, 1.3, INK, null);
    line(ctx, [{ x: -16, y: -24 }, { x: -21, y: -14 }], '#6b3f22', 4);
    ellipse(ctx, -3, -29, 8, 3.5, '#e8483f');
    ctx.restore();
  },

  beanbag(ctx, item) {
    const p = at(item.x + 0.5, item.y + 0.55);
    shadow(ctx, p.x, p.y + 1, 25);
    ctx.beginPath();
    ctx.moveTo(p.x - 22, p.y - 4);
    ctx.bezierCurveTo(p.x - 24, p.y - 24, p.x - 6, p.y - 27, p.x, p.y - 20);
    ctx.bezierCurveTo(p.x + 14, p.y - 27, p.x + 26, p.y - 12, p.x + 21, p.y - 2);
    ctx.bezierCurveTo(p.x + 10, p.y + 9, p.x - 14, p.y + 9, p.x - 22, p.y - 4);
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.stroke();
    ellipse(ctx, p.x - 2, p.y - 12, 12, 5, shade(item.color, 0.2), null);
  },

  tent(ctx, item) {
    const { x, y } = item;
    const apex = at(x + 1, y + 1, 76);
    const sw = at(x + 0.1, y + 1.9);
    const se = at(x + 1.9, y + 1.9);
    const ne = at(x + 1.9, y + 0.1);
    shadow(ctx, at(x + 1, y + 1).x, at(x + 1, y + 1).y, 56, 28);
    poly(ctx, [sw, se, apex], '#8e5bd0');
    poly(ctx, [se, ne, apex], '#6f45a8');
    poly(ctx, [at(x + 0.65, y + 1.9), at(x + 1.35, y + 1.9), at(x + 1, y + 1.55, 38)], '#3b2558');
    star(ctx, apex.x - 22, apex.y + 46, 6, '#ffe14d', INK);
    line(ctx, [apex, { x: apex.x, y: apex.y - 12 }], INK, 1.5);
    poly(ctx, [{ x: apex.x, y: apex.y - 12 }, { x: apex.x + 13, y: apex.y - 8 }, { x: apex.x, y: apex.y - 4 }], '#ffc928');
  },

  ballpit(ctx, item) {
    const { x, y, w, d } = item;
    isoRect(ctx, x + 0.1, y + 0.1, w - 0.2, d - 0.2, '#2f6fc4', INK);
    isoBox(ctx, x + 0.05, y + 0.05, w - 0.1, 0.2, 0, 17, '#e8483f');
    isoBox(ctx, x + 0.05, y + 0.25, 0.2, d - 0.5, 0, 17, '#52bd5a');
    const balls = [];
    for (let i = 0; i < 74; i++) {
      balls.push([0.35 + ((i * 0.618) % 1) * (w - 0.65), 0.35 + ((i * 0.377) % 1) * (d - 0.65), i]);
    }
    balls.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
    for (const [bx, by, i] of balls) {
      const p = at(x + bx, y + by, 8 + Math.sin(i) * 1.2);
      ellipse(ctx, p.x, p.y, 6.5, 6.5, BALLOON_COLORS[i % 6], INK, 0.8);
      ellipse(ctx, p.x - 2, p.y - 2.2, 1.6, 1.6, 'rgba(255,255,255,0.7)', null);
    }
    isoBox(ctx, x + w - 0.25, y + 0.25, 0.2, d - 0.5, 0, 17, '#ffc928');
    isoBox(ctx, x + 0.05, y + d - 0.25, w - 0.1, 0.2, 0, 17, '#3f8fe8');
  },

  blocks(ctx, item) {
    const { x, y } = item;
    isoBox(ctx, x + 0.1, y + 0.4, 0.36, 0.36, 0, 12, '#e8483f');
    isoBox(ctx, x + 0.54, y + 0.45, 0.36, 0.36, 0, 12, '#3f8fe8');
    isoBox(ctx, x + 0.34, y + 0.12, 0.36, 0.36, 0, 12, '#52bd5a');
    isoBox(ctx, x + 0.32, y + 0.42, 0.36, 0.36, 12, 12, '#ffc928');
  },

  piano(ctx, item, t) {
    const { x, y } = item;
    isoBox(ctx, x + 0.1, y + 0.1, 0.5, 0.8, 0, 30, '#d94b72');
    isoBox(ctx, x + 0.6, y + 0.12, 0.24, 0.76, 17, 5, '#fff');
    for (let i = 0; i < 5; i++) isoRect(ctx, x + 0.6, y + 0.2 + i * 0.14, 0.14, 0.05, '#222', null, 22.4);
    const p = at(x + 0.35, y + 0.5, 44 + Math.sin(t * 2) * 3);
    line(ctx, [{ x: p.x + 4, y: p.y }, { x: p.x + 4, y: p.y - 13 }, { x: p.x + 10, y: p.y - 9 }], INK, 1.8);
    ellipse(ctx, p.x + 1, p.y, 3.6, 2.8, INK, null);
  },

  rug(ctx, item) {
    const { x, y, w, d } = item;
    isoRect(ctx, x + 0.05, y + 0.05, w - 0.1, d - 0.1, '#6cc4b8', INK);
    isoRect(ctx, x + 0.3, y + 0.3, w - 0.6, d - 0.6, '#fff1bd', '#3f8f86');
    isoRect(ctx, x + 0.6, y + 0.6, w - 1.2, d - 1.2, '#f49a8a', '#c25b4d');
    onFloor(ctx, x + w / 2, y + d / 2, (c) => {
      star(c, 0, 0, 26, '#ffd84a', '#c88a10');
    });
  },
};

export function drawFurniture(ctx, item, t, env) {
  DRAW[item.type](ctx, item, t, env);
}

export const FURNITURE_TYPES = Object.keys(DRAW);
