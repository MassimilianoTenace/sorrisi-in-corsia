# Sorrisi in Corsia

Gioco per browser: sei un volontario in un reparto di pediatria e porti allegria ai bambini con palloncini, giochi e acrobazie. Funziona su computer e telefono, senza installare nulla.

## Come si gioca

| Azione | Cosa succede |
| --- | --- |
| Tocca il pavimento | Il volontario cammina |
| Tocca un bambino | Compare la sua scheda con le azioni |
| **Palloncino** | Una figura da modellare. A volte scoppia: qualcuno si spaventa, qualcuno ride |
| **Gioco** | Prendilo dallo scaffale in sala giochi e portalo a un bambino. Il preferito vale di più |
| **Vieni a giocare** | Il bambino ti segue in sala giochi, poi premi "Giocate insieme" |
| **Superpotere** | Diverso per ogni volontario: doppia felicità a tutti i bambini nella stanza. Chi ha più mosse le usa in sequenza |
| **Cambia** (il ritratto in basso) | Cambi volontario a partita in corso: posizione, punteggi, gioco in mano e bambini al seguito restano |

Trascina per spostare la visuale, rotella o due dita per lo zoom. Tasti: `1` `2` `3` azioni, `4` o `Spazio` superpotere, `P` cambia volontario, `C` centra, `M` audio, `H` aiuto.

La partita non ha una fine.

## I colleghi

Con te lavorano due volontari scelti a caso. Da soli salutano i bambini, fanno palloncini (o cantano), portano giochi, li accompagnano in sala giochi e usano il superpotere. Tu hai la precedenza: se tocchi un bambino verso cui stanno andando rinunciano, se ci stanno già lavorando aspetti un attimo. Se scegli uno di loro con **Cambia**, vi scambiate. I contatori in basso contano solo le tue azioni. Ritmo e attività si regolano in `src/config.js` (`colleagues`).

## I volontari

Tutti indossano la maglietta bianca con l'orsetto e girano con pompetta e palloncini, tranne Mimmo che porta la chitarra: al posto del palloncino suona una canzone (e ogni tanto si rompe una corda).

| Volontario | Superpotere |
| --- | --- |
| Lorenzo | Calisthenics: verticale, planche, L-sit, bandiera umana |
| Gianni | Modella un orsacchiotto d'oro di palloncini (porta sempre il cappellino) |
| Caterina | In sequenza: fa sparire la pancetta con la bacchetta magica, poi «Pancetta per tutti!» |
| Mariapa' | Fa sparire un LEGO con la bacchetta magica |
| Marina | Rutto: i bambini nella stanza restano un po' con i capelli bianchi e arruffati |
| Sabrina | Balla su una scatola: «Sono Shakira!» |
| Mariafrancesca | Danza classica |
| Benedetta | Artigli da Wolverine |
| Giovanna | Pittata di faccia: rossetto, fard e matita |
| Gabriella | Cambia vestito e indossa un abito elegante |
| Max | Giocoleria |
| Vincenzo | Pugilato |
| Emmanuele | Spider-Man: tuta, ragnatele e acrobazie |
| Mimmo | Rockstar con i capelli colorati |
| Anna | Selfie con lo smartphone |
| Martina | Tira fuori un cilindro e con la bacchetta magica fa uscire un coniglietto |
| Ida | Con bacchetta e lavagna spiega cose ai bambini |

## Provarlo sul proprio computer

Serve un piccolo server locale (aprire `index.html` con un doppio clic non basta):

```bash
npm start            # oppure: python3 -m http.server 8000
```

Poi apri <http://localhost:8000>.

## Pubblicarlo con GitHub Pages

1. Carica i file su GitHub (ramo `main`).
2. Nel repository: **Settings → Pages → Build and deployment**.
3. Source: **Deploy from a branch**, ramo `main`, cartella `/ (root)`, poi **Save**.
4. Dopo un paio di minuti il gioco è su `https://massimilianotenace.github.io/ai-abio/`.

Con un account GitHub gratuito il repository deve essere pubblico. Non c'è nessuna compilazione: i file vengono serviti così come sono.

## Struttura

```
index.html, styles.css
src/config.js          numeri di gioco (probabilità, punti, tempi)
src/strings.it.js      tutti i testi
src/characters/        volontari giocabili
src/world/             pianta del reparto e arredi
src/game/              regole (senza codice del browser)
src/entities/          volontari, bambini, adulti
src/art/               disegni su canvas
src/engine/            isometria, visuale, input, percorsi, audio
src/ui/                schermate e pannelli
tests/                 test delle regole
```

## Aggiungere un volontario

1. Crea `src/characters/nome.js` seguendo `lorenzo.js`: aspetto (`look`), particolari del ritratto (`portrait`), mosse e, se serve, `gear: 'guitar'`. La maglietta con l'orsetto è aggiunta da `volunteer.js`.
2. Aggiungilo alla lista in `src/characters/index.js`.
3. Scrivi nome, potere e descrizione in `src/strings.it.js` (`characters`).

Un'acconciatura nuova va disegnata sia in `src/art/hair.js` (in gioco) sia in `src/art/portrait.js` (ritratto).

Per una mossa nuova servono:

- tempi, battute ed effetti in `src/game/superMoves.js`;
- la posa in `src/art/superPoses.js` e gli eventuali oggetti o costumi in `src/art/superProps.js`;
- il nome in `strings.it.js` (`superMoves`) e le battute in `say.super`.

Un effetto nuovo sui bambini richiede una modifica in `updateSuper` (`src/game/game.js`).

Un'attività nuova per i colleghi è un generatore in più in `src/game/colleagues.js`, con il suo peso in `config.js`.

## Test

```bash
npm test
```

Per le prove manuali, aprendo la pagina con `?debug` la console espone `window.__sorrisi` (ad esempio `__sorrisi.game.forcedOutcome = 'pop'`).

Le foto reali in `assets/character_images/` servono solo come riferimento per i disegni e sono escluse da Git.

Tutta la grafica è originale e disegnata dal codice.
