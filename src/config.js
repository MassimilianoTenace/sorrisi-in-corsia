// Tutti i numeri di gioco stanno qui: modificali per bilanciare la partita.
export const CONFIG = {
  happiness: {
    min: 0,
    max: 100,
    startMin: 28,
    startMax: 55,
    decayPerSecond: 0.22, // la felicità cala lentamente...
    decayFloor: 20, // ...ma il solo passare del tempo non scende sotto questo valore
  },
  balloon: {
    duration: 3.2, // secondi per gonfiare e modellare
    popChance: 0.2,
    gain: 20, // bambino scelto, palloncino riuscito
    nearbyGain: 6, // bambini vicini, palloncino riuscito
    popUpset: -10, // scoppio: chi si spaventa
    popAmused: 6, // scoppio: chi ride
    radius: 4.5, // distanza (in caselle) entro cui i bambini "vedono"
    keepSeconds: 60,
  },
  superpower: {
    duration: 4.5,
    cooldown: 20,
    multiplier: 2, // guadagno = balloon.gain x multiplier, per ogni bambino nella stanza
  },
  toys: {
    giveDuration: 2.6,
    gain: 18,
    favouriteBonus: 12,
    keepSeconds: 40, // dopo questo tempo il gioco torna sullo scaffale
  },
  playdate: {
    duration: 6,
    gain: 30,
    maxFollowers: 3,
  },
  speed: {
    player: 3.4, // caselle al secondo
    kid: 3.1,
    adult: 1.7,
  },
};
