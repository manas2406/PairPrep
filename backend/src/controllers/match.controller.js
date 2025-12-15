const redis = require("../redis");
const { selectProblem } = require("../utils/problemSelector");

const QUEUE_KEY = "pairprep:queue";

/*
 Matchmaking flow:
 1. User sends POST /match/start with x-socket-id
 2. Try to pop an opponent from Redis queue
 3. If none -> push self and wait
 4. If found -> create room + assign problem + notify both users
*/

async function startMatch(req, res) {
  const socketId = req.headers["x-socket-id"];
  const io = req.app.get("io");

  if (!socketId) {
    return res.status(400).json({ error: "Missing socket ID" });
  }

  try {
    // Try to get someone already waiting
    const opponentSocket = await redis.rpop(QUEUE_KEY);

    // No one waiting → add self to queue
    if (!opponentSocket) {
      await redis.lpush(QUEUE_KEY, socketId);

      return res.json({
        status: "waiting",
      });
    }

    // Prevent self-matching (edge case)
    if (opponentSocket === socketId) {
      await redis.lpush(QUEUE_KEY, socketId);

      return res.json({
        status: "waiting",
      });
    }

    // Create room
    const roomId = `room_${Date.now()}`;

    // TEMP: fixed difficulty range
    // (will become user-selected in Phase 6.2)
    const problem = selectProblem(800, 1200);

    if (!problem) {
      // Put opponent back if no problem found
      await redis.lpush(QUEUE_KEY, opponentSocket);

      return res.status(500).json({
        error: "No suitable problem found",
      });
    }

    // Notify both users in real-time
    io.to(opponentSocket).emit("match_found", {
      roomId,
      problem,
    });

    io.to(socketId).emit("match_found", {
      roomId,
      problem,
    });

    return res.json({
      status: "matched",
      roomId,
      problem,
    });
  } catch (err) {
    console.error("Matchmaking error:", err);

    return res.status(500).json({
      error: "Internal matchmaking error",
    });
  }
}

module.exports = {
  startMatch,
};
