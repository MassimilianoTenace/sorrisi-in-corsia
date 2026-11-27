import test from 'node:test';
import assert from 'node:assert/strict';
import { createMap } from '../src/world/map.js';
import { FURNITURE, BEDS, CHAIRS, AREAS, PLAY_GROUPS, PLAYER_START, RESERVED } from '../src/world/layout.js';
import { findPath } from '../src/engine/pathfinding.js';
import { depthSort } from '../src/engine/depthSort.js';
import { toScreen, toWorld } from '../src/engine/iso.js';
import { FURNITURE_TYPES } from '../src/art/furniture.js';

const map = createMap();
const start = { x: Math.floor(PLAYER_START.x), y: Math.floor(PLAYER_START.y) };
const reachable = (t) => findPath(map, start, t) !== null;

test('ci sono 4 stanze, un corridoio e la sala giochi che coprono tutto il piano', () => {
  assert.equal(AREAS.length, 6);
  assert.equal(AREAS.reduce((n, a) => n + a.w * a.h, 0), map.width * map.height);
});

test('gli arredi non si sovrappongono e restano in una sola stanza', () => {
  const used = new Map();
  for (const item of FURNITURE) {
    assert.ok(FURNITURE_TYPES.includes(item.type), `disegno mancante: ${item.type}`);
    const area = map.areaAt(item.x, item.y);
    for (let y = item.y; y < item.y + item.d; y++) {
      for (let x = item.x; x < item.x + item.w; x++) {
        assert.equal(map.areaAt(x, y), area, `${item.type} attraversa un muro in ${x},${y}`);
        if (!item.solid) continue;
        const key = `${x},${y}`;
        assert.ok(!used.has(key), `${item.type} sovrapposto a ${used.get(key)} in ${key}`);
        used.set(key, item.type);
      }
    }
  }
  for (const t of RESERVED) assert.ok(!used.has(`${t.x},${t.y}`));
});

test('ogni casella libera è raggiungibile: nessuna zona chiusa', () => {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.isWalkable(x, y)) assert.ok(reachable({ x, y }), `casella isolata ${x},${y}`);
    }
  }
});

test('letti, sedie e scaffale sono raggiungibili dalla propria stanza', () => {
  const shelf = FURNITURE.find((f) => f.type === 'toyshelf');
  for (const item of [...BEDS, ...CHAIRS, shelf]) {
    const area = map.areaAt(item.x, item.y);
    const spots = map.tilesAround(item).filter((t) => map.areaAt(t.x, t.y) === area);
    assert.ok(spots.some(reachable), `${item.type} ${item.id} non raggiungibile`);
  }
  const spots = PLAY_GROUPS.flat();
  assert.equal(new Set(spots.map((s) => `${s.x},${s.y}`)).size, spots.length, 'posti di gioco sovrapposti');
  for (const spot of spots) {
    assert.equal(map.areaAt(spot.x, spot.y), 'giochi');
    assert.ok(reachable(spot), `posto ${spot.x},${spot.y}`);
  }
});

test('il percorso passa solo dalle porte', () => {
  const path = findPath(map, { x: 0, y: 8 }, { x: 3, y: 3 });
  assert.ok(path);
  let prev = { x: 0, y: 8 };
  for (const t of path) {
    if (map.areaAt(prev.x, prev.y) !== map.areaAt(t.x, t.y)) {
      assert.equal(prev.x, t.x, 'le porte nord/sud si attraversano in verticale');
      assert.ok([3, 4].includes(t.x));
    }
    prev = t;
  }
  assert.equal(map.canStep(0, 5, 0, 6), false);
  assert.equal(map.canStep(3, 5, 3, 6), true);
});

test('proiezione isometrica reversibile', () => {
  const p = toScreen(3.25, 9.5);
  assert.deepEqual(toWorld(p.x, p.y), { x: 3.25, y: 9.5 });
});

test('l’ordinamento disegna prima ciò che sta dietro', () => {
  const wall = { id: 'muro', x0: 2, x1: 3, y0: 6, y1: 6 };
  const behind = { id: 'dietro', x0: 2.3, x1: 2.7, y0: 5.3, y1: 5.7 };
  const inFront = { id: 'davanti', x0: 2.3, x1: 2.7, y0: 6.3, y1: 6.7 };
  const bed = { id: 'letto', x0: 1, x1: 2, y0: 6, y1: 8 };
  const beside = { id: 'accanto', x0: 2.3, x1: 2.7, y0: 6.3, y1: 6.7 };
  assert.deepEqual(depthSort([inFront, wall, behind]).map((i) => i.id), ['dietro', 'muro', 'davanti']);
  assert.deepEqual(depthSort([beside, bed]).map((i) => i.id), ['letto', 'accanto']);
});
