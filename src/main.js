import { Game } from './game/game.js';
import { Scene } from './art/scene.js';
import { Camera } from './engine/camera.js';
import { attachInput } from './engine/input.js';
import { createAudio } from './engine/audio.js';
import { createHud } from './ui/hud.js';
import { createScreens } from './ui/screens.js';
import { createActionMenu, actionsFor } from './ui/actionMenu.js';
import { S } from './strings.it.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const panel = $('hud');

const audio = createAudio();
const scene = new Scene();
let game;
let camera;
let playing = false;
let dpr = 1;

function onGameEvent(event) {
  if (!playing) return; // la partita dimostrativa dietro al titolo è muta
  if (event.type === 'sound') audio.play(event.name);
  else if (event.type === 'toast') hud.toast(event.text);
  else if (event.type === 'shelf') screens.shelf(game);
}

function newGame(characterId) {
  game = new Game({ characterId, onEvent: onGameEvent });
  camera = new Camera(game.map.width, game.map.height);
  scene.marker = null;
  resize();
}

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const hudHeight = playing ? panel.offsetHeight : 0;
  document.documentElement.style.setProperty('--hud-height', `${hudHeight}px`);
  camera.resize(w, h, hudHeight);
  camera.update(0, game.player, true);
}

function follow() {
  camera.follow = true;
}

const click = () => {
  audio.unlock();
  audio.play('click');
};

function act(id, kidId) {
  audio.unlock();
  follow();
  if (id === 'shelf') game.openShelf();
  else game.interact(id, kidId);
}

const controls = {
  shelf: () => {
    click();
    follow();
    game.openShelf();
  },
  superpower: () => {
    audio.unlock();
    follow();
    game.superpower();
  },
  playTogether: () => {
    click();
    follow();
    game.playTogether();
  },
  center: () => {
    click();
    follow();
  },
  help: () => {
    click();
    screens.help();
  },
  changeCharacter: () => {
    if (game.player.busy) return;
    click();
    screens.select({
      change: true,
      current: game.player.character.id,
      inWard: game.colleagues.map((c) => c.character.id),
    });
  },
  toggleSound: () => {
    audio.unlock();
    hud.setMuted(audio.toggle());
    audio.play('click');
  },
};

const hud = createHud({ panel, roomLabel: $('room'), toasts: $('toasts') }, controls);
const screens = createScreens($('screens'), {
  onClick: click,
  onChange(characterId) {
    if (!game.changeCharacter(characterId)) return;
    hud.setCharacter(game);
    hud.toast(S.toast.changed(S.characters[characterId].name));
    follow();
  },
  onStart(characterId) {
    playing = true;
    document.body.classList.add('playing');
    newGame(characterId);
    hud.reset(game);
    hud.setMuted(audio.muted);
    hud.update(game);
    resize(); // ora il pannello ha la sua altezza definitiva
  },
});
const menu = createActionMenu($('action-menu'), {
  onAction: act,
  onClose: () => {
    game.selected = null;
  },
});

attachInput(canvas, {
  onTap(px, py) {
    if (!playing || screens.current) return;
    audio.unlock();
    const hit = scene.pick(game, camera, px, py);
    if (hit.type === 'kid') {
      audio.play('click');
      follow();
      if (!game.interact('approach', hit.kid.id)) game.selected = hit.kid.id;
    } else if (hit.type === 'colleague') {
      if (!hit.who.busy) hit.who.say(game.line(S.say.volunteerGreet), 2);
    } else if (hit.type === 'adult') {
      hit.adult.chat();
    } else if (hit.type === 'shelf') {
      controls.shelf();
    } else if (game.walk(hit.x, hit.y)) {
      follow();
      const last = game.player.path.at(-1);
      if (last) scene.mark(last.x, last.y);
    }
  },
  onPan(dx, dy) {
    if (playing) camera.pan(dx, dy);
  },
  onZoom(factor, px, py) {
    if (playing) camera.zoomAt(factor, px, py);
  },
});

function shortcut(number) {
  if (number === 4) return controls.superpower();
  const kid = game.selectedKid ?? game.nearestKid();
  if (!kid) {
    if (number === 2) return controls.shelf();
    return hud.toast(S.toast.noKidNear);
  }
  if (number === 3 && game.readyToPlay().length) return controls.playTogether();
  const action = actionsFor(game, kid)[number - 1];
  if (action.enabled) act(action.id, kid.id);
  return undefined;
}

window.addEventListener('keydown', (e) => {
  if (!playing || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (screens.current) {
    if (e.key === 'Escape') screens.hide();
    return;
  }
  // Spazio e Invio su un pulsante selezionato lo premono già da soli
  if ((e.key === ' ' || e.key === 'Enter') && e.target instanceof HTMLButtonElement) return;
  const key = e.key.toLowerCase();
  if (['1', '2', '3', '4'].includes(key)) shortcut(Number(key));
  else if (key === ' ') {
    e.preventDefault();
    controls.superpower();
  } else if (key === 'c') controls.center();
  else if (key === 'p') controls.changeCharacter();
  else if (key === 'm') controls.toggleSound();
  else if (key === 'h' || key === '?') controls.help();
  else if (key === 'escape') game.selected = null;
});

window.addEventListener('resize', resize);

let previous = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000));
  previous = now;
  // aiuto e scaffale mettono in pausa la partita
  const paused = playing && screens.current !== null;
  if (!paused) game.update(dt);
  camera.update(dt, playing ? game.player : null);
  scene.render(ctx, game, camera, dpr, dt);
  if (playing) {
    hud.update(game);
    menu.update(game, camera, screens.current !== null);
  }
  requestAnimationFrame(frame);
}

newGame();
screens.title();
requestAnimationFrame(frame);

// Strumenti di prova: apri la pagina con ?debug
if (new URLSearchParams(location.search).has('debug')) {
  window.__sorrisi = {
    get game() {
      return game;
    },
    get camera() {
      return camera;
    },
    scene,
    advance(seconds) {
      for (let t = 0; t < seconds; t += 0.05) game.update(0.05);
    },
  };
}
