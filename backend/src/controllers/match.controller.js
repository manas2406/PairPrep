const redis = require("../redis");
const User = require("../models/User");
const { selectProblem } = require("../utils/problemSelector");
const { getUserBySocket } = require("../store/sockets");
const { createRoom, getRoom } = require("../store/rooms");

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
    if (!currentUserId) {
      return res.status(400).json({ error: "Invalid socket" });
    }

    // 1. Race condition lock (Ensure user can't spam /start)
    const activeLock = await redis.setnx(`lock:match:${currentUserId}`, "1");
    if (!activeLock) {
        return res.status(429).json({ error: "Please wait before requesting again." });
    }
    await redis.expire(`lock:match:${currentUserId}`, 2); // 2 second lock

    // Check if user is already in an active room
    const currentRoom = await redis.get(`activeMatch:${currentUserId}`);
    if (currentRoom) {
        if (!getRoom(currentRoom)) {
            await redis.del(`activeMatch:${currentUserId}`);
        } else {
            return res.status(400).json({ error: "You are already in an active match. Please reconnect." });
        }
    }

    // Remove user explicitly from queue to prevent duplicates if they dropped out previously
    await redis.lrem(queueKey, 0, socketId);

    // 2. Loop to find valid opponent (Skipping dead sockets)
    let opponentSocket = null;
    let opponentUserId = null;
    
    while (true) {
        opponentSocket = await redis.rpop(queueKey);
        if (!opponentSocket) break; // queue is empty
        
        if (opponentSocket === socketId) continue; // skip self
        
        opponentUserId = getUserBySocket(opponentSocket);
        if (opponentUserId) {
            // make sure opponent isn't in an active match somehow
            const oppRoom = await redis.get(`activeMatch:${opponentUserId}`);
            if (oppRoom) {
               if (!getRoom(oppRoom)) {
                   await redis.del(`activeMatch:${opponentUserId}`);
               } else {
                   continue;
               }
            }
            break; // found valid opponent
        }
    }

    // No opponent → wait
    if (!opponentSocket || !opponentUserId) {
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

    // Combine all attempted + solved problems from both users
    const excludedProblems = new Set([
      ...(userA.solvedProblems || []),
      ...(userB.solvedProblems || []),
      ...(userA.attemptedProblems || []),
      ...(userB.attemptedProblems || []),
    ]);

    // Select problem STRICTLY of that exact rating
    const problem = await selectProblem(rating, rating, excludedProblems);

    if (!problem) {
      await redis.lpush(queueKey, opponentSocket);
      return res.status(500).json({ error: "No unsolved problem available" });
    }

    // Track this problem as attempted for both users (atomic)
    await Promise.all([
      User.updateOne({ username: userA.username }, { $addToSet: { attemptedProblems: problem.id } }),
      User.updateOne({ username: userB.username }, { $addToSet: { attemptedProblems: problem.id } }),
    ]);

    const roomId = `room_${Date.now()}`;
    const startTime = Date.now();

    createRoom(roomId, problem, [userA.username, userB.username], startTime);
    
    // Store persistence tokens
    await redis.set(`activeMatch:${userA.username}`, roomId);
    await redis.set(`activeMatch:${userB.username}`, roomId);

    io.to(socketId).emit("match_found", { roomId, problem });
    io.to(opponentSocket).emit("match_found", { roomId, problem });

    return res.json({
      status: "matched",
      roomId,
      problem,
    });
  } catch (err) {
    console.error("Matchmaking error:", err);
    return res.status(500).json({ error: `System Error: ${err.message}` });
  }
}

module.exports = { startMatch };
