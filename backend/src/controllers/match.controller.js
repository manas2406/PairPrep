const redis = require("../redis");
const User = require("../models/User");
const { selectProblem } = require("../utils/problemSelector");
const { getUserBySocket } = require("../store/sockets");
const { createRoom } = require("../store/rooms");

const QUEUE_PREFIX = "pairprep:queue:";

async function startMatch(req, res) {
  const socketId = req.headers["x-socket-id"];
  const io = req.app.get("io");
  // Use explicit exact rating passed from frontend, default to 800
  const rating = req.body?.rating ? Number(req.body.rating) : 800;
  const queueKey = `${QUEUE_PREFIX}${rating}`;

  if (!socketId) {
    return res.status(400).json({ error: "Missing socket ID" });
  }

  try {
    const currentUserId = getUserBySocket(socketId);
    console.log(`[startMatch] Received request for socketId: ${socketId}, user: ${currentUserId}, rating: ${rating}`);
    console.log(`[startMatch] Headers: ${JSON.stringify(req.headers)}`);

    if (!currentUserId) {
      console.log(`[startMatch] Error: currentUserId is null for socket ${socketId}`);
      return res.status(400).json({ error: "Invalid socket" });
    }

    // Try to get opponent from this specific rating queue
    const opponentSocket = await redis.rpop(queueKey);
    console.log(`[startMatch] Popped opponentSocket from queue ${queueKey}: ${opponentSocket}`);

    // No opponent → wait
    if (!opponentSocket) {
      console.log(`[startMatch] No opponent found. Pushing ${socketId} to queue ${queueKey} and waiting.`);
      await redis.lpush(queueKey, socketId);
      return res.json({ status: "waiting" });
    }

    // Prevent self-match
    if (opponentSocket === socketId) {
      console.log(`[startMatch] opponentSocket matches socketId. Pushing back to queue and waiting.`);
      await redis.lpush(queueKey, socketId);
      return res.json({ status: "waiting" });
    }

    const opponentUserId = getUserBySocket(opponentSocket);
    if (!opponentUserId) {
      console.log(`[startMatch] Opponent socket ${opponentSocket} is invalid. Putting ${socketId} back in queue.`);
      await redis.lpush(queueKey, socketId);
      return res.json({ status: "waiting" });
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

    // Select problem STRICTLY of that exact rating
    const problem = selectProblem(rating, rating, excludedProblems);

    if (!problem) {
      await redis.lpush(queueKey, opponentSocket);
      return res.status(500).json({ error: "No unsolved problem available" });
    }

    const roomId = `room_${Date.now()}`;
    const startTime = Date.now();

    createRoom(roomId, problem.id, [userA.username, userB.username], startTime);

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
