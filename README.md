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
| **Superpotere** | Acrobazie di calisthenics: doppia felicità a tutti i bambini nella stanza |

Trascina per spostare la visuale, rotella o due dita per lo zoom. Tasti: `1` `2` `3` azioni, `4` o `Spazio` superpotere, `C` centra, `M` audio, `H` aiuto.

La partita non ha una fine.

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
src/entities/          volontario, bambini, adulti
src/art/               disegni su canvas
src/engine/            isometria, visuale, input, percorsi, audio
src/ui/                schermate e pannelli
tests/                 test delle regole
```

## Aggiungere un volontario

1. Crea `src/characters/nome.js` seguendo `lorenzo.js` (aspetto e mosse).
2. Aggiungilo alla lista in `src/characters/index.js`.
3. Scrivi nome e descrizione in `src/strings.it.js` (`characters`).
4. Disegna il ritratto in `src/art/portrait.js`.

Un superpotere con mosse nuove richiede anche le pose in `src/art/characterRig.js` e i nomi in `strings.it.js` (`superMoves`). Un superpotere con effetti diversi dalla doppia felicità richiede una modifica in `src/game/game.js`.

## Test

```bash
npm test
```

Per le prove manuali, aprendo la pagina con `?debug` la console espone `window.__sorrisi` (ad esempio `__sorrisi.game.forcedOutcome = 'pop'`).

Le foto reali in `assets/character_images/` servono solo come riferimento per i disegni e sono escluse da Git.

Tutta la grafica è originale e disegnata dal codice.
