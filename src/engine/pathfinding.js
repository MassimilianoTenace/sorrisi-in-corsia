// A* su griglia a 8 direzioni, senza tagliare gli angoli di muri e mobili.
const DIRS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

function canMove(map, x, y, dx, dy) {
  const nx = x + dx;
  const ny = y + dy;
  if (!map.isWalkable(nx, ny)) return false;
  if (dx === 0 || dy === 0) return map.canStep(x, y, nx, ny);
  return (
    map.isWalkable(nx, y) && map.isWalkable(x, ny) &&
    map.canStep(x, y, nx, y) && map.canStep(nx, y, nx, ny) &&
    map.canStep(x, y, x, ny) && map.canStep(x, ny, nx, ny)
  );
}

// Ritorna la lista di caselle (esclusa quella di partenza) oppure null.
export function findPath(map, from, to) {
  if (!map.isWalkable(to.x, to.y)) return null;
  if (from.x === to.x && from.y === to.y) return [];

  const id = (x, y) => y * map.width + x;
  const h = (x, y) => {
    const dx = Math.abs(x - to.x);
    const dy = Math.abs(y - to.y);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };

  const open = [{ x: from.x, y: from.y, g: 0, f: h(from.x, from.y) }];
  const best = new Map([[id(from.x, from.y), 0]]);
  const parent = new Map();
  const closed = new Set();

  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    const cid = id(cur.x, cur.y);
    if (closed.has(cid)) continue;
    closed.add(cid);

    if (cur.x === to.x && cur.y === to.y) {
      const path = [];
      let k = cid;
      while (parent.has(k)) {
        path.push({ x: k % map.width, y: Math.floor(k / map.width) });
        k = parent.get(k);
      }
      return path.reverse();
    }

    for (const [dx, dy, cost] of DIRS) {
      if (!canMove(map, cur.x, cur.y, dx, dy)) continue;
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nid = id(nx, ny);
      const g = cur.g + cost;
      if (closed.has(nid) || (best.has(nid) && best.get(nid) <= g)) continue;
      best.set(nid, g);
      parent.set(nid, cid);
      open.push({ x: nx, y: ny, g, f: g + h(nx, ny) });
    }
  }
  return null;
}

// Casella percorribile più vicina a un punto (ricerca ad anelli).
export function nearestWalkable(map, x, y, maxRadius = 6) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (map.isWalkable(tx, ty)) return { x: tx, y: ty };
  for (let r = 1; r <= maxRadius; r++) {
    let found = null;
    let dist = Infinity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!map.isWalkable(tx + dx, ty + dy)) continue;
        const d = Math.hypot(tx + dx + 0.5 - x, ty + dy + 0.5 - y);
        if (d < dist) {
          dist = d;
          found = { x: tx + dx, y: ty + dy };
        }
      }
    }
    if (found) return found;
  }
  return null;
}
