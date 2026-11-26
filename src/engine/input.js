// Mouse e touch: un tocco breve seleziona, il trascinamento sposta, due dita fanno zoom.
const DRAG_THRESHOLD = 9;

export function attachInput(canvas, { onTap, onPan, onZoom }) {
  const pointers = new Map();
  let moved = false;
  let pinch = 0;

  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const spread = () => {
    const [a, b] = [...pointers.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    canvas.setPointerCapture(e.pointerId);
    const p = local(e);
    pointers.set(e.pointerId, { ...p, sx: p.x, sy: p.y });
    if (pointers.size === 1) moved = false;
    if (pointers.size === 2) {
      moved = true;
      pinch = spread().dist;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const p = local(e);
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    pointers.set(e.pointerId, { ...prev, ...p });
    if (pointers.size === 1) {
      if (!moved && Math.hypot(p.x - prev.sx, p.y - prev.sy) > DRAG_THRESHOLD) {
        moved = true;
        onPan(p.x - prev.sx, p.y - prev.sy);
      } else if (moved) {
        onPan(dx, dy);
      }
    } else if (pointers.size === 2) {
      const s = spread();
      if (pinch > 0 && s.dist > 0) onZoom(s.dist / pinch, s.x, s.y);
      pinch = s.dist;
    }
  });

  const end = (e) => {
    if (!pointers.has(e.pointerId)) return;
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (e.type === 'pointerup' && !moved && pointers.size === 0) onTap(p.x, p.y);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const p = local(e);
      onZoom(Math.exp(-e.deltaY * 0.0015), p.x, p.y);
    },
    { passive: false },
  );
}
