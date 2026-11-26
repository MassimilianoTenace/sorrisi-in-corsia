// Per aggiungere un volontario: crea un file come lorenzo.js, aggiungilo qui,
// scrivi i suoi testi in strings.it.js e il ritratto in art/portrait.js.
import lorenzo from './lorenzo.js';

export const CHARACTERS = [lorenzo];
export const LOCKED_SLOTS = 2;

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
