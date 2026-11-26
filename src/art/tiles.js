// Pavimenti, muri, decorazioni delle pareti e targhe delle stanze.
import { toScreen } from '../engine/iso.js';
import { DOORS, WALL_DECOR } from '../world/layout.js';
import { S } from '../strings.it.js';
import { INK, shade, poly, ellipse, rrect, line, isoRect, onFaceY, onFaceX, onFloor, star, heart } from './primitives.js';

export const THEMES = {
  giungla: { floor: ['#b9d98c', '#a9cd7a'], wall: '#d8edb4', accent: '#5a9e46' },
  spazio: { floor: ['#b3b6e0', '#a2a5d4'], wall: '#cfd0f2', accent: '#5b5fb5' },
  mare: { floor: ['#a8dbe6', '#95cfdc'], wall: '#cdeff4', accent: '#2f93b3' },
  fiori: { floor: ['#f2c4d4', '#eab2c6'], wall: '#fbdfe8', accent: '#d2608c' },
  corridoio: { floor: ['#e7dfc9', '#c9d3cf'], wall: '#efe6cc', accent: '#5f8f8a' },
  giochi: { floor: ['#f6d98a', '#f0cc73'], wall: '#fdebb2', accent: '#e2703a' },
};

const BACK_H = 82;
const INNER_H = 28;
const FRONT_H = 9;
const THICK = 0.14;

export function drawFloor(ctx, map) {
  // zoccolo sotto l'edificio
  const depth = 14;
  poly(ctx, [toScreen(0, map.height), toScreen(map.width, map.height), toScreen(map.width, map.height, -depth), toScreen(0, map.height, -depth)], '#6d5a4c');
  poly(ctx, [toScreen(map.width, 0), toScreen(map.width, map.height), toScreen(map.width, map.height, -depth), toScreen(map.width, 0, -depth)], '#584639');

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const area = map.areaAt(x, y);
      const t = THEMES[area];
      const color = t.floor[(x + y) % 2];
      isoRect(ctx, x, y, 1, 1, color, shade(color, -0.12));
      if (area === 'giochi' && (x * 7 + y * 3) % 11 === 0) {
        onFloor(ctx, x + 0.5, y + 0.5, (c) => star(c, 0, 0, 7, 'rgba(255,255,255,0.55)'));
      }
    }
  }

  // linea guida colorata in corridoio
  isoRect(ctx, 0.3, 7.93, 13.7, 0.14, '#7fb6a8');
}

export function drawDoorMats(ctx) {
  for (const d of DOORS) {
    const theme = THEMES[d.room];
    ctx.save();
    // tappetino davanti alla porta, dal lato corridoio, con il nome della stanza
    let x;
    let y;
    if (d.orient === 'v') {
      x = d.x - 1.8;
      y = d.y + 1;
      onFloor(ctx, x + 0.5, y, (c) => {
        c.rotate(-Math.PI / 2);
        mat(c, S.rooms[d.room], theme.accent);
      });
    } else {
      x = d.x + 1;
      // nelle stanze in basso il muro copre il pavimento vicino: la targa sta più in là
      y = d.room === 'giungla' || d.room === 'spazio' ? d.y + 0.5 : d.y - 1.2;
      onFloor(ctx, x, y, (c) => mat(c, S.rooms[d.room], theme.accent));
    }
    ctx.restore();
  }
}

function mat(c, label, color) {
  rrect(c, -31, -9, 62, 18, 5, color, shade(color, -0.4), 1.5);
  c.fillStyle = '#fff';
  c.font = 'bold 9px "Trebuchet MS", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, 0, 1, 58);
}

// Ritorna gli elementi muro con il loro ingombro, per l'ordinamento in profondità.
export function wallItems(map) {
  const has = new Set(map.walls.map((w) => `${w.orient}:${w.x},${w.y}`));
  const decor = new Map(WALL_DECOR.map((d) => [`${d.orient}:${d.x},${d.y}`, d.type]));
  return map.walls.map((w) => {
    const h = w.orient === 'h';
    const next = h ? `h:${w.x + 1},${w.y}` : `v:${w.x},${w.y + 1}`;
    const seg = { ...w, endCap: !has.has(next), decor: decor.get(`${w.orient}:${w.x},${w.y}`) };
    return {
      x0: w.x,
      x1: h ? w.x + 1 : w.x,
      y0: w.y,
      y1: h ? w.y : w.y + 1,
      draw: (ctx) => drawWall(ctx, seg),
    };
  });
}

function drawWall(ctx, w) {
  const theme = THEMES[w.area];
  const horizontal = w.orient === 'h';
  const height = w.kind === 'back' ? BACK_H : w.kind === 'front' ? FRONT_H : INNER_H;
  // le pareti di fondo hanno lo spessore verso l'esterno
  const lo = w.kind === 'back' ? -THICK : w.kind === 'front' ? 0 : -THICK / 2;
  const hi = lo + THICK;
  const at = (along, across, z) =>
    horizontal ? toScreen(w.x + along, w.y + across, z) : toScreen(w.x + across, w.y + along, z);

  const faceColor = w.kind === 'front' ? '#9a8069' : horizontal ? theme.wall : shade(theme.wall, -0.1);
  poly(ctx, [at(0, hi, 0), at(1, hi, 0), at(1, hi, height), at(0, hi, height)], faceColor, null);

  const dadoH = w.kind === 'back' ? 26 : 10;
  if (w.kind !== 'front') {
    const dado = shade(theme.accent, horizontal ? 0.35 : 0.22);
    poly(ctx, [at(0, hi, 0), at(1, hi, 0), at(1, hi, dadoH), at(0, hi, dadoH)], dado, null);
    line(ctx, [at(0, hi, dadoH), at(1, hi, dadoH)], theme.accent, 2.5);
  }

  if (w.kind === 'back') {
    const face = (fn) =>
      horizontal ? onFaceY(ctx, w.x, w.y + hi, 0, fn) : onFaceX(ctx, w.x + hi, w.y + 1, 0, fn);
    face((c) => {
      if (w.decor) drawDecor(c, w.decor, theme);
      else drawWallpaper(c, w.area, (w.x * 5 + w.y * 3) % 4);
    });
  }

  // chiusura laterale dove il muro finisce
  if (w.endCap) {
    poly(ctx, [at(1, lo, 0), at(1, hi, 0), at(1, hi, height), at(1, lo, height)], shade(faceColor, -0.25));
  }
  const cap = w.kind === 'front' ? '#c6ac92' : shade(theme.accent, 0.1);
  poly(ctx, [at(0, lo, height), at(1, lo, height), at(1, hi, height), at(0, hi, height)], cap, null);
  line(ctx, [at(0, lo, height), at(1, lo, height)], INK, 1.2);
  line(ctx, [at(0, hi, height), at(1, hi, height)], INK, 1);
  line(ctx, [at(0, hi, 0), at(1, hi, 0)], shade(theme.accent, -0.45), 1.2);
}

function drawWallpaper(c, area, variant) {
  const x = 8 + variant * 5;
  const y = -48 - (variant % 2) * 14;
  if (area === 'spazio') {
    star(c, x, y, 5, '#fff7b0');
    star(c, 30 - x / 2, y + 10, 3, '#fff7b0');
  } else if (area === 'giungla') {
    ellipse(c, x, y, 7, 3, '#7cbb57', null, 1, -0.6);
    ellipse(c, x + 9, y + 4, 7, 3, '#69a948', null, 1, 0.5);
  } else if (area === 'mare') {
    ellipse(c, x, y, 3.5, 3.5, 'rgba(255,255,255,0.8)', '#6cc0d6');
    ellipse(c, x + 7, y - 8, 2, 2, 'rgba(255,255,255,0.8)', '#6cc0d6');
  } else if (area === 'fiori') {
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      ellipse(c, x + Math.cos(a) * 4, y + Math.sin(a) * 4, 2.8, 2.8, '#f48fb1', null);
    }
    ellipse(c, x, y, 2.4, 2.4, '#ffd54f', null);
  } else if (area === 'giochi') {
    heart(c, x, y, 4, ['#ef6b5a', '#5aa9ef', '#6cc46c', '#b87fe0'][variant], null);
  }
}

function drawDecor(c, type, theme) {
  if (type === 'window') {
    rrect(c, 1, -72, 30, 40, 2, '#fdfaf0');
    rrect(c, 4, -69, 24, 34, 1, '#9fd8f5', '#7aa8bd');
    ellipse(c, 12, -59, 6, 3.5, '#fff', null);
    ellipse(c, 17, -61, 5, 4, '#fff', null);
    ellipse(c, 15, -37, 14, 6, '#8cc873', null);
    line(c, [{ x: 16, y: -69 }, { x: 16, y: -35 }], '#fdfaf0', 2);
    poly(c, [{ x: 1, y: -73 }, { x: 8, y: -73 }, { x: 3, y: -33 }, { x: 1, y: -33 }], theme.accent);
    poly(c, [{ x: 31, y: -73 }, { x: 24, y: -73 }, { x: 29, y: -33 }, { x: 31, y: -33 }], theme.accent);
    rrect(c, -1, -34, 34, 4, 1, '#d9c4a0');
  } else if (type === 'poster') {
    rrect(c, 5, -70, 22, 32, 2, '#fff');
    ellipse(c, 16, -59, 6, 6, '#ffca3a');
    poly(c, [{ x: 6, y: -39 }, { x: 14, y: -52 }, { x: 22, y: -39 }], '#63b265', null);
    poly(c, [{ x: 14, y: -39 }, { x: 21, y: -48 }, { x: 26, y: -39 }], '#4a9a52', null);
  } else if (type === 'drawing') {
    c.save();
    c.translate(16, -52);
    c.rotate(-0.07);
    rrect(c, -11, -13, 22, 26, 1, '#fffef6');
    ellipse(c, 0, -3, 4, 4, null, '#e2574c', 1.6);
    line(c, [{ x: 0, y: 1 }, { x: 0, y: 8 }], '#3b78c2', 1.6);
    line(c, [{ x: -5, y: 3 }, { x: 5, y: 3 }], '#3b78c2', 1.6);
    heart(c, 6, -8, 2.5, '#e2574c', null);
    ellipse(c, 0, -13, 2, 2, '#d0383e');
    c.restore();
  } else if (type === 'clock') {
    ellipse(c, 16, -58, 11, 11, '#fff', INK, 2);
    line(c, [{ x: 16, y: -65 }, { x: 16, y: -58 }, { x: 21, y: -55 }], INK, 1.8);
  } else if (type === 'entrance') {
    rrect(c, 1, -66, 30, 66, 2, '#7b8f99');
    rrect(c, 4, -62, 24, 58, 1, '#bfe4ee');
    line(c, [{ x: 8, y: -20 }, { x: 20, y: -52 }], 'rgba(255,255,255,0.75)', 3);
    line(c, [{ x: 16, y: -62 }, { x: 16, y: -4 }], '#7b8f99', 2);
    rrect(c, 7, -79, 18, 10, 2, '#2e9d5a');
    // croce del reparto
    c.fillStyle = '#fff';
    c.fillRect(14.5, -77, 3, 6);
    c.fillRect(13, -75.5, 6, 3);
  }
}
