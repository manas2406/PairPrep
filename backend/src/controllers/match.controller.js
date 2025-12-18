const { getUserBySocket } = require("../store/sockets");

let waitingUser = null;

async function startMatch(req, res) {
  const socketId = req.headers["x-socket-id"];
  const io = req.app.get("io");

  console.log("➡️ /match/start from socket:", socketId);

  if (!socketId) {
    return res.status(400).json({ error: "Missing socket ID" });
  }

  const userId = getUserBySocket(socketId);
  if (!userId) {
    return res.status(400).json({ error: "Socket not bound to user" });
  }

  // No one waiting → store self
  if (!waitingUser) {
    waitingUser = { userId, socketId };
    console.log("⏳ User waiting:", userId);
    return res.json({ status: "waiting" });
  }

  // Prevent self-match
  if (waitingUser.userId === userId) {
    return res.json({ status: "waiting" });
  }

  // Match found
  const roomId = `room_${Date.now()}`;
  const opponent = waitingUser;
  waitingUser = null;

  console.log("🤝 Match:", opponent.userId, "vs", userId);

  const problem = {
    id: "TEST",
    name: "Dummy Problem",
    rating: 800,
    url: "https://codeforces.com/problemset",
  };

  io.to(opponent.socketId).emit("match_found", {
    roomId,
    problem,
  });

  io.to(socketId).emit("match_found", {
    roomId,
    problem,
  });

  return res.json({ status: "matched", roomId });
}

module.exports = { startMatch };
