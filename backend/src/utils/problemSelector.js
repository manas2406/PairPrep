const Problem = require("../models/Problem");

/*
 excludedProblems: Set of problemIds like "1760C"
*/
async function selectProblem(minRating, maxRating, excludedProblems = new Set()) {
  const excludedArray = Array.from(excludedProblems);

  // Use MongoDB aggregation to match and select a random problem
  const results = await Problem.aggregate([
    {
      $match: {
        rating: { $gte: minRating, $lte: maxRating },
        problemId: { $nin: excludedArray },
      },
    },
    { $sample: { size: 1 } },
  ]);

  if (results.length === 0) {
    return null;
  }

  // To maintain compatibility with existing problem structure where id is problemId
  const p = results[0];
  return {
    id: p.problemId,
    name: p.name,
    rating: p.rating,
    url: p.url
  };
}

module.exports = {
  selectProblem,
};
