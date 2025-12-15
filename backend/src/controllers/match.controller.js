let waitingUser = null;

function startMatch(req, res) {
  if (waitingUser === null) {
    waitingUser = "user1"; // fake user for now

    console.log("User added to queue");

    return res.json({
      status: "waiting",
    });
  }

  console.log("Match found!");

  waitingUser = null;

  return res.json({
    status: "matched",
    roomId: "room123",
  });
}

module.exports = {
  startMatch,
};
