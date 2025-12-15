const users = new Map();

function createUser(userId, cfHandle) {
  users.set(userId, {
    userId,
    cfHandle,
    solvedProblems: new Set(),
    lastFetchedAt: null,
  });
}

function getUser(userId) {
  return users.get(userId);
}

function setSolvedProblems(userId, solvedSet) {
  const user = users.get(userId);
  if (!user) return;

  user.solvedProblems = solvedSet;
  user.lastFetchedAt = Date.now();
}

module.exports = {
  createUser,
  getUser,
  setSolvedProblems,
};
