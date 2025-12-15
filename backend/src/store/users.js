const users = new Map();

/*
User shape:
{
  userId: "u1",
  cfHandle: "tourist",
  solvedProblems: Set()
}
*/

function createUser(userId, cfHandle) {
  users.set(userId, {
    userId,
    cfHandle,
    solvedProblems: new Set(),
  });
}

function getUser(userId) {
  return users.get(userId);
}

module.exports = {
  createUser,
  getUser,
};
