// Compone la scena: pavimento, muri e arredi in ordine di profondità, poi le scritte.
import { toScreen } from '../engine/iso.js';
import { depthSort } from '../engine/depthSort.js';
import { drawFloor, drawDoorMats, wallItems } from './tiles.js';
import { drawFurniture } from './furniture.js';
import { drawCharacter } from './characterRig.js';
import { drawToy, drawBalloonShape, drawBacon, drawWeb, drawNote } from './props.js';
import { INK, ellipse, rrect, shadow, star, heart, poly } from './primitives.js';
import { happinessColor } from '../game/happiness.js';
import { SpriteCache } from './spriteCache.js';
import { S } from '../strings.it.js';

// Arredi animati; gli altri si dipingono una volta sola (letti e sedie cambiano con chi li occupa).
const ANIMATED = new Set(['tv', 'monitor', 'vending', 'fishtank', 'rocket', 'rockinghorse', 'toyshelf', 'piano']);
const FPS = 12;
const CHARACTER_BOX = { x: -70, y: -115, w: 140, h: 135 };
// durante i superpoteri serve più spazio per gli effetti; il personaggio non cambia misura
const SUPER_BOX = { x: -105, y: -165, w: 210, h: 190 };

// Numero del fotogramma; lo sfasamento distribuisce il lavoro tra gli oggetti.
const frameOf = (t, offset) => Math.floor(t * FPS + offset);

// Tutto ciò che cambia l'aspetto di un personaggio.
const signature = (o, offset) =>
  [frameOf(o.t, offset), o.pose, o.back, o.flip, o.expression, o.toy, o.balloon?.shape, o.balloon?.color, o.making?.shape, o.gear, o.frizz].join();

// Rettangolo di schermo che contiene tutto un oggetto, a partire dal suo ingombro.
function screenBox({ x0, y0, x1, y1 }) {
  const left = toScreen(x0 - 0.5, y1 + 0.5).x;
  const right = toScreen(x1 + 0.5, y0 - 0.5).x;
  const top = toScreen(x0, y0).y - 110;
  const bottom = toScreen(x1, y1).y + 24;
  return { x: left, y: top, w: right - left, h: bottom - top };
}

const headTop = (kid) => (kid.state === 'bed' ? 69 : 61);

function kidOptions(game, kid) {
  const opts = {
    t: game.time + kid.look.seed,
    expression: kid.expression,
    balloon: kid.balloon,
    toy: kid.toy?.id,
    frizz: kid.frizz > 0,
  };
  const cheering =
    kid.cheer > 0 ||
    game.volunteers.some(({ action }) => action?.type === 'super' && action.applied && action.audience.includes(kid));
  if (kid.state === 'bed') return { ...opts, pose: cheering ? 'bedCheer' : 'bed' };
  const pose = kid.moving ? 'walk' : cheering || kid.state === 'playing' ? 'cheer' : 'stand';
  return { ...opts, pose, phase: kid.phase, back: kid.back, flip: kid.flip };
}

function volunteerOptions(game, p) {
  const a = p.action;
  const opts = {
    t: game.time,
    gear: p.character.gear,
    toy: p.carried,
    back: p.back,
    flip: p.flip,
    phase: p.phase,
    pose: p.moving ? 'walk' : 'stand',
    expression: 'happy',
  };
  if (a?.type === 'balloon') {
    if (a.song) return { ...opts, pose: 'strum', back: false, toy: null, expression: 'joy' };
    return { ...opts, pose: 'pump', back: false, toy: null, progress: a.t / a.duration, making: { shape: a.shape, color: a.color } };
  }
  if (a?.type === 'super') {
    // breve slancio prima di entrare nella posa
    const pose = a.t < 0.35 || a.t > a.duration - 0.35 ? 'cheer' : a.move;
    return { ...opts, pose, back: false, toy: null, expression: 'joy', progress: a.t / a.duration };
  }
  if (a?.type === 'giving') return { ...opts, toy: a.toyId, expression: 'joy' };
  if (a?.type === 'playing' && !p.moving) return { ...opts, pose: 'cheer', back: false, expression: 'joy' };
  return opts;
}

function groundBox({ width, height }) {
  const x = toScreen(0, height).x - 4;
  return { x, y: -4, w: toScreen(width, 0).x + 4 - x, h: toScreen(width, height).y + 24 };
}

export class Scene {
  constructor() {
    this.walls = null;
    this.marker = null;
    this.cache = new SpriteCache();
  }

  cached(key, item, version) {
    const box = screenBox(item);
    return { ...item, draw: (ctx) => this.cache.draw(ctx, key, box, item.draw, { version }) };
  }

  mark(x, y) {
    this.marker = { x, y, t: 0 };
  }

  items(game) {
    if (this.walls?.map !== game.map) {
      this.cache.clear();
      this.walls = { map: game.map, list: wallItems(game.map).map((w, i) => this.cached(`wall${i}`, w)) };
    }
    const out = [...this.walls.list];
    const t = game.time;

    for (const [index, item] of game.furniture.entries()) {
      if (item.floor) continue;
      let occupant = null;
      let version = ANIMATED.has(item.type) ? `${frameOf(t, index * 0.37)}` : '';
      if (item.type === 'bed') {
        const kid = game.kids.find((k) => k.state === 'bed' && k.bed.id === item.id);
        if (kid) {
          const opts = kidOptions(game, kid);
          version = `${kid.id},${signature(opts, index * 0.37)}`;
          occupant = {
            cast: kid.bedridden,
            skin: kid.look.skin,
            draw: (ctx, p) => this.at(ctx, p, () => drawCharacter(ctx, kid.look, opts)),
          };
        }
      } else if (item.type === 'chair') {
        const parent = game.adults.find((a) => a.chair === item && a.state === 'sit');
        if (parent) {
          const opts = { pose: 'sit', t, expression: 'happy' };
          version = `${parent.id},${signature(opts, index * 0.37)}`;
          occupant = { draw: (ctx, p) => this.at(ctx, p, () => drawCharacter(ctx, parent.look, opts)) };
        }
      }
      const env = { occupant, shelfToys: game.shelf.list() };
      const placed = {
        x0: item.x,
        y0: item.y,
        x1: item.x + item.w,
        y1: item.y + item.d,
        draw: (ctx) => drawFurniture(ctx, item, t, env),
      };
      out.push(this.cached(`item${index}`, placed, version));
    }

    const walker = (who, draw) => {
      const r = 0.22;
      out.push({ x0: who.x - r, y0: who.y - r, x1: who.x + r, y1: who.y + r, draw });
    };
    const person = (key, who, look, opts, offset, stage = false) =>
      walker(who, (ctx) => {
        const anchor = toScreen(who.x, who.y);
        shadow(ctx, anchor.x, anchor.y, look.kid ? 11 : 15);
        const paint = (g) => drawCharacter(g, look, opts);
        this.cache.draw(ctx, key, stage ? SUPER_BOX : CHARACTER_BOX, paint, { version: signature(opts, offset), anchor });
      });

    game.kids.forEach((kid, i) => {
      if (kid.state !== 'bed') person(kid.id, kid, kid.look, kidOptions(game, kid), i * 0.29);
    });
    game.adults.forEach((a, i) => {
      if (a.state === 'sit') return;
      const opts = { pose: a.moving ? 'walk' : 'stand', t: t + a.x * (a.moving ? 0 : 1), phase: a.phase, back: a.back, flip: a.flip };
      person(a.id, a, a.look, opts, i * 0.43);
    });
    game.volunteers.forEach((v, i) => {
      const key = v === game.player ? 'player' : `colleague${i}`;
      person(key, v, v.character.look, volunteerOptions(game, v), i * 0.37, v.action?.type === 'super');
    });
    return out;
  }

  at(ctx, p, fn) {
    ctx.save();
    ctx.translate(p.x, p.y);
    fn();
    ctx.restore();
  }

  render(ctx, game, camera, dpr, dt) {
    const { view } = camera;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, view.h);
    bg.addColorStop(0, '#4f7f63');
    bg.addColorStop(1, '#2f5646');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, view.w, view.h);

    const o = camera.offset;
    ctx.setTransform(dpr * camera.zoom, 0, 0, dpr * camera.zoom, dpr * o.x, dpr * o.y);
    ctx.lineCap = 'round';
    this.cache.setScale(dpr * camera.zoom);
    const items = this.items(game);
    this.cache.draw(ctx, 'floor', groundBox(game.map), (g) => {
      drawFloor(g, game.map);
      drawDoorMats(g);
      for (const item of game.furniture) {
        if (item.floor) drawFurniture(g, item, 0, {});
      }
    });
    this.floorMarks(ctx, game, dt);
    for (const item of depthSort(items)) item.draw(ctx);
    this.particles(ctx, game);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.labels(ctx, game, camera);
  }

  floorMarks(ctx, game, dt) {
    if (this.marker) {
      this.marker.t += dt;
      const k = this.marker.t / 0.6;
      if (k >= 1) this.marker = null;
      else {
        const p = toScreen(this.marker.x, this.marker.y);
        ellipse(ctx, p.x, p.y, 20 * (1 - k * 0.6), 10 * (1 - k * 0.6), null, `rgba(255,255,255,${1 - k})`, 2.5);
      }
    }
    const kid = game.selectedKid;
    if (kid) {
      const pulse = 1 + Math.sin(game.time * 6) * 0.08;
      if (kid.state === 'bed') {
        const { x, y, w, d } = kid.bed;
        poly(ctx, [toScreen(x - 0.1, y - 0.05), toScreen(x + w + 0.1, y - 0.05), toScreen(x + w + 0.1, y + d + 0.1), toScreen(x - 0.1, y + d + 0.1)], 'rgba(255, 226, 80, 0.45)', '#ffd21f', 2.5 * pulse);
      } else {
        const p = toScreen(kid.x, kid.y);
        ellipse(ctx, p.x, p.y, 21 * pulse, 10.5 * pulse, 'rgba(255, 226, 80, 0.4)', '#ffd21f', 2.5);
      }
    }
  }

  particles(ctx, game) {
    for (const p of game.particles) {
      const s = toScreen(p.x, p.y, p.z);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - (p.t / p.life) ** 2);
      ctx.translate(s.x, s.y);
      if (p.kind === 'heart') heart(ctx, 0, 0, 5, p.color);
      else if (p.kind === 'note') drawNote(ctx, 0, 0, 0.9, p.color);
      else if (p.kind === 'bacon') drawBacon(ctx, 0, 0, p.spin + p.t * 9, 0.9);
      else if (p.kind === 'web') drawWeb(ctx, 0, 0, 4 + p.t * 9);
      else {
        ctx.rotate(p.spin + p.t * 9);
        if (p.kind === 'shard') poly(ctx, [{ x: -5, y: -2 }, { x: 4, y: -4 }, { x: 1, y: 4 }], p.color, INK, 0.8);
        else rrect(ctx, -2.5, -1.5, 5, 3, 0.5, p.color, null);
      }
      ctx.restore();
    }
  }

  // Barre della felicità, pensieri, fumetti e numeri: disegnati in pixel schermo.
  labels(ctx, game, camera) {
    const s = Math.min(1.6, Math.max(0.85, camera.zoom));
    for (const kid of game.kids) {
      const p = camera.worldToView(kid.x, kid.y, headTop(kid));
      this.happinessBar(ctx, p.x, p.y, s, kid.happiness, game.selected === kid.id);
      const wishing =
        !kid.toy && !kid.bubble && kid.state !== 'playing' &&
        (game.player.carried || game.selected === kid.id || (game.time + kid.look.seed * 6) % 26 < 3.5);
      if (wishing) this.thought(ctx, p.x + 25 * s, p.y - 13 * s, s, kid.favourite, game.player.carried === kid.favourite);
    }

    // nomi dei colleghi e segnalino sopra il proprio volontario
    for (const colleague of game.colleagues) {
      const p = camera.worldToView(colleague.x, colleague.y, -4);
      this.nameTag(ctx, p.x, p.y, s, S.characters[colleague.character.id].name);
    }
    const hero = game.player;
    if (hero.action?.type !== 'super' && !hero.bubble) {
      const p = camera.worldToView(hero.x, hero.y, 98 + Math.sin(game.time * 4) * 3);
      poly(ctx, [{ x: p.x - 8 * s, y: p.y - 9 * s }, { x: p.x + 8 * s, y: p.y - 9 * s }, { x: p.x, y: p.y + 2 * s }], '#7ee04f', INK, 1.8);
    }

    for (const who of game.volunteers) {
      const { action } = who;
      if (action?.type !== 'balloon') continue;
      const p = camera.worldToView(who.x, who.y, 96);
      const k = action.t / action.duration;
      rrect(ctx, p.x - 26 * s, p.y - 4 * s, 52 * s, 8 * s, 4 * s, '#fff', INK, 1.5);
      rrect(ctx, p.x - 24 * s, p.y - 2 * s, Math.max(2, 48 * s * k), 4 * s, 2 * s, action.color, null);
      if (action.song) drawNote(ctx, p.x + 38 * s, p.y, 1.3 * s, action.color);
      else drawBalloonShape(ctx, action.shape, p.x + 38 * s, p.y, 0.55 * s, action.color);
    }

    const speaking = [...game.volunteers, ...game.kids, ...game.adults].filter((w) => w.bubble);
    for (const who of speaking) {
      let z = 98;
      if (who.character) z = 112;
      else if (who.look.kid) z = headTop(who) + 10;
      else if (who.state === 'sit') z = 76;
      const p = camera.worldToView(who.x, who.y, z);
      // chi è fuori dall'inquadratura non si fa "sentire"
      if (p.x < 0 || p.x > camera.view.w || p.y < 0 || p.y > camera.view.h) continue;
      this.bubble(ctx, p.x, p.y, s, who.bubble.text, camera.view.w);
    }

    for (const f of game.floaters) {
      const p = camera.worldToView(f.x, f.y, f.z + f.t * 28);
      p.x += f.dx * s;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (f.life - f.t) * 2);
      ctx.font = `900 ${Math.round(17 * s)}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fff';
      ctx.strokeText(f.text, p.x, p.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, p.x, p.y);
      ctx.restore();
    }
  }

  nameTag(ctx, x, y, s, name) {
    ctx.font = `bold ${Math.round(11 * s)}px "Trebuchet MS", sans-serif`;
    const w = ctx.measureText(name).width + 12 * s;
    rrect(ctx, x - w / 2, y, w, 16 * s, 8 * s, 'rgba(255, 247, 227, 0.92)', INK, 1.2);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, y + 8.5 * s);
    ctx.textBaseline = 'alphabetic';
  }

  happinessBar(ctx, x, y, s, value, selected) {
    const w = 34 * s;
    const h = 8 * s;
    rrect(ctx, x - w / 2, y - h, w, h, h / 2, '#3a2c2a', selected ? '#ffd21f' : '#fff', selected ? 2.5 : 1.5);
    const fill = Math.max(h - 3, (w - 3) * (value / 100));
    rrect(ctx, x - w / 2 + 1.5, y - h + 1.5, fill, h - 3, (h - 3) / 2, happinessColor(value), null);
    if (value >= 99.5) star(ctx, x + w / 2 + 3, y - h / 2, 6 * s, '#ffd21f', INK);
  }

  thought(ctx, x, y, s, toy, match) {
    ellipse(ctx, x - 9 * s, y + 10 * s, 2.5 * s, 2.5 * s, '#fff', INK, 1);
    ellipse(ctx, x, y, 12 * s, 11 * s, match ? '#fff3a8' : '#fff', match ? '#e08a00' : INK, match ? 2.2 : 1.1);
    drawToy(ctx, toy, x, y, 0.85 * s);
  }

  bubble(ctx, x, y, s, text, viewW) {
    const size = Math.round(12.5 * s);
    ctx.font = `bold ${size}px "Trebuchet MS", sans-serif`;
    const max = Math.min(180 * s, viewW - 24);
    const lines = [''];
    for (const word of text.split(' ')) {
      const test = lines.at(-1) ? `${lines.at(-1)} ${word}` : word;
      if (ctx.measureText(test).width > max && lines.at(-1)) lines.push(word);
      else lines[lines.length - 1] = test;
    }
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 16;
    const h = lines.length * (size + 3) + 9;
    const left = Math.min(viewW - w - 4, Math.max(4, x - w / 2));
    const top = Math.max(4, y - h - 8);
    poly(ctx, [{ x: x - 5, y: top + h - 2 }, { x: x + 6, y: top + h - 2 }, { x, y: top + h + 8 }], '#fff', INK, 1.4);
    rrect(ctx, left, top, w, h, 9, '#fff', INK, 1.4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 4, top + h - 3, 9, 3);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, left + w / 2, top + 5 + (size + 3) * (i + 0.5)));
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- selezione con mouse o dito ----------
  pick(game, camera, px, py) {
    const zoom = camera.zoom;
    const hitsSprite = (who, baseZ, height, half) => {
      const p = camera.worldToView(who.x, who.y, baseZ);
      return Math.abs(px - p.x) <= Math.max(22, half * zoom) && py <= p.y + 8 * zoom && py >= p.y - height * zoom;
    };
    // colpisce il volume di un mobile: si prova a diverse altezze
    const hitsVolume = (rect, height) => {
      for (let z = 0; z <= height; z += 8) {
        const w = camera.screenToWorld(px, py + z * zoom);
        if (w.x >= rect.x && w.x <= rect.x + rect.w && w.y >= rect.y && w.y <= rect.y + rect.d) return true;
      }
      return false;
    };
    const front = (list) => list.sort((a, b) => b.x + b.y - (a.x + a.y))[0];

    const kid = front(
      game.kids.filter((k) => (k.state === 'bed' ? hitsSprite(k, 16, 62, 18) : hitsSprite(k, 0, 72, 17))),
    );
    if (kid) return { type: 'kid', kid };
    const who = front(game.colleagues.filter((c) => hitsSprite(c, 0, 82, 16)));
    if (who) return { type: 'colleague', who };
    const adult = front(game.adults.filter((a) => hitsSprite(a, 0, a.state === 'sit' ? 66 : 82, 16)));
    if (adult) return { type: 'adult', adult };
    const sleeper = game.kids.find((k) => k.state === 'bed' && hitsVolume(k.bed, 28));
    if (sleeper) return { type: 'kid', kid: sleeper };
    if (hitsVolume(game.shelfItem, 66)) return { type: 'shelf' };
    const w = camera.screenToWorld(px, py);
    return { type: 'floor', x: w.x, y: w.y };
  }
}
