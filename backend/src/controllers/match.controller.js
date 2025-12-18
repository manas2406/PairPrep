const redis = require("../redis");
const { getUserBySocket, getSocketByUser } = require("../store/sockets");
const { getUser } = require("../store/users");
const { createRoom } = require("../store/rooms");
const { selectProblem } = require("../utils/problemSelector");

const QUEUE_KEY = "pairprep:queue";

/*
  Redis-based matchmaking (STABLE + SIMPLE)

  - Redis stores USER IDS (never socket IDs)
  - Socket IDs are resolved at runtime
  - No room joins required for matching
*/

async function startMatch(req, res) {
  const socketId = req.headers["x-socket-id"];
  const io = req.app.get("io");

  console.log("➡️ /match/start called with socket:", socketId);

  if (!socketId) {
    return res.status(400).json({ error: "Missing socket ID" });
  }

  const userId = getUserBySocket(socketId);
  if (!userId) {
    return res.status(400).json({ error: "Socket not bound to user" });
  }

  try {
    // Try to pop a waiting opponent (USER ID)
    const opponentUserId = await redis.rpop(QUEUE_KEY);

    // No opponent → enqueue self
    if (!opponentUserId || opponentUserId === userId) {
      await redis.lpush(QUEUE_KEY, userId);
      console.log("⏳ User waiting:", userId);
      return res.json({ status: "waiting" });
    }

    console.log("🤝 Match:", opponentUserId, "vs", userId);

    const userA = getUser(opponentUserId);
    const userB = getUser(userId);

    if (!userA || !userB) {
      // Safety: put opponent back
      await redis.lpush(QUEUE_KEY, opponentUserId);
      return res.status(400).json({ error: "User profile missing" });
    }

    // Exclude already solved problems (SAFE, does not block)
    const excluded = new Set([
      ...userA.solvedProblems,
      ...userB.solvedProblems,
    ]);

    const problem =
      selectProblem(800, 1200, excluded) ||
      {
        id: "FALLBACK",
        name: "Fallback Problem",
        rating: 800,
        url: "https://codeforces.com/problemset",
      };

    const roomId = `room_${Date.now()}`;

    createRoom(roomId, problem.id, [opponentUserId, userId]);

    // 🔑 Emit match to BOTH users directly
    const socketA = getSocketByUser(opponentUserId);
    const socketB = getSocketByUser(userId);

    if (socketA) {
      io.to(socketA).emit("match_found", {
        roomId,
        problem,
      });
    }

    if (socketB) {
      io.to(socketB).emit("match_found", {
        roomId,
        problem,
      });
    }

    return res.json({
      status: "matched",
      roomId,
    });
  } catch (err) {
    console.error("🔥 MATCHMAKING CRASH 🔥");
    console.error(err.stack);

    return res.status(500).json({
      error: "Matchmaking crashed",
      message: err.message,
    });
  }
}

module.exports = {
  startMatch,
};
