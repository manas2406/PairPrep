const redis = require("../redis");

const QUEUE_KEY = "pairprep:queue";

async function startMatch(req, res) {
  const socketId = req.headers["x-socket-id"];
  const io = req.app.get("io");

  if (!socketId) {
    return res.status(400).json({ error: "Missing socket ID" });
  }

  // Try to get someone from queue
  const opponentSocket = await redis.rpop(QUEUE_KEY);

  if (!opponentSocket) {
    // No one waiting → add self to queue
    await redis.lpush(QUEUE_KEY, socketId);

    return res.json({ status: "waiting" });
  }

  // Prevent self-matching
  if (opponentSocket === socketId) {
    await redis.lpush(QUEUE_KEY, socketId);
    return res.json({ status: "waiting" });
  }

  const roomId = `room_${Date.now()}`;

  io.to(opponentSocket).emit("match_found", { roomId });
  io.to(socketId).emit("match_found", { roomId });

  return res.json({ status: "matched", roomId });
}

module.exports = { startMatch };
