const redis = require("../redis");
const User = require("../models/User");
const { selectProblem } = require("../utils/problemSelector");
const { getUserBySocket } = require("../store/sockets");
const { createRoom } = require("../store/rooms");

const QUEUE_KEY = "pairprep:queue";

async function startMatch(req, res) {
  const socketId = req.headers["x-socket-id"];
  const io = req.app.get("io");
  const { ratingRange } = req.body || {};
  const [minRating, maxRating] = ratingRange
    ? ratingRange.split("-").map(Number)
    : [800, 1200];

  if (!socketId) {
    return res.status(400).json({ error: "Missing socket ID" });
  }

  try {
    const currentUserId = getUserBySocket(socketId);
    if (!currentUserId) {
      return res.status(400).json({ error: "Invalid socket" });
    }

    // Try to get opponent
    const opponentSocket = await redis.rpop(QUEUE_KEY);

    // No opponent → wait
    if (!opponentSocket) {
      await redis.lpush(QUEUE_KEY, socketId);
      return res.json({ status: "waiting" });
    }

    // Prevent self-match
    if (opponentSocket === socketId) {
      await redis.lpush(QUEUE_KEY, socketId);
      return res.json({ status: "waiting" });
    }

    const opponentUserId = getUserBySocket(opponentSocket);
    if (!opponentUserId) {
      return res.status(400).json({ error: "Opponent socket invalid" });
    }

    // Fetch both users from MongoDB
    const [userA, userB] = await Promise.all([
      User.findOne({ username: currentUserId }),
      User.findOne({ username: opponentUserId }),
    ]);

    if (!userA || !userB) {
      return res.status(400).json({ error: "User not found in DB" });
    }

    // Combine solved problems
    const excludedProblems = new Set([
      ...userA.solvedProblems,
      ...userB.solvedProblems,
    ]);

    const problem = selectProblem(minRating, maxRating, excludedProblems);

    if (!problem) {
      await redis.lpush(QUEUE_KEY, opponentSocket);
      return res.status(500).json({ error: "No unsolved problem available" });
    }

    const roomId = `room_${Date.now()}`;
    const startTime = Date.now();

    createRoom(roomId, problem.id, [userA, userB], startTime);

    io.to(socketId).emit("match_found", { roomId, problem });
    io.to(opponentSocket).emit("match_found", { roomId, problem });

    return res.json({
      status: "matched",
      roomId,
      problem,
    });
  } catch (err) {
    console.error("Matchmaking error:", err);
    return res.status(500).json({ error: "Matchmaking failed" });
  }
}

module.exports = { startMatch };
