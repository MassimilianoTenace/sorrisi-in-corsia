// Pianta del reparto: un solo piano, 4 stanze, corridoio e sala giochi.
export const MAP_W = 21;
export const MAP_H = 16;

export const AREAS = [
  { id: 'giungla', x: 0, y: 0, w: 7, h: 6 },
  { id: 'spazio', x: 7, y: 0, w: 7, h: 6 },
  { id: 'corridoio', x: 0, y: 6, w: 14, h: 4 },
  { id: 'mare', x: 0, y: 10, w: 7, h: 6 },
  { id: 'fiori', x: 7, y: 10, w: 7, h: 6 },
  { id: 'giochi', x: 14, y: 0, w: 7, h: 16 },
];

// 'h' = lato nord della casella (x, y); 'v' = lato ovest della casella (x, y).
export const DOORS = [
  { orient: 'h', x: 3, y: 6, len: 2, room: 'giungla' },
  { orient: 'h', x: 10, y: 6, len: 2, room: 'spazio' },
  { orient: 'h', x: 3, y: 10, len: 2, room: 'mare' },
  { orient: 'h', x: 10, y: 10, len: 2, room: 'fiori' },
  { orient: 'v', x: 14, y: 7, len: 2, room: 'giochi' },
];

export const WALL_DECOR = [
  // parete di fondo nord
  { orient: 'h', x: 3, y: 0, type: 'window' },
  { orient: 'h', x: 6, y: 0, type: 'drawing' },
  { orient: 'h', x: 7, y: 0, type: 'poster' },
  { orient: 'h', x: 10, y: 0, type: 'window' },
  { orient: 'h', x: 12, y: 0, type: 'clock' },
  { orient: 'h', x: 14, y: 0, type: 'drawing' },
  { orient: 'h', x: 15, y: 0, type: 'window' },
  { orient: 'h', x: 19, y: 0, type: 'window' },
  // parete di fondo ovest
  { orient: 'v', x: 0, y: 1, type: 'window' },
  { orient: 'v', x: 0, y: 3, type: 'drawing' },
  { orient: 'v', x: 0, y: 7, type: 'entrance' },
  { orient: 'v', x: 0, y: 8, type: 'entrance' },
  { orient: 'v', x: 0, y: 11, type: 'window' },
  { orient: 'v', x: 0, y: 14, type: 'poster' },
];

const f = (type, x, y, w = 1, d = 1, extra = {}) => ({ type, x, y, w, d, solid: true, ...extra });
const bed = (id, room, x, y, color) => f('bed', x, y, 1, 2, { id, room, color });

export const BEDS = [
  bed('b1', 'giungla', 1, 0, '#6fbf5f'),
  bed('b2', 'giungla', 5, 0, '#f2b134'),
  bed('b3', 'spazio', 8, 0, '#6c7ae0'),
  bed('b4', 'spazio', 12, 0, '#9b6bd3'),
  bed('b5', 'mare', 1, 10, '#37a9d6'),
  bed('b6', 'mare', 5, 10, '#2fc2b0'),
  bed('b7', 'fiori', 8, 10, '#ef7fae'),
  bed('b8', 'fiori', 12, 10, '#f08a5d'),
];

// Sedie su cui siedono i genitori.
export const CHAIRS = [
  f('chair', 3, 0, 1, 1, { id: 'c1', color: '#d9824b' }),
  f('chair', 11, 1, 1, 1, { id: 'c2', color: '#5b8bd0' }),
  f('chair', 4, 11, 1, 1, { id: 'c3', color: '#4aa88f' }),
  f('chair', 9, 12, 1, 1, { id: 'c4', color: '#c86b9a' }),
];

export const FURNITURE = [
  ...BEDS,
  ...CHAIRS,

  // Stanza Giungla
  f('wardrobe', 0, 0, 1, 1, { color: '#b9814f' }),
  f('nightstand', 2, 0),
  f('nightstand', 4, 0),
  f('ivstand', 6, 0),
  f('tv', 0, 1, 1, 1, { channel: 0 }),
  f('drawers', 0, 3, 1, 1, { color: '#c99a62' }),
  f('bathtub', 0, 4, 1, 2),
  f('sink', 6, 4),
  f('plant', 6, 5),

  // Stanza Spazio
  f('ivstand', 7, 0),
  f('nightstand', 9, 0),
  f('monitor', 11, 0),
  f('wardrobe', 13, 0, 1, 1, { color: '#8f9bc4' }),
  f('tv', 7, 1, 1, 1, { channel: 1 }),
  f('sink', 7, 3),
  f('bathtub', 7, 4, 1, 2),
  f('drawers', 13, 3, 1, 1, { color: '#8f9bc4' }),
  f('rocket', 13, 5),

  // Stanza Mare
  f('ivstand', 0, 10),
  f('nightstand', 2, 10),
  f('monitor', 6, 10),
  f('tv', 0, 11, 1, 1, { channel: 2 }),
  f('wardrobe', 0, 13, 1, 1, { color: '#6fa8b8' }),
  f('bathtub', 0, 14, 1, 2),
  f('sink', 1, 15),
  f('toychest', 4, 15, 1, 1, { color: '#3f9fc4' }),
  f('drawers', 6, 13, 1, 1, { color: '#6fa8b8' }),
  f('plant', 6, 15),

  // Stanza Fiori
  f('ivstand', 7, 10),
  f('nightstand', 9, 10),
  f('nightstand', 13, 10),
  f('tv', 7, 11, 1, 1, { channel: 0 }),
  f('wardrobe', 7, 13, 1, 1, { color: '#d99ab0' }),
  f('bathtub', 7, 14, 1, 2),
  f('drawers', 13, 13, 1, 1, { color: '#d99ab0' }),
  f('plant', 13, 15, 1, 1, { flowers: true }),
  f('toychest', 11, 15, 1, 1, { color: '#e07a9e' }),

  // Corridoio
  f('vending', 0, 6),
  f('water', 1, 6),
  f('desk', 6, 7, 2, 1),
  f('plant', 0, 9),
  f('wheelchair', 5, 9),
  f('bench', 7, 9, 2, 1),
  f('plant', 13, 6),
  f('plant', 13, 9, 1, 1, { flowers: true }),

  // Sala giochi
  f('toyshelf', 16, 0, 3, 1, { id: 'shelf' }),
  f('bookshelf', 14, 1, 1, 2),
  f('fishtank', 20, 5),
  f('slide', 19, 2, 2, 3),
  f('chairSmall', 16, 2, 1, 1, { color: '#e8554e' }),
  f('table', 16, 3, 2, 1),
  f('chairSmall', 18, 3, 1, 1, { color: '#4a8fe0' }),
  f('rockinghorse', 20, 7),
  f('beanbag', 20, 9, 1, 1, { color: '#f2b134' }),
  f('beanbag', 20, 10, 1, 1, { color: '#6fbf5f' }),
  f('toychest', 14, 10, 1, 1, { color: '#e8554e' }),
  f('tent', 14, 12, 2, 2),
  f('ballpit', 18, 12, 3, 3),
  f('blocks', 16, 14),
  f('plant', 14, 15),
  f('piano', 14, 5, 1, 1),

  // Tappeto: decorativo, ci si cammina sopra
  f('rug', 16, 6, 4, 5, { solid: false, floor: true }),
];

// Posti sul tappeto dove si gioca insieme.
export const PLAY_SPOTS = [
  { x: 18, y: 8 },
  { x: 17, y: 9 },
  { x: 19, y: 7 },
  { x: 16, y: 10 },
];

// Più volontari possono giocare insieme: ognuno con il proprio gruppo di posti.
export const PLAY_GROUPS = [
  PLAY_SPOTS,
  [{ x: 16, y: 5 }, { x: 15, y: 4 }, { x: 17, y: 5 }, { x: 18, y: 5 }],
  [{ x: 17, y: 12 }, { x: 16, y: 12 }, { x: 17, y: 11 }, { x: 15, y: 11 }],
];

// Caselle occupate da personale fermo.
export const RESERVED = [
  { x: 6, y: 6 },
  { x: 7, y: 6 },
];

export const PLAYER_START = { x: 2.5, y: 8.5 };
