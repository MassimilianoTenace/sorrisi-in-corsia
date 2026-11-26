// Chi abita il reparto: bambini, genitori e personale.
import { Kid } from '../entities/kid.js';
import { Adult } from '../entities/adult.js';
import { BEDS, CHAIRS } from '../world/layout.js';
import { CONFIG } from '../config.js';

const kidLook = (skin, hair, style, top, dots, extra = {}) => ({
  kid: true, skin, hair, style, top, dots, topStyle: 'pajama', bottom: top, shoes: '#f4f0e6', ...extra,
});

const KIDS = [
  { id: 'giulia', name: 'Giulia', bed: 'b1', favourite: 'peluche', look: kidLook('#f3c29b', '#5a3420', 'pigtails', '#ff9fb8', '#fff') },
  { id: 'matteo', name: 'Matteo', bed: 'b2', favourite: 'macchinina', bedridden: true, look: kidLook('#c98d63', '#201512', 'short', '#6fb7f0', '#fff') },
  { id: 'sofia', name: 'Sofia', bed: 'b3', favourite: 'libro', look: kidLook('#f6cfae', '#d9a441', 'long', '#a58be0', '#ffe873') },
  { id: 'leo', name: 'Leonardo', bed: 'b4', favourite: 'costruzioni', look: kidLook('#e8b088', '#8a4b22', 'cap', '#7fcf7a', '#fff', { cap: '#e8483f' }) },
  { id: 'aurora', name: 'Aurora', bed: 'b5', favourite: 'pennarelli', bedridden: true, look: kidLook('#8d5a3b', '#1c110d', 'curly', '#ffc94d', '#fff') },
  { id: 'tommaso', name: 'Tommaso', bed: 'b6', favourite: 'marionetta', look: kidLook('#f3c29b', '#c9622c', 'short', '#52c4b4', '#fff', { glasses: true }) },
  { id: 'emma', name: 'Emma', bed: 'b7', favourite: 'peluche', look: kidLook('#f0bd96', '#2a1a14', 'bun', '#ff8a72', '#fff') },
  { id: 'francesco', name: 'Francesco', bed: 'b8', favourite: 'libro', bedridden: true, look: kidLook('#e2a67c', '#3b2417', 'bald', '#7f93e8', '#fff', { glasses: true }) },
];

const adultLook = (skin, hair, style, topStyle, top, bottom, extra = {}) => ({
  skin, hair, style, topStyle, top, bottom, shoes: '#3a2c28', ...extra,
});

const DOCTORS = [
  { id: 'dott-rossi', role: 'doctor', x: 4.5, y: 8.5, look: adultLook('#f0bd96', '#7a7a7a', 'short', 'coat', '#9fd0ea', '#4a5568', { coat: '#fbfbf8', glasses: true }) },
  { id: 'dott-bianchi', role: 'doctor', x: 11.5, y: 8.5, look: adultLook('#a86f4c', '#1c110d', 'bun', 'coat', '#f4a6b8', '#37506b', { coat: '#fbfbf8' }) },
  { id: 'inf-verdi', role: 'nurse', x: 9.5, y: 7.5, look: adultLook('#f6cfae', '#b5652b', 'long', 'scrubs', '#45b8a8', '#2f8f83', { badge: true }) },
];

const PARENTS = [
  adultLook('#f3c29b', '#4a2c1c', 'long', 'sweater', '#e0b04a', '#4a5a7a'),
  adultLook('#d59b71', '#241715', 'short', 'sweater', '#5f8f5a', '#4b4038', { beard: '#2c1e17' }),
  adultLook('#9c6644', '#16100d', 'curly', 'dress', '#c9577c', '#c9577c'),
  adultLook('#f0bd96', '#8f8a86', 'bun', 'sweater', '#6d7fc4', '#3f3a52', { glasses: true }),
];

const RECEPTION = adultLook('#e8b088', '#3b2417', 'bun', 'scrubs', '#5aa7d6', '#33658a', { badge: true });

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

export function createKids(rng) {
  const { startMin, startMax } = CONFIG.happiness;
  return KIDS.map(
    (k) =>
      new Kid({
        ...k,
        look: { ...k.look, seed: rng() * 4 },
        bed: BEDS.find((b) => b.id === k.bed),
        bedridden: Boolean(k.bedridden),
        happiness: startMin + rng() * (startMax - startMin),
      }),
  );
}

export function createAdults(map, rng) {
  // I medici passano dai letti e dal corridoio.
  const rounds = BEDS.flatMap((bed) => {
    const spot = map.tilesAround(bed).find((t) => map.areaAt(t.x, t.y) === bed.room);
    return spot ? [{ ...spot, look: { x: bed.x + 0.5, y: bed.y + 1 } }] : [];
  }).concat([
    { x: 2, y: 8 },
    { x: 8, y: 7 },
    { x: 12, y: 8 },
    { x: 15, y: 8 },
  ]);
  const breaks = [
    { x: 0, y: 7, look: { x: 0.5, y: 6.5 } },
    { x: 1, y: 7, look: { x: 1.5, y: 6.5 } },
    { x: 9, y: 8 },
    { x: 15, y: 9 },
  ];

  const staff = DOCTORS.map((d) => new Adult({ ...d, spots: rounds, rng }));
  const parents = CHAIRS.map(
    (chair, i) =>
      new Adult({ id: `genitore-${i + 1}`, role: 'parent', look: PARENTS[i], x: 0, y: 0, chair, spots: [pick(rng, breaks), ...breaks], rng }),
  );
  const reception = new Adult({ id: 'accoglienza', role: 'reception', look: RECEPTION, x: 6.8, y: 6.7, rng });
  return [...staff, ...parents, reception];
}
