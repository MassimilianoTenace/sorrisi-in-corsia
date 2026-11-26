// Ordina gli oggetti dal più lontano al più vicino.
// Ogni elemento ha un ingombro a terra {x0, y0, x1, y1} in caselle.
const EPS = 0.001;
const MARGIN = 0.7; // gli sprite sporgono un po' oltre il loro ingombro

function isBehind(a, b) {
  const aFirst = a.x1 <= b.x0 + EPS || a.y1 <= b.y0 + EPS;
  const bFirst = b.x1 <= a.x0 + EPS || b.y1 <= a.y0 + EPS;
  if (aFirst && !bFirst) return true;
  if (bFirst && !aFirst) return false;
  return a.x0 + a.x1 + a.y0 + a.y1 < b.x0 + b.x1 + b.y0 + b.y1;
}

export function depthSort(items) {
  const list = items
    .map((item) => ({
      item,
      u0: item.x0 - item.y1 - MARGIN,
      u1: item.x1 - item.y0 + MARGIN,
      key: item.x0 + item.x1 + item.y0 + item.y1,
      after: [], // elementi che vanno disegnati prima di questo
      state: 0,
    }))
    .sort((a, b) => a.key - b.key);

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (a.u1 <= b.u0 || b.u1 <= a.u0) continue;
      if (isBehind(a.item, b.item)) b.after.push(a);
      else a.after.push(b);
    }
  }

  const out = [];
  const visit = (node) => {
    if (node.state) return; // già fatto, oppure ciclo: lo si ignora
    node.state = 1;
    for (const dep of node.after) visit(dep);
    out.push(node.item);
  };
  list.forEach(visit);
  return out;
}
