// Schermate sovrapposte: titolo, scelta del personaggio, aiuto e scaffale dei giochi.
import { el } from './dom.js';
import { S } from '../strings.it.js';
import { CHARACTERS, LOCKED_SLOTS } from '../characters/index.js';
import { drawPortrait, drawLockedPortrait } from '../art/portrait.js';
import { icon, toyIcon } from '../art/icons.js';
import { TOY_IDS } from '../art/props.js';

export function createScreens(root, { onStart, onClick }) {
  let current = null;

  const show = (name, node) => {
    current = name;
    root.replaceChildren(node);
    root.hidden = false;
    root.dataset.screen = name;
    node.querySelector('[data-autofocus]')?.focus({ preventScroll: true });
  };
  const hide = () => {
    current = null;
    root.hidden = true;
    root.replaceChildren();
  };
  const button = (label, action, extra = {}) =>
    el('button', {
      type: 'button',
      class: 'btn',
      ...extra,
      onclick: () => {
        onClick();
        action();
      },
    }, label);

  const helpBody = () =>
    el('div', {},
      el('ul', { class: 'help-list' }, ...S.help.map((line) => el('li', {}, line))),
      el('p', { class: 'hint' }, S.helpControls),
    );

  function title() {
    show('title',
      el('div', { class: 'panel title-panel' },
        el('div', { class: 'title-icons' }, icon('balloon', 64), icon('heart', 48), icon('toy', 64)),
        el('h1', {}, S.title),
        el('p', {}, S.subtitle),
        el('div', { class: 'row' },
          button(S.play, select, { class: 'btn primary', 'data-autofocus': '' }),
          button(S.howTo, () => help(title)),
        ),
      ),
    );
  }

  function select() {
    let chosen = CHARACTERS[0];
    const cards = CHARACTERS.map((c) => {
      const text = S.characters[c.id];
      const canvas = el('canvas', { width: 360, height: 396, class: 'portrait' });
      drawPortrait(canvas, c.portrait, { balloons: true });
      const card = el('button', {
        type: 'button',
        class: 'card selected',
        'aria-pressed': 'true',
        onclick: () => {
          chosen = c;
          cards.forEach((other) => {
            other.classList.toggle('selected', other === card);
            other.setAttribute('aria-pressed', String(other === card));
          });
        },
      },
        canvas,
        el('strong', {}, text.name),
        el('span', { class: 'power' }, icon('super', 20), `${S.superpowerLabel}: ${text.power}`),
        el('span', { class: 'desc' }, text.description),
      );
      return card;
    });
    const locked = Array.from({ length: LOCKED_SLOTS }, () => {
      const canvas = el('canvas', { width: 360, height: 396, class: 'portrait' });
      drawLockedPortrait(canvas);
      return el('div', { class: 'card locked' }, canvas, el('strong', {}, S.comingSoon));
    });
    show('select',
      el('div', { class: 'panel select-panel' },
        el('h2', {}, S.chooseCharacter),
        el('div', { class: 'cards' }, ...cards, ...locked),
        el('div', { class: 'row' },
          button(S.back, title),
          button(S.start, () => {
            hide();
            onStart(chosen.id);
          }, { class: 'btn primary', 'data-autofocus': '' }),
        ),
      ),
    );
  }

  // back: funzione da richiamare alla chiusura (assente = si torna al gioco)
  function help(back) {
    show('help',
      el('div', { class: 'panel' },
        el('h2', {}, S.howTo),
        helpBody(),
        el('div', { class: 'row' },
          button(back ? S.back : S.resume, back ?? hide, { class: 'btn primary', 'data-autofocus': '' }),
        ),
      ),
    );
  }

  function shelf(game) {
    const toys = TOY_IDS.map((id) => {
      const holding = game.player.carried === id;
      const free = game.shelf.available.has(id);
      return el('button', {
        type: 'button',
        class: `toy-card${holding ? ' selected' : ''}`,
        disabled: !free,
        'data-toy': id,
        onclick: () => {
          game.takeToy(id);
          hide();
        },
      },
        toyIcon(id),
        el('strong', {}, S.toys[id]),
        el('span', {}, holding ? S.shelf.holding : free ? '' : S.shelf.taken),
      );
    });
    show('shelf',
      el('div', { class: 'panel' },
        el('h2', {}, S.shelf.title),
        el('p', {}, S.shelf.hint),
        el('div', { class: 'toys' }, ...toys),
        el('div', { class: 'row' },
          game.player.carried && button(S.shelf.putBack, () => {
            game.putBackToy();
            hide();
          }),
          button(S.close, hide, { class: 'btn primary', 'data-autofocus': '' }),
        ),
      ),
    );
  }

  return {
    title,
    help,
    shelf,
    hide,
    get current() {
      return current;
    },
  };
}
