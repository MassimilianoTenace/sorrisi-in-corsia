import { MAP_W, MAP_H, AREAS, DOORS, FURNITURE, RESERVED } from './layout.js';

export function createMap() {
  const width = MAP_W;
  const height = MAP_H;

  const areaGrid = Array.from({ length: height }, () => Array(width).fill(null));
  for (const a of AREAS) {
    for (let y = a.y; y < a.y + a.h; y++) {
      for (let x = a.x; x < a.x + a.w; x++) areaGrid[y][x] = a.id;
    }
  }

  const inside = (x, y) => x >= 0 && y >= 0 && x < width && y < height;
  const areaAt = (x, y) => {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    return inside(tx, ty) ? areaGrid[ty][tx] : null;
  };

  const doorEdges = new Set();
  for (const d of DOORS) {
    for (let i = 0; i < d.len; i++) {
      const x = d.orient === 'h' ? d.x + i : d.x;
      const y = d.orient === 'v' ? d.y + i : d.y;
      doorEdges.add(`${d.orient}:${x},${y}`);
    }
  }

  // Un muro compare ovunque confinino due aree diverse, porte escluse.
  const walls = [];
  const wallEdges = new Set();
  const addWall = (orient, x, y, a, b) => {
    const key = `${orient}:${x},${y}`;
    if (a === b || doorEdges.has(key)) return;
    let kind = 'inner';
    if (a === null) kind = 'back';
    if (b === null) kind = 'front';
    wallEdges.add(key);
    walls.push({ orient, x, y, kind, area: b ?? a });
  };
  for (let y = 0; y <= height; y++) {
    for (let x = 0; x < width; x++) addWall('h', x, y, areaAt(x, y - 1), areaAt(x, y));
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x <= width; x++) addWall('v', x, y, areaAt(x - 1, y), areaAt(x, y));
  }

  const blocked = new Set();
  const block = (x, y) => blocked.add(`${x},${y}`);
  for (const item of FURNITURE) {
    if (!item.solid) continue;
    for (let y = item.y; y < item.y + item.d; y++) {
      for (let x = item.x; x < item.x + item.w; x++) block(x, y);
    }
  }
  RESERVED.forEach((t) => block(t.x, t.y));

  const map = {
    width,
    height,
    walls,
    areaAt,
    isWalkable: (x, y) => inside(x, y) && !blocked.has(`${x},${y}`),
    // Passaggio tra due caselle adiacenti in orizzontale o verticale.
    canStep(ax, ay, bx, by) {
      if (ax !== bx) return !wallEdges.has(`v:${Math.max(ax, bx)},${ay}`);
      return !wallEdges.has(`h:${ax},${Math.max(ay, by)}`);
    },
    // Caselle libere accanto a un rettangolo, nella stessa stanza e senza muri in mezzo.
    tilesAround(rect) {
      const out = [];
      for (let y = rect.y; y < rect.y + rect.d; y++) {
        for (let x = rect.x; x < rect.x + rect.w; x++) {
          for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (!map.isWalkable(nx, ny) || !map.canStep(x, y, nx, ny)) continue;
            if (!out.some((t) => t.x === nx && t.y === ny)) out.push({ x: nx, y: ny });
          }
        }
      }
      return out;
    },
  };
  return map;
}
