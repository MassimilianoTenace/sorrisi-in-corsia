// Schermate sovrapposte: titolo, scelta del personaggio, aiuto e scaffale dei giochi.
import { el } from './dom.js';
import { S } from '../strings.it.js';
import { CHARACTERS } from '../characters/index.js';
import { drawPortrait } from '../art/portrait.js';
import { icon, toyIcon } from '../art/icons.js';
import { TOY_IDS } from '../art/props.js';

export function createScreens(root, { onStart, onChange, onClick }) {
  let current = null;
  let chosen = CHARACTERS[0].id; // la scelta resta tornando indietro

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
          button(S.play, () => select(), { class: 'btn primary', 'data-autofocus': '' }),
          button(S.howTo, () => help(title)),
        ),
      ),
    );
  }

  // Con "change" si cambia volontario a partita in corso; inWard sono i colleghi in reparto.
  function select({ change = false, current = chosen, inWard = [] } = {}) {
    let picked = current;
    const detail = el('div', { class: 'detail', 'aria-live': 'polite' });
    const describe = () => {
      const text = S.characters[picked];
      detail.replaceChildren(
        el('strong', {}, text.name),
        el('span', { class: 'power' }, icon('super', 20), `${S.superpowerLabel}: ${text.power}`),
        el('span', { class: 'desc' }, text.description),
      );
    };
    const cards = CHARACTERS.map((c) => {
      const canvas = el('canvas', { width: 220, height: 242, class: 'portrait' });
      drawPortrait(canvas, c, { gear: true });
      const card = el('button', {
        type: 'button',
        class: `card${c.id === picked ? ' selected' : ''}`,
        'aria-pressed': String(c.id === picked),
        'data-character': c.id,
        onclick: () => {
          picked = c.id;
          cards.forEach((other) => {
            other.classList.toggle('selected', other === card);
            other.setAttribute('aria-pressed', String(other === card));
          });
          describe();
        },
      },
        canvas,
        el('strong', {}, S.characters[c.id].name),
        inWard.includes(c.id) && el('span', { class: 'badge' }, S.inWard),
      );
      return card;
    });
    describe();
    const confirm = () => {
      chosen = picked;
      hide();
      if (change) onChange(picked);
      else onStart(picked);
    };
    show('select',
      el('div', { class: 'panel select-panel' },
        el('h2', {}, change ? S.changeCharacter : S.chooseCharacter),
        el('div', { class: 'cards' }, ...cards),
        detail,
        el('div', { class: 'row' },
          change ? button(S.cancel, hide) : button(S.back, title),
          button(change ? S.confirmChange : S.start, confirm, { class: 'btn primary', 'data-autofocus': '' }),
        ),
      ),
    );
    root.querySelector('.card.selected')?.scrollIntoView({ block: 'nearest' });
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
    select,
    help,
    shelf,
    hide,
    get current() {
      return current;
    },
  };
}
