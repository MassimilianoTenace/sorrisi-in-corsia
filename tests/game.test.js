import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { changeHappiness, decayed, happinessHue, expressionFor } from '../src/game/happiness.js';
import { resolveBalloon } from '../src/game/balloon.js';
import { superGain } from '../src/game/superpower.js';
import { CHARACTERS } from '../src/characters/index.js';
import { newGame, run, until, place, seeded } from './helpers.js';

const setAll = (game, value) => game.kids.forEach((k) => (k.happiness = value));

test('la felicità resta tra 0 e 100', () => {
  const kid = { happiness: 95 };
  assert.equal(changeHappiness(kid, 20), 5);
  assert.equal(kid.happiness, 100);
  changeHappiness(kid, -500);
  assert.equal(kid.happiness, 0);
});

test('il tempo la abbassa solo fino alla soglia', () => {
  assert.ok(decayed(80, 10) < 80);
  assert.equal(decayed(80, 1e6), CONFIG.happiness.decayFloor);
  assert.equal(decayed(5, 100), 5);
});

test('il colore va dal rosso al verde', () => {
  assert.equal(happinessHue(0), 0);
  assert.equal(happinessHue(50), 60);
  assert.equal(happinessHue(100), 120);
  assert.deepEqual([10, 40, 60, 90].map(expressionFor), ['sad', 'neutral', 'happy', 'joy']);
});

test('palloncino riuscito: guadagno grande al scelto, piccolo ai vicini', () => {
  const [target, other] = [{ id: 1 }, { id: 2 }];
  const { popped, effects } = resolveBalloon({ target, audience: [target, other], forced: 'success' });
  assert.equal(popped, false);
  assert.deepEqual(effects.map((e) => e.delta), [CONFIG.balloon.gain, CONFIG.balloon.nearbyGain]);
});

test('scoppio: con due o più bambini c’è sempre chi si spaventa e chi ride', () => {
  const rng = seeded(7);
  for (let n = 2; n <= 5; n++) {
    for (let i = 0; i < 200; i++) {
      const audience = Array.from({ length: n }, (_, id) => ({ id }));
      const { effects } = resolveBalloon({ target: audience[0], audience, rng, forced: 'pop' });
      const kinds = new Set(effects.map((e) => e.reaction));
      assert.deepEqual([...kinds].sort(), ['amused', 'upset']);
      for (const e of effects) assert.ok(e.reaction === 'upset' ? e.delta < 0 : e.delta > 0);
    }
  }
});

test('lo scoppio capita circa con la probabilità configurata', () => {
  const rng = seeded(3);
  const target = {};
  let pops = 0;
  for (let i = 0; i < 5000; i++) if (resolveBalloon({ target, audience: [target], rng }).popped) pops++;
  assert.ok(Math.abs(pops / 5000 - CONFIG.balloon.popChance) < 0.02);
});

test('il volontario cammina fino al bambino e fa il palloncino', () => {
  const { game } = newGame();
  setAll(game, 40);
  game.forcedOutcome = 'success';
  const kid = game.kidById('giulia');
  assert.ok(game.interact('balloon', kid.id));
  until(game, () => game.player.action?.type === 'balloon');
  assert.equal(game.map.areaAt(game.player.x, game.player.y), 'giungla');
  until(game, () => !game.player.busy);
  assert.ok(kid.happiness > 40 + CONFIG.balloon.gain - 1);
  assert.ok(kid.balloon);
  assert.equal(game.stats.balloons, 1);
  assert.equal(game.kidById('sofia').happiness < 41, true, 'chi è in un’altra stanza non vede');
});

test('ogni bambino è raggiungibile e interagibile', () => {
  for (const id of newGame().game.kids.map((k) => k.id)) {
    const { game } = newGame();
    assert.ok(game.interact('balloon', id), id);
    until(game, () => game.player.action?.type === 'balloon');
  }
});

test('mentre è occupato il volontario ignora altri comandi', () => {
  const { game } = newGame();
  game.interact('balloon', 'giulia');
  until(game, () => game.player.busy);
  assert.equal(game.walk(2, 8), false);
  assert.equal(game.interact('balloon', 'matteo'), false);
  assert.equal(game.superpower(), false);
});

test('il superpotere dà il doppio a tutti i bambini della stanza', () => {
  const { game } = newGame();
  setAll(game, 30);
  place(game.player, 3.5, 3.5);
  assert.ok(game.superpower());
  until(game, () => !game.player.busy);
  assert.equal(superGain(), CONFIG.balloon.gain * 2);
  for (const id of ['giulia', 'matteo']) {
    const h = game.kidById(id).happiness;
    assert.ok(h > 30 + superGain() - 2 && h <= 30 + superGain(), `${id}: ${h}`);
  }
  assert.ok(game.kidById('sofia').happiness <= 30);
  assert.ok(game.cooldown > 0);
  assert.equal(game.superpower(), false, 'deve ricaricarsi');
  run(game, CONFIG.superpower.cooldown);
  assert.ok(game.superpower());
});

test('superpotere senza pubblico: nessuna ricarica consumata', () => {
  const { game, events } = newGame();
  assert.equal(game.superpower(), false);
  assert.equal(game.cooldown, 0);
  assert.ok(events.some((e) => e.type === 'toast'));
});

test('gioco: si prende dallo scaffale, si consegna, torna a posto', () => {
  const { game, events } = newGame();
  setAll(game, 30);
  assert.equal(game.interact('toy', 'giulia'), false, 'senza gioco non si può');

  assert.ok(game.openShelf());
  until(game, () => events.some((e) => e.type === 'shelf'));
  assert.equal(game.map.areaAt(game.player.x, game.player.y), 'giochi');

  assert.ok(game.takeToy('libro'));
  assert.ok(game.takeToy('peluche'), 'si può cambiare gioco');
  assert.ok(game.shelf.available.has('libro'));
  assert.ok(!game.shelf.available.has('peluche'));

  const kid = game.kidById('giulia'); // preferisce il peluche
  game.interact('toy', kid.id);
  until(game, () => game.player.action?.type === 'giving');
  const before = kid.happiness;
  until(game, () => !game.player.busy);
  const expected = CONFIG.toys.gain + CONFIG.toys.favouriteBonus;
  assert.ok(kid.happiness > before + expected - 0.05);
  assert.equal(game.player.carried, null);
  assert.equal(kid.toy.id, 'peluche');

  run(game, CONFIG.toys.keepSeconds + 1);
  assert.equal(kid.toy, null);
  assert.ok(game.shelf.available.has('peluche'));
});

test('chi non può alzarsi rifiuta l’invito', () => {
  const { game } = newGame();
  const kid = game.kidById('matteo');
  game.interact('invite', kid.id);
  until(game, () => !game.player.task);
  assert.equal(kid.state, 'bed');
  assert.ok(kid.bubble.text.includes('Non posso'));
});

test('invito: il bambino segue in sala giochi, si gioca e torna a letto', () => {
  const { game } = newGame();
  setAll(game, 30);
  const friends = ['giulia', 'sofia'].map((id) => game.kidById(id));
  for (const kid of friends) {
    game.interact('invite', kid.id);
    until(game, () => kid.state === 'following');
  }
  assert.equal(game.readyToPlay().length, 0);

  assert.ok(game.walk(17.5, 7.5));
  until(game, () => game.readyToPlay().length === 2, 90);
  assert.ok(game.playTogether());
  const before = friends.map((k) => k.happiness);
  until(game, () => !game.player.busy);
  friends.forEach((kid, i) => assert.ok(kid.happiness >= Math.min(100, before[i] + CONFIG.playdate.gain) - 0.05));
  until(game, () => friends.every((k) => k.state === 'bed'), 90);
  for (const kid of friends) assert.equal(game.map.areaAt(kid.x, kid.y), kid.bed.room);
});

test('non più di tre bambini al seguito; si possono rimandare a letto', () => {
  const { game } = newGame();
  const ids = ['giulia', 'sofia', 'leo', 'tommaso'];
  for (const id of ids) {
    game.interact('invite', id);
    until(game, () => !game.player.task && !game.player.moving);
  }
  assert.deepEqual(ids.map((id) => game.kidById(id).state), ['following', 'following', 'following', 'bed']);
  game.interact('sendBack', 'giulia');
  until(game, () => game.kidById('giulia').state === 'bed', 90);
});

test('partita lunga e caotica: nessun errore e valori sempre validi', () => {
  for (let seed = 1; seed <= 6; seed++) {
    const { game } = newGame(seed, 'lorenzo', 2); // con i colleghi e qualche cambio di volontario
    const rng = seeded(seed * 101);
    const types = ['approach', 'balloon', 'toy', 'invite', 'sendBack'];
    for (let step = 0; step < 24000; step++) {
      if (step % 37 === 0) {
        const roll = rng();
        const kid = game.kids[Math.floor(rng() * game.kids.length)];
        if (roll < 0.45) game.interact(types[Math.floor(rng() * types.length)], kid.id);
        else if (roll < 0.55) game.walk(rng() * 21, rng() * 16);
        else if (roll < 0.62) game.superpower();
        else if (roll < 0.7) game.openShelf();
        else if (roll < 0.76) game.takeToy(game.shelf.list()[0]);
        else if (roll < 0.9) game.playTogether();
        else if (roll < 0.93) game.changeCharacter(CHARACTERS[Math.floor(rng() * CHARACTERS.length)].id);
      }
      game.update(0.05);
      for (const k of game.kids) {
        assert.ok(k.happiness >= 0 && k.happiness <= 100);
        assert.ok(game.map.areaAt(k.x, k.y), `${k.id} fuori mappa`);
        if (k.state !== 'bed') assert.ok(game.map.isWalkable(k.tile.x, k.tile.y), `${k.id} dentro un mobile`);
      }
      for (const v of game.volunteers) {
        assert.ok(game.map.isWalkable(v.tile.x, v.tile.y), `${v.character.id} dentro un mobile`);
      }
      assert.equal(new Set(game.volunteers.map((v) => v.character.id)).size, 3, 'volontari doppi');
      for (const k of game.kids) assert.equal(k.state === 'following' && !k.leader, false, `${k.id} segue nessuno`);
    }
    // nessun gioco perso per strada
    const out = game.kids.filter((k) => k.toy).map((k) => k.toy.id).concat(game.volunteers.flatMap((v) => v.carried ?? []));
    assert.equal(new Set(out).size, out.length);
    assert.equal(game.shelf.available.size + out.length, 6);
  }
});
