// Per aggiungere un volontario: crea un file come lorenzo.js, aggiungilo qui
// e scrivi i suoi testi in strings.it.js.
import lorenzo from './lorenzo.js';
import gianni from './gianni.js';
import caterina from './caterina.js';
import mariapa from './mariapa.js';
import marina from './marina.js';
import sabrina from './sabrina.js';
import mariafrancesca from './mariafrancesca.js';
import benedetta from './benedetta.js';
import giovanna from './giovanna.js';
import gabriella from './gabriella.js';
import max from './max.js';
import vincenzo from './vincenzo.js';
import emmanuele from './emmanuele.js';
import mimmo from './mimmo.js';
import anna from './anna.js';

export const CHARACTERS = [
  lorenzo, gianni, caterina, mariapa, marina,
  sabrina, mariafrancesca, benedetta, giovanna, gabriella,
  max, vincenzo, emmanuele, mimmo, anna,
];

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
