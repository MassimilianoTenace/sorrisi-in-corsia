import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { CHARACTERS, getCharacter } from '../src/characters/index.js';
import { superGain, nextMove } from '../src/game/superpower.js';
import { moveData } from '../src/game/superMoves.js';
import { VANISH, HAT, LESSON } from '../src/art/superPoses.js';
import { actionsFor } from '../src/ui/actionMenu.js';
import { S } from '../src/strings.it.js';
import { newGame, run, until, place } from './helpers.js';

// Volontario in Stanza Giungla (Giulia e Matteo), tutti con la stessa felicità.
function inRoom(characterId, move = null, seed = 1) {
  const setup = newGame(seed, characterId);
  const { game } = setup;
  game.kids.forEach((k) => (k.happiness = 30));
  place(game.player, 3.5, 3.5);
  if (move) game.player.character = { ...game.player.character, superpower: { moves: [move] } };
  return setup;
}

const kids = (game, ...ids) => ids.map((id) => game.kidById(id));

// Le battute dette dal volontario, in ordine.
function listen(game) {
  const said = [];
  let last = null;
  until(game, () => {
    const bubble = game.player.bubble;
    if (bubble && bubble !== last) said.push(bubble.text);
    last = bubble;
    return !game.player.busy;
  });
  return said;
}

test('ogni superpotere premia solo la stanza, finisce e si ricarica', () => {
  for (const { id } of CHARACTERS) {
    const { game } = inRoom(id);
    assert.ok(game.superpower(), id);
    const { move, duration } = game.player.action;
    assert.equal(duration, moveData(move).duration, id);
    const took = until(game, () => !game.player.busy);
    assert.ok(Math.abs(took - duration) < 0.2, `${id}: durata ${took}`);
    for (const kid of kids(game, 'giulia', 'matteo')) {
      assert.ok(kid.happiness > 30 + superGain() - 2 && kid.happiness <= 30 + superGain(), `${id}: ${kid.happiness}`);
    }
    assert.ok(game.kidById('sofia').happiness <= 30, id);
    assert.equal(game.superpower(), false, id);
    run(game, CONFIG.superpower.cooldown);
    assert.ok(game.superpower(), id);
  }
});

test('senza bambini nella stanza nessun superpotere consuma la ricarica', () => {
  for (const { id } of CHARACTERS) {
    const { game } = newGame(1, id);
    assert.equal(game.superpower(), false, id);
    assert.equal(game.cooldown, 0, id);
  }
});

test('le battute vengono dette al momento giusto', () => {
  const expected = {
    pancettaSparisce: ['Vedete la pancetta?', "Ora non c'è più!"],
    pancettaLancio: ['Pancetta per tutti!'],
    legoSparisce: ['Lo vedete il LEGO?', "Ora non c'è più!"],
    shakira: ['Sono Shakira!'],
    rutto: ['BUUURP!'],
    cilindro: ['Guardate nel cilindro...', 'Ecco il coniglietto!'],
    lezione: ['Oggi impariamo!', 'A, B, C...', 'Uno più uno fa due!', 'Tutto chiaro?'],
  };
  const owner = {
    pancettaSparisce: 'caterina', pancettaLancio: 'caterina', legoSparisce: 'mariapa', shakira: 'sabrina', rutto: 'marina',
    cilindro: 'martina', lezione: 'ida',
  };
  for (const [move, lines] of Object.entries(expected)) {
    const { game } = inRoom(owner[move], move);
    game.superpower();
    assert.deepEqual(listen(game), lines, move);
  }
});

test('la magia premia solo dopo che l’oggetto è sparito', () => {
  for (const move of ['pancettaSparisce', 'legoSparisce']) {
    assert.ok(moveData(move).applyAt > VANISH.gone, move);
    assert.ok(moveData(move).lines.at(-1).at >= VANISH.gone, move);
  }
});

test('il coniglietto e la lezione premiano solo a numero compiuto', () => {
  assert.ok(moveData('cilindro').applyAt > HAT.rabbit + 0.1);
  assert.ok(moveData('cilindro').lines.at(-1).at >= HAT.rabbit);
  assert.ok(moveData('lezione').applyAt > LESSON.rows.at(-1) + LESSON.writing);
});

// Usa il superpotere più volte e ritorna le mosse nell'ordine in cui sono uscite.
function useRepeatedly(game, times) {
  return Array.from({ length: times }, () => {
    game.cooldown = 0;
    place(game.player, 3.5, 3.5);
    assert.ok(game.superpower());
    const { move } = game.player.action;
    until(game, () => !game.player.busy);
    return move;
  });
}

test('le mosse di Caterina si alternano in ordine, con qualsiasi caso', () => {
  for (let seed = 1; seed <= 5; seed++) {
    const { game } = inRoom('caterina', null, seed);
    assert.deepEqual(useRepeatedly(game, 5), [
      'pancettaSparisce', 'pancettaLancio', 'pancettaSparisce', 'pancettaLancio', 'pancettaSparisce',
    ]);
  }
});

test('le mosse di Lorenzo seguono sempre la stessa sequenza', () => {
  const { game } = inRoom('lorenzo');
  assert.deepEqual(useRepeatedly(game, 6), ['verticale', 'planche', 'lsit', 'bandiera', 'verticale', 'planche']);
});

test('cambiando volontario ogni sequenza riprende da dove era rimasta', () => {
  const { game } = inRoom('caterina');
  assert.deepEqual(useRepeatedly(game, 1), ['pancettaSparisce']);
  game.changeCharacter('lorenzo');
  assert.deepEqual(useRepeatedly(game, 2), ['verticale', 'planche']);
  game.changeCharacter('caterina');
  assert.deepEqual(useRepeatedly(game, 1), ['pancettaLancio']);
  game.changeCharacter('lorenzo');
  assert.deepEqual(useRepeatedly(game, 1), ['lsit']);
});

test('chi ha una sola mossa la ripete sempre', () => {
  assert.deepEqual([0, 1, 2].map((turn) => nextMove(['rutto'], turn)), ['rutto', 'rutto', 'rutto']);
});

test('rutto di Marina: capelli bianchi solo nella stanza e solo per un po’', () => {
  const { game } = inRoom('marina');
  game.superpower();
  assert.ok(game.kids.every((k) => k.frizz === 0), 'prima del rutto niente');
  until(game, () => game.player.action.applied);
  assert.deepEqual(game.kids.filter((k) => k.frizz > 0).map((k) => k.id), ['giulia', 'matteo']);
  run(game, CONFIG.superpower.whiteHairSeconds - 1);
  assert.ok(game.kidById('giulia').frizz > 0);
  run(game, 1.2);
  assert.ok(game.kids.every((k) => k.frizz === 0), 'i capelli tornano normali');
});

test('gli altri superpoteri non cambiano i capelli', () => {
  for (const { id } of CHARACTERS.filter((c) => c.id !== 'marina')) {
    const { game } = inRoom(id);
    game.superpower();
    until(game, () => game.player.action.applied);
    assert.ok(game.kids.every((k) => k.frizz === 0), id);
  }
});

test('pancetta e ragnatele volano verso ogni bambino della stanza', () => {
  for (const [id, move, kind] of [['caterina', 'pancettaLancio', 'bacon'], ['emmanuele', 'spider', 'web']]) {
    const { game } = inRoom(id, move);
    game.superpower();
    until(game, () => game.player.action.applied);
    const thrown = game.particles.filter((p) => p.kind === kind);
    assert.equal(thrown.length, 2, kind);
    run(game, 0.85);
    for (const kid of kids(game, 'giulia', 'matteo')) {
      assert.ok(thrown.some((p) => Math.hypot(p.x - kid.x, p.y - kid.y) < 0.4), `${kind} verso ${kid.id}`);
    }
  }
});

// ---------- Mimmo ----------
function play(characterId, outcome) {
  const setup = newGame(1, characterId);
  const { game } = setup;
  game.kids.forEach((k) => (k.happiness = 40));
  game.forcedOutcome = outcome;
  game.interact('balloon', 'giulia');
  until(game, () => game.player.action?.type === 'balloon');
  const action = game.player.action;
  until(game, () => !game.player.busy);
  return { ...setup, action, kid: game.kidById('giulia') };
}

test('Mimmo suona una canzone invece di fare un palloncino', () => {
  const { game, events, action, kid } = play('mimmo', 'success');
  assert.equal(action.song, true);
  assert.equal(kid.balloon, null, 'nessun palloncino in regalo');
  assert.ok(kid.happiness > 40 + CONFIG.balloon.gain - 1);
  assert.equal(game.stats.songs, 1);
  assert.equal(game.stats.balloons, 0);
  assert.ok(events.some((e) => e.name === 'strum'));
  assert.ok(!events.some((e) => e.name === 'pump'));
});

test('la corda rotta di Mimmo spaventa o diverte come uno scoppio', () => {
  const { game, events, kid } = play('mimmo', 'pop');
  assert.equal(game.stats.broken, 1);
  assert.equal(game.stats.popped, 0);
  assert.ok(events.some((e) => e.name === 'twang'));
  assert.ok(!events.some((e) => e.name === 'pop'));
  assert.ok(game.floaters.some((f) => f.text === S.say.stringBroke));
  assert.ok([...S.say.stringUpset, ...S.say.stringAmused].includes(kid.bubble.text));
});

test('gli altri continuano a regalare palloncini', () => {
  const { action, kid, events } = play('anna', 'success');
  assert.equal(action.song, false);
  assert.ok(kid.balloon);
  assert.ok(events.some((e) => e.name === 'pump'));
});

test('il primo pulsante è "Canzone" per Mimmo e "Palloncino" per gli altri', () => {
  for (const { id } of CHARACTERS) {
    const { game } = newGame(1, id);
    const [first] = actionsFor(game, game.kidById('giulia'));
    assert.equal(first.id, 'balloon');
    assert.equal(first.label, id === 'mimmo' ? S.actions.song : S.actions.balloon, id);
  }
});
