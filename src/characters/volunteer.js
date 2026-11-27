// Base comune a tutti i volontari: la maglietta bianca con l'orsetto.
const TEE = { topStyle: 'tee', top: '#fbfaf5', bear: true };

/**
 * look: aspetto in gioco; portrait: particolari del solo ritratto;
 * gear: 'balloons' (pompa e palloncini) o 'guitar';
 * moves: mosse del superpotere, usate in sequenza.
 */
export const volunteer = ({ id, look, portrait = {}, gear = 'balloons', moves }) => ({
  id,
  gear,
  portrait,
  look: { shoes: '#3a2c28', ...look, ...TEE },
  superpower: { moves },
});
