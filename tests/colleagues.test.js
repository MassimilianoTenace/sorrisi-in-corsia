import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { CHARACTERS } from '../src/characters/index.js';
import { followersOf } from '../src/game/playdate.js';
import { retire, ACTIVITIES } from '../src/game/colleagues.js';
import { actionsFor } from '../src/ui/actionMenu.js';
import { Scene } from '../src/art/scene.js';
import { S } from '../src/strings.it.js';
import { newGame, run, until, place, fakeContext } from './helpers.js';

const ids = (game) => game.volunteers.map((v) => v.character.id);

// Partita con due colleghi che aspettano: le prove li comandano una alla volta.
function calm(characterId = 'lorenzo', seed = 1) {
  const setup = newGame(seed, characterId, 2);
  for (const c of setup.game.colleagues) {
    c.wait = 1e9;
    c.cooldown = 0;
  }
  return setup;
}

// Mette un volontario nella Stanza Giungla, accanto ai letti.
const nearGiulia = (who) => place(who, 2.5, 2.5);

test('entrano in corsia due colleghi a caso, diversi da te e tra loro', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    const { game } = newGame(seed, 'anna', CONFIG.colleagues.count);
    assert.equal(game.colleagues.length, 2);
    assert.equal(new Set(ids(game)).size, 3);
    game.colleagues.forEach((c) => {
      seen.add(c.character.id);
      assert.ok(game.map.isWalkable(c.tile.x, c.tile.y));
    });
  }
  assert.equal(seen.size, CHARACTERS.length - 1, 'prima o poi tocca a tutti gli altri');
});

test('lasciati soli, i colleghi fanno tutto ciò che fa un volontario', () => {
  const done = new Set();
  const stuck = [];
  for (let seed = 1; seed <= 6; seed++) {
    const { game, events } = newGame(seed, 'lorenzo', 2);
    const idle = game.colleagues.map(() => 0);
    for (let step = 0; step < 20 * 600; step++) {
      game.update(0.05);
      game.colleagues.forEach((c, i) => {
        if (c.action) done.add(c.action.type);
        if (c.task) done.add(`task:${c.task.type}`);
        if (c.activity) done.add(`activity:${c.activity}`);
        // salutare un bambino vicino non richiede passi: conta anche il fumetto
        idle[i] = c.action || c.moving || c.bubble ? 0 : idle[i] + 0.05;
        if (idle[i] > 45) stuck.push(`${c.character.id} (seme ${seed})`);
        assert.ok(game.map.isWalkable(c.tile.x, c.tile.y), `${c.character.id} dentro un mobile`);
      });
    }
    assert.ok(!events.some((e) => e.type === 'toast' || e.type === 'shelf'), 'i colleghi non disturbano con messaggi');
    assert.deepEqual(game.stats, { smiles: 0, balloons: 0, popped: 0, songs: 0, broken: 0 });
    const out = game.kids.filter((k) => k.toy).length + game.colleagues.filter((c) => c.carried).length;
    assert.equal(game.shelf.available.size + out, 6, 'nessun gioco perso');
  }
  for (const what of ['balloon', 'giving', 'playing', 'super', 'task:approach', 'task:invite', 'task:shelf']) {
    assert.ok(done.has(what), `mai fatto: ${what}`);
  }
  for (const name of ACTIVITIES) assert.ok(done.has(`activity:${name}`), name);
  assert.deepEqual(stuck, []);
});

test('con il giocatore fermo i colleghi aiutano senza saturare la felicità', () => {
  for (let seed = 1; seed <= 6; seed++) {
    const withHelp = newGame(seed, 'lorenzo', 2).game;
    let sum = 0;
    let samples = 0;
    for (let step = 1; step <= 20 * 900; step++) {
      withHelp.update(0.05);
      if (step % 200 === 0) {
        sum += withHelp.averageHappiness;
        samples++;
      }
    }
    const average = sum / samples;
    assert.ok(average > CONFIG.happiness.decayFloor + 5, `seme ${seed}: ${average}`);
    assert.ok(average < 80, `seme ${seed}: reparto troppo felice da solo (${average})`);
  }
});

test('un collega fa un palloncino e il merito non va ai tuoi contatori', () => {
  const { game } = calm();
  const [colleague] = game.colleagues;
  game.kids.forEach((k) => (k.happiness = 30));
  nearGiulia(colleague);
  assert.ok(game.interact('balloon', 'giulia', colleague));
  until(game, () => colleague.action?.type === 'balloon');
  until(game, () => !colleague.busy);
  assert.ok(game.kidById('giulia').happiness !== 30);
  assert.equal(game.stats.balloons + game.stats.popped + game.stats.smiles + game.stats.songs, 0);
  assert.equal(game.selected, null);
});

test('il superpotere dei colleghi ha la sua ricarica e non consuma la tua', () => {
  const { game } = calm();
  const [colleague] = game.colleagues;
  nearGiulia(colleague);
  assert.ok(game.superpower(colleague));
  assert.equal(colleague.cooldown, CONFIG.colleagues.superCooldown);
  assert.equal(game.cooldown, 0);
});

test('precedenza al giocatore: il collega in arrivo rinuncia', () => {
  const { game } = calm();
  const [colleague] = game.colleagues;
  assert.ok(game.interact('balloon', 'giulia', colleague));
  assert.equal(colleague.task.kidId, 'giulia');
  assert.ok(game.interact('balloon', 'giulia'));
  assert.equal(colleague.task, null);
  assert.equal(colleague.moving, false);
  assert.equal(game.interact('balloon', 'giulia', colleague), false, 'ora il bambino è tuo');
});

test('se un collega è già con il bambino, ti viene chiesto di aspettare', () => {
  const { game, events } = calm();
  const [colleague] = game.colleagues;
  nearGiulia(colleague);
  game.interact('balloon', 'giulia', colleague);
  assert.equal(colleague.action.type, 'balloon');
  assert.equal(game.interact('balloon', 'giulia'), false);
  const name = S.characters[colleague.character.id].name;
  assert.ok(events.some((e) => e.text === S.toast.busyWith(name, 'Giulia')));
  until(game, () => !colleague.busy);
  assert.ok(game.interact('balloon', 'giulia'));
});

test('chi segue un collega non si può invitare né rimandare a letto', () => {
  const { game, events } = calm();
  const [colleague] = game.colleagues;
  const kid = game.kidById('giulia');
  nearGiulia(colleague);
  game.interact('invite', kid.id, colleague);
  assert.equal(kid.leader, colleague);
  for (const type of ['invite', 'sendBack']) assert.equal(game.interact(type, kid.id), false, type);
  assert.equal(kid.leader, colleague);
  assert.ok(events.some((e) => e.type === 'toast' && e.text.includes('sta seguendo')));
  const third = actionsFor(game, kid)[2];
  assert.equal(third.enabled, false);
  assert.equal(third.label, S.actions.follows(S.characters[colleague.character.id].name));
});

test('ognuno ha i propri bambini al seguito, fino a tre a testa', () => {
  const { game } = calm();
  const [colleague] = game.colleagues;
  for (const id of ['giulia', 'sofia', 'leo']) {
    assert.ok(game.interact('invite', id));
    until(game, () => game.kidById(id).state === 'following');
  }
  assert.ok(game.interact('invite', 'tommaso', colleague));
  until(game, () => game.kidById('tommaso').state === 'following');
  assert.equal(followersOf(game.kids, game.player).length, 3);
  assert.deepEqual(followersOf(game.kids, colleague).map((k) => k.id), ['tommaso']);
});

test('due gruppi giocano insieme in sala giochi senza sovrapporsi', () => {
  const { game } = calm();
  const [colleague] = game.colleagues;
  const pairs = [[game.player, 'giulia'], [colleague, 'sofia']];
  for (const [who, id] of pairs) {
    game.interact('invite', id, who);
    until(game, () => game.kidById(id).state === 'following');
    game.walk(who === game.player ? 15.5 : 16.5, 7.5, who);
  }
  until(game, () => pairs.every(([who]) => game.readyToPlay(who).length === 1), 90);
  assert.equal(game.readyToPlay()[0].id, 'giulia', 'giochi solo con chi segue te');
  for (const [who] of pairs) assert.ok(game.playTogether(who));
  assert.notEqual(game.player.action.group, colleague.action.group);
  until(game, () => game.volunteers.every((v) => !v.busy));
  until(game, () => ['giulia', 'sofia'].every((id) => game.kidById(id).state === 'bed'), 90);
});

test('un’attività interrotta lascia tutto in ordine', () => {
  const { game } = calm();
  const [colleague] = game.colleagues;
  nearGiulia(colleague);
  game.interact('invite', 'giulia', colleague);
  game.takeToy('libro', colleague);
  retire(game, colleague);
  assert.equal(colleague.carried, null);
  assert.ok(game.shelf.available.has('libro'));
  assert.equal(followersOf(game.kids, colleague).length, 0);
  assert.ok(colleague.wait > 0);
  until(game, () => game.kidById('giulia').state === 'bed', 90);
});

test('i suoni dei colleghi si sentono solo nella tua stanza', () => {
  const { game, events } = calm();
  const [colleague] = game.colleagues;
  nearGiulia(colleague);
  game.interact('balloon', 'giulia', colleague);
  assert.ok(!events.some((e) => e.type === 'sound'));
  run(game, 4);
  events.length = 0;
  place(game.player, 4.5, 3.5);
  nearGiulia(colleague);
  game.interact('balloon', 'giulia', colleague);
  assert.ok(events.some((e) => e.type === 'sound'));
});

// ---------- cambio di volontario ----------
test('cambiando volontario la partita continua com’era', () => {
  const { game } = calm();
  game.interact('invite', 'giulia');
  until(game, () => game.kidById('giulia').state === 'following');
  game.takeToy('libro');
  game.cooldown = 7;
  game.stats.smiles = 42;
  const { x, y } = game.player;
  const free = CHARACTERS.find((c) => !ids(game).includes(c.id)).id;
  assert.ok(game.changeCharacter(free));
  assert.equal(game.player.character.id, free);
  assert.deepEqual([game.player.x, game.player.y], [x, y]);
  assert.equal(game.player.carried, 'libro');
  assert.equal(game.cooldown, 7, 'cambiare non ricarica il superpotere');
  assert.equal(game.stats.smiles, 42);
  assert.equal(game.kidById('giulia').leader, game.player);
});

test('scegliendo un collega vi scambiate, senza doppioni', () => {
  const { game } = calm();
  const [colleague, other] = game.colleagues;
  const wanted = colleague.character.id;
  const kept = other.character.id;
  nearGiulia(colleague);
  const where = [colleague.x, colleague.y];
  game.interact('balloon', 'giulia', colleague);
  assert.ok(game.changeCharacter(wanted));
  assert.deepEqual(ids(game), [wanted, 'lorenzo', kept]);
  assert.equal(colleague.busy, false, 'il collega ricomincia da capo');
  assert.deepEqual([colleague.x, colleague.y], where);
});

test('non si cambia mentre si è impegnati, né con un volontario inesistente', () => {
  const { game } = calm();
  assert.equal(game.changeCharacter('nessuno'), false);
  assert.equal(game.changeCharacter('lorenzo'), false, 'sei già tu');
  game.interact('balloon', 'giulia');
  until(game, () => game.player.busy);
  assert.equal(game.changeCharacter('anna'), false);
  assert.equal(game.player.character.id, 'lorenzo');
});

test('la scena disegna e permette di toccare i colleghi', () => {
  const { game } = calm();
  const scene = new Scene();
  const drawn = [];
  scene.cache = { clear() {}, setScale() {}, draw: (ctx, key) => drawn.push(key) };
  for (const item of scene.items(game)) item.draw(fakeContext());
  for (const key of ['player', 'colleague1', 'colleague2']) assert.ok(drawn.includes(key), key);
  const camera = {
    zoom: 1,
    view: { w: 2000, h: 2000 },
    worldToView: (x, y, z = 0) => ({ x: (x - y) * 32 + 1000, y: (x + y) * 16 - z + 200 }),
    screenToWorld: () => ({ x: -1, y: -1 }),
  };
  const [colleague] = game.colleagues;
  const p = camera.worldToView(colleague.x, colleague.y, 40);
  assert.deepEqual(scene.pick(game, camera, p.x, p.y), { type: 'colleague', who: colleague });
  assert.doesNotThrow(() => scene.labels(fakeContext(), game, camera));
});
