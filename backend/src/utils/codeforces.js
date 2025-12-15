const axios = require("axios");

async function fetchSolvedProblems(cfHandle) {
  const url = `https://codeforces.com/api/user.status?handle=${cfHandle}`;

  const response = await axios.get(url);

  if (response.data.status !== "OK") {
    throw new Error("Codeforces API error");
  }

  const submissions = response.data.result;

  const solved = new Set();

  for (const sub of submissions) {
    if (sub.verdict === "OK") {
      const contestId = sub.problem.contestId;
      const index = sub.problem.index;
      if (contestId && index) {
        solved.add(`${contestId}${index}`);
      }
    }
  }

  return solved;
}

module.exports = {
  fetchSolvedProblems,
};
