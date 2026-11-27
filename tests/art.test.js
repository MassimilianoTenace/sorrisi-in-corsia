import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, getCharacter } from '../src/characters/index.js';
import { drawCharacter, dimsOf } from '../src/art/characterRig.js';
import { drawPortrait } from '../src/art/portrait.js';
import { SUPER_ART } from '../src/art/superProps.js';
import { Scene } from '../src/art/scene.js';
import { createKids } from '../src/game/people.js';
import { newGame, until, place, seeded, fakeContext, fakeCanvas } from './helpers.js';

const STEPS = [0, 0.05, 0.2, 0.3, 0.4, 0.55, 0.65, 0.75, 0.85, 0.99];
const TIMES = [0, 0.2, 0.35, 0.9, 1.3, 2.1, 3.4];
const MAKING = { shape: 'cane', color: '#3f8fe8' };

// Tutte le situazioni in cui un volontario può essere disegnato.
function* scenes(character) {
  const song = character.gear === 'guitar';
  yield { pose: 'stand' };
  yield { pose: 'walk', phase: 1 };
  yield { pose: 'walk', phase: 2, back: true };
  yield { pose: 'stand', toy: 'peluche' };
  yield { pose: 'cheer' };
  if (song) yield { pose: 'strum' };
  else for (const progress of [0.2, 0.8]) yield { pose: 'pump', progress, making: MAKING };
  for (const pose of character.superpower.moves) {
    for (const progress of STEPS) for (const t of TIMES) yield { pose, progress, t };
  }
}

function draw(character, opts) {
  const ctx = fakeContext();
  const parts = drawCharacter(ctx, character.look, { gear: character.gear, t: 0.35, ...opts });
  const { head } = dimsOf(character.look);
  const heads = ctx.ellipses.filter((e) => e.rx === head && e.ry === head * 1.04);
  return { parts, heads };
}

const label = (c, o) => `${c.id} ${o.pose} p=${o.progress ?? '-'} t=${o.t ?? '-'}`;

test('ogni volontario si disegna in tutte le pose senza errori', () => {
  for (const c of CHARACTERS) {
    for (const o of scenes(c)) {
      for (const flip of [false, true]) assert.doesNotThrow(() => draw(c, { ...o, flip }), label(c, o));
    }
  }
});

test('la testa ha la stessa misura nelle pose normali e nei superpoteri', () => {
  for (const c of CHARACTERS) {
    for (const o of scenes(c)) {
      const { heads } = draw(c, o);
      assert.equal(heads.length, 1, label(c, o));
      assert.ok(Math.abs(heads[0].scale - 1) < 1e-9, `${label(c, o)}: scala ${heads[0].scale}`);
    }
  }
});

test('nel gioco il volontario non cambia misura quando usa il superpotere', () => {
  for (const c of CHARACTERS) {
    for (const move of c.superpower.moves) {
      const { game } = newGame(1, c.id);
      game.player.character = { ...c, superpower: { moves: [move] } };
      place(game.player, 3.5, 3.5);
      const scene = new Scene();
      const measure = () => {
        let hero = null;
        scene.cache = {
          clear() {},
          setScale() {},
          draw(ctx, key, box, paint) {
            if (key !== 'player') return;
            hero = fakeContext();
            paint(hero);
          },
        };
        scene.walls = null;
        let shadows;
        for (const item of scene.items(game)) {
          const ctx = fakeContext();
          item.draw(ctx);
          if (hero && !shadows) shadows = ctx.ellipses.map((e) => e.rx * e.scale);
        }
        const head = hero.ellipses.find((e) => e.rx === 12 && e.ry === 12 * 1.04);
        const round = (v) => Math.round(v * 1e6) / 1e6; // le rotazioni lasciano briciole decimali
        return { head: round(head.rx * head.scale), shadows: shadows.map(round) };
      };
      const normal = measure();
      assert.ok(game.superpower(), move);
      until(game, () => game.player.action.t >= game.player.action.duration * 0.6);
      assert.deepEqual(measure(), normal, move);
    }
  }
});

test('la maglietta con l’orsetto c’è sempre, salvo nei due cambi d’abito', () => {
  const costume = { abito: 0.14, spider: 0 };
  for (const c of CHARACTERS) {
    for (const o of scenes(c)) {
      if (o.back) continue;
      const changed = o.pose in costume && o.progress >= costume[o.pose];
      assert.equal(draw(c, o).parts.includes('bear'), !changed, label(c, o));
    }
  }
});

test('pompa e palloncini sono sempre con tutti, tranne Mimmo che ha la chitarra', () => {
  for (const c of CHARACTERS) {
    for (const o of scenes(c)) {
      const { parts } = draw(c, o);
      const has = (name) => parts.includes(name);
      if (c.id === 'mimmo') {
        assert.ok(has('guitar') && !has('pump') && !has('balloons'), `${label(c, o)}: ${parts}`);
      } else {
        assert.ok(has('pump') && has('balloons') && !has('guitar'), `${label(c, o)}: ${parts}`);
      }
    }
  }
});

test('Gianni porta sempre il cappellino, di fronte e di spalle', () => {
  const gianni = getCharacter('gianni');
  for (const o of scenes(gianni)) {
    for (const back of [false, true]) assert.ok(draw(gianni, { ...o, back }).parts.includes('smallHat'), label(gianni, o));
  }
  assert.ok(draw(gianni, { pose: 'stand', frizz: true }).parts.includes('smallHat'));
});

test('ogni superpotere mostra i propri oggetti al momento giusto', () => {
  const expect = (id, pose, progress, present, absent = []) => {
    const { parts } = draw(getCharacter(id), { pose, progress });
    for (const part of present) assert.ok(parts.includes(part), `${pose} ${progress}: manca ${part}`);
    for (const part of absent) assert.ok(!parts.includes(part), `${pose} ${progress}: ${part} di troppo`);
  };
  expect('gianni', 'orsoDorato', 0.2, [], ['goldenBear']);
  expect('gianni', 'orsoDorato', 0.8, ['goldenBear']);
  for (const [id, pose, item] of [['caterina', 'pancettaSparisce', 'bacon'], ['mariapa', 'legoSparisce', 'lego']]) {
    expect(id, pose, 0.05, [], [item, 'wand']);
    expect(id, pose, 0.3, [item], ['wand']);
    expect(id, pose, 0.55, [item, 'wand']);
    expect(id, pose, 0.9, ['wand'], [item]);
  }
  expect('caterina', 'pancettaLancio', 0.5, ['bacon'], ['wand']);
  expect('marina', 'rutto', 0.5, ['burp']);
  expect('marina', 'rutto', 0.2, [], ['burp']);
  expect('sabrina', 'shakira', 0.5, ['box']);
  expect('mariafrancesca', 'danza', 0.5, ['tutu']);
  expect('giovanna', 'trucco', 0.5, ['makeup']);
  expect('max', 'giocoleria', 0.5, ['balls']);
  expect('emmanuele', 'spider', 0.5, ['web']);
  expect('anna', 'selfie', 0.5, ['phone']);
  expect('martina', 'cilindro', 0.05, [], ['topHat', 'wand', 'rabbit']);
  expect('martina', 'cilindro', 0.18, ['topHat'], ['wand', 'rabbit']);
  expect('martina', 'cilindro', 0.4, ['topHat', 'wand'], ['rabbit']);
  expect('martina', 'cilindro', 0.8, ['topHat', 'wand', 'rabbit']);
  expect('ida', 'lezione', 0.05, ['blackboard'], ['pointer']);
  expect('ida', 'lezione', 0.5, ['blackboard', 'pointer']);
});

test('trasformazioni: artigli, trucco, abito, pugile, Spider-Man e rockstar', () => {
  const outfit = (id, move, p, t = 0) => SUPER_ART[move].outfit(getCharacter(id).look, { p, progress: p, t });
  assert.equal(outfit('benedetta', 'artigli', 0).claws, 0);
  assert.ok(outfit('benedetta', 'artigli', 0.6).claws > 15);
  assert.equal(outfit('benedetta', 'artigli', 1).claws, 0, 'alla fine si ritirano');
  assert.ok(outfit('giovanna', 'trucco', 0.9).blush);
  assert.ok(outfit('giovanna', 'trucco', 0.9).eyeshadow);
  assert.equal(outfit('gabriella', 'abito', 0.5).topStyle, 'gown');
  assert.ok(outfit('vincenzo', 'boxe', 0.5).gloves);
  assert.ok(outfit('emmanuele', 'spider', 0.5).mask);
  const looks = [0, 0.5, 1].map((t) => outfit('mimmo', 'rock', 0.5, t).hair);
  assert.equal(new Set(looks).size, 3, 'i capelli cambiano colore');
  assert.ok(!looks.includes(getCharacter('mimmo').look.hair));
});

test('finito il superpotere l’aspetto torna quello di prima', () => {
  for (const c of CHARACTERS) {
    const before = structuredClone(c.look);
    for (const o of scenes(c)) draw(c, { ...o, frizz: true });
    assert.deepEqual(c.look, before, c.id);
  }
});

test('i capelli bianchi dei bambini fanno ridisegnare la scena', () => {
  const { game } = newGame();
  const scene = new Scene();
  const versions = () => {
    const seen = new Map();
    scene.walls = null;
    scene.cache = { clear() {}, setScale() {}, draw: (ctx, key, box, paint, options) => seen.set(key, options?.version) };
    for (const item of scene.items(game)) item.draw(fakeContext());
    return [...seen.values()].filter((v) => v?.startsWith('giulia,'));
  };
  const normal = versions();
  game.kidById('giulia').frizz = 5;
  assert.equal(normal.length, 1);
  assert.notDeepEqual(versions(), normal);
  for (const kid of createKids(seeded(2))) {
    for (const pose of ['bed', 'bedCheer', 'stand', 'walk']) {
      assert.doesNotThrow(() => drawCharacter(fakeContext(), kid.look, { pose, frizz: true }), `${kid.id} ${pose}`);
    }
  }
});

test('ogni ritratto ha l’orsetto e il suo corredo', () => {
  for (const c of CHARACTERS) {
    const parts = drawPortrait(fakeCanvas(), c, { gear: true });
    assert.ok(parts.includes('bear'), c.id);
    assert.ok(parts.includes(c.gear), c.id);
    assert.equal(parts.includes('smallHat'), c.id === 'gianni', c.id);
  }
});
