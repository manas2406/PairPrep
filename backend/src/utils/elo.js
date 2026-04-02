// backend/src/utils/elo.js

function getKFactor(matchesPlayed, rating) {
  if (matchesPlayed < 10) return 40;
  if (rating >= 2000) return 16;
  return 24;
}

/**
 * Calculate new ratings after a match.
 * @param {Object} winner - { username, rating, matchesPlayed }
 * @param {Object} loser  - { username, rating, matchesPlayed }
 * @returns {{ winner: { delta, newRating }, loser: { delta, newRating } }}
 */
function calculateElo(winner, loser) {
  const Ra = winner.rating;
  const Rb = loser.rating;

  // Expected scores
  const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
  const Eb = 1 - Ea;

  const Ka = getKFactor(winner.matchesPlayed, Ra);
  const Kb = getKFactor(loser.matchesPlayed, Rb);

  // Actual: winner gets 1, loser gets 0
  const winnerDelta = Math.round(Ka * (1 - Ea));
  const loserDelta  = Math.round(Kb * (0 - Eb));

  // Floor: rating never drops below 800 (like Codeforces)
  const RATING_FLOOR = 800;

  return {
    winner: {
      delta:     winnerDelta,
      newRating: Ra + winnerDelta,
    },
    loser: {
      delta:     loserDelta, // This is negative
      newRating: Math.max(RATING_FLOOR, Rb + loserDelta),
    },
  };
}

module.exports = { calculateElo, getKFactor };
