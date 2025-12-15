const problems = require("../data/codeforces_problems.json");

function selectProblem(minRating, maxRating) {
  const candidates = problems.filter(
    (p) => p.rating >= minRating && p.rating <= maxRating
  );

  if (candidates.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

module.exports = {
  selectProblem,
};
