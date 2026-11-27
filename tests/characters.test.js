import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, getCharacter } from '../src/characters/index.js';
import { SUPER_MOVES, moveData } from '../src/game/superMoves.js';
import { POSE_NAMES } from '../src/art/characterRig.js';
import { PORTRAIT_STYLES } from '../src/art/portrait.js';
import { S } from '../src/strings.it.js';

const NAMES = [
  'Lorenzo', 'Gianni', 'Caterina', "Mariapa'", 'Marina', 'Sabrina', 'Mariafrancesca', 'Benedetta',
  'Giovanna', 'Gabriella', 'Max', 'Vincenzo', 'Emmanuele', 'Mimmo', 'Anna', 'Martina', 'Ida',
];

test('ci sono tutti i volontari, senza doppioni', () => {
  assert.deepEqual(CHARACTERS.map((c) => S.characters[c.id].name), NAMES);
  assert.equal(new Set(CHARACTERS.map((c) => c.id)).size, NAMES.length);
  for (const c of CHARACTERS) assert.equal(getCharacter(c.id), c);
});

test('ogni volontario ha testi, ritratto e mosse complete', () => {
  for (const c of CHARACTERS) {
    const text = S.characters[c.id];
    assert.ok(text.name && text.power && text.description, c.id);
    assert.ok(PORTRAIT_STYLES.includes(c.look.style), `${c.id}: manca l’acconciatura del ritratto`);
    assert.ok(c.superpower.moves.length > 0, c.id);
    for (const move of c.superpower.moves) {
      assert.ok(move in SUPER_MOVES, `${move}: mancano i tempi`);
      assert.ok(POSE_NAMES.includes(move), `${move}: manca la posa`);
      assert.ok(S.superMoves[move], `${move}: manca il nome`);
      const { duration, applyAt, lines } = moveData(move);
      assert.ok(duration > 0 && applyAt > 0 && applyAt < 1, move);
      for (const { at, key } of lines) {
        assert.ok(at > 0 && at < 1 && S.say.super[key], `${move}: battuta ${key}`);
      }
    }
  }
});

test('tutti indossano la maglietta bianca con l’orsetto', () => {
  for (const { id, look } of CHARACTERS) {
    assert.equal(look.topStyle, 'tee', id);
    assert.equal(look.bear, true, id);
  }
});

test('solo Mimmo gira con la chitarra e solo Gianni porta il cappellino', () => {
  assert.deepEqual(CHARACTERS.filter((c) => c.gear === 'guitar').map((c) => c.id), ['mimmo']);
  assert.ok(CHARACTERS.every((c) => c.gear === 'guitar' || c.gear === 'balloons'));
  assert.deepEqual(CHARACTERS.filter((c) => c.look.smallHat).map((c) => c.id), ['gianni']);
});

test('ogni volontario ha il superpotere richiesto', () => {
  const moves = Object.fromEntries(CHARACTERS.map((c) => [c.id, c.superpower.moves]));
  assert.deepEqual(moves, {
    lorenzo: ['verticale', 'planche', 'lsit', 'bandiera'],
    gianni: ['orsoDorato'],
    caterina: ['pancettaSparisce', 'pancettaLancio'],
    mariapa: ['legoSparisce'],
    marina: ['rutto'],
    sabrina: ['shakira'],
    mariafrancesca: ['danza'],
    benedetta: ['artigli'],
    giovanna: ['trucco'],
    gabriella: ['abito'],
    max: ['giocoleria'],
    vincenzo: ['boxe'],
    emmanuele: ['spider'],
    mimmo: ['rock'],
    anna: ['selfie'],
    martina: ['cilindro'],
    ida: ['lezione'],
  });
});

const brightness = (hex) => [1, 3, 5].reduce((sum, i) => sum + parseInt(hex.slice(i, i + 2), 16), 0) / 3;
const isBrown = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return r > g && g > b && r - b > 30;
};

test('Gianni ha i capelli marroni', () => {
  const { look } = getCharacter('gianni');
  assert.ok(isBrown(look.hair), look.hair);
  assert.ok(isBrown(look.brow), look.brow);
});

test('Emmanuele ha la pelle chiara e non ha né barba né baffi', () => {
  const { look } = getCharacter('emmanuele');
  assert.equal(look.beard, undefined);
  assert.equal(look.beardStyle, undefined);
  assert.ok(brightness(look.skin) > 180, look.skin);
});

test('il superpotere di Giovanna si chiama "Pittata di faccia"', () => {
  assert.equal(S.characters.giovanna.power, 'Pittata di faccia');
  assert.equal(S.superMoves.trucco, 'Pittata di faccia!');
});
