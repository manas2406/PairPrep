const problems = require("../data/codeforces_problems.json");

/*
 excludedProblems: Set of problemIds like "1760C"
*/
function selectProblem(minRating, maxRating, excludedProblems = new Set()) {
  const candidates = problems.filter(
    (p) =>
      p.rating >= minRating &&
      p.rating <= maxRating &&
      !excludedProblems.has(p.id)
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
