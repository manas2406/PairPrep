const axios = require("axios");
const axiosRetry = require("axios-retry").default;
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const Match = require("../models/Match");
const User = require("../models/User");
const { getRoom, finishRoom } = require("../store/rooms");
const { getUserBySocket } = require("../store/sockets");
const { calculateElo } = require("../utils/elo");
const redis = require("../redis");

async function applyMatchResult(roomData, winnerId, io, roomId) {
  const [winnerDoc, loserDoc] = await Promise.all([
    User.findOne({ username: winnerId }),
    User.findOne({ username: roomData.participants.find(p => p !== winnerId) }),
  ]);

  if (!winnerDoc || !loserDoc) throw new Error("User not found during ELO update");

  const winnerOldRating = winnerDoc.rating;
  const loserOldRating  = loserDoc.rating;

  const eloResult = calculateElo(
    { username: winnerDoc.username, rating: winnerDoc.rating, matchesPlayed: winnerDoc.matchesPlayed },
    { username: loserDoc.username,  rating: loserDoc.rating,  matchesPlayed: loserDoc.matchesPlayed }
  );

  const endTime  = Date.now();
  const duration = Math.floor((endTime - roomData.startedAt) / 1000);

  const match = await Match.create({
    roomId,
    players:  roomData.participants,
    winner:   winnerId,
    loser:    loserDoc.username,
    problem:  roomData.problem,
    ratingChanges: [
      { username: winnerDoc.username, before: winnerOldRating, after: eloResult.winner.newRating, delta: eloResult.winner.delta },
      { username: loserDoc.username,  before: loserOldRating,  after: eloResult.loser.newRating,  delta: eloResult.loser.delta  },
    ],
    startedAt:       new Date(roomData.startedAt),
    endedAt:         new Date(endTime),
    durationSeconds: duration,
    status:          "completed",
  });

  const matchIdStr = match._id.toString();

  // --- Update WINNER ---
  winnerDoc.matchesPlayed += 1;
  winnerDoc.matchesWon    += 1;
  winnerDoc.rating         = eloResult.winner.newRating;
  winnerDoc.peakRating     = Math.max(winnerDoc.peakRating || 0, eloResult.winner.newRating);
  winnerDoc.solvedProblems = winnerDoc.solvedProblems || [];
  if (!winnerDoc.solvedProblems.includes(roomData.problemId)) {
    winnerDoc.solvedProblems.push(roomData.problemId);
  }
  winnerDoc.ratingHistory.push({
    rating:    eloResult.winner.newRating,
    delta:     eloResult.winner.delta,
    matchId:   matchIdStr,
    opponent:  loserDoc.username,
    result:    "win",
  });
  
  if (winnerDoc.ratingHistory.length > 100) {
    winnerDoc.ratingHistory = winnerDoc.ratingHistory.slice(-100);
  }
  await winnerDoc.save();

  // --- Update LOSER ---
  loserDoc.matchesPlayed += 1;
  loserDoc.matchesLost   += 1;
  loserDoc.rating         = eloResult.loser.newRating;
  loserDoc.solvedProblems = loserDoc.solvedProblems || [];
  if (!loserDoc.solvedProblems.includes(roomData.problemId)) {
    loserDoc.solvedProblems.push(roomData.problemId);
  }
  loserDoc.ratingHistory.push({
    rating:    eloResult.loser.newRating,
    delta:     eloResult.loser.delta,
    matchId:   matchIdStr,
    opponent:  winnerDoc.username,
    result:    "loss",
  });
  
  if (loserDoc.ratingHistory.length > 100) {
    loserDoc.ratingHistory = loserDoc.ratingHistory.slice(-100);
  }
  await loserDoc.save();

  await Promise.all([
    redis.zadd("leaderboard", eloResult.winner.newRating, winnerDoc.username),
    redis.zadd("leaderboard", eloResult.loser.newRating,  loserDoc.username),
  ]);

  await Promise.all([
    redis.del(`activeMatch:${winnerDoc.username}`),
    redis.del(`activeMatch:${loserDoc.username}`),
  ]);

  io.to(roomId).emit("match_finished", {
    winner: winnerId,
    ratingChanges: {
      [winnerDoc.username]: { oldRating: winnerOldRating, delta: eloResult.winner.delta, newRating: eloResult.winner.newRating },
      [loserDoc.username]:  { oldRating: loserOldRating,  delta: eloResult.loser.delta,  newRating: eloResult.loser.newRating  },
    },
  });

  return match;
}

async function submitLink(req, res) {
    const { roomId, submissionId } = req.body;
    const socketId = req.headers["x-socket-id"];

    if (!roomId || !submissionId || !socketId) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const userId = getUserBySocket(socketId);
    if (!userId) {
        return res.status(401).json({ error: "Invalid socket" });
    }

    const room = getRoom(roomId);
    if (!room) {
        return res.status(400).json({ error: "Invalid room" });
    }

    if (room.finished) {
        return res.status(200).json({ message: "Match already finished", winner: room.winner });
    }

    const isParticipant = room.participants.some(p => {
        return (typeof p === 'object' && p.username === userId) || p === userId;
    });

    if (!isParticipant) {
        return res.status(403).json({ error: "Not a participant" });
    }

    try {
        const user = await User.findOne({ username: userId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const resp = await axios.get(
            `https://codeforces.com/api/user.status?handle=${user.cfHandle}`
        );

        const submission = resp.data.result.find(
            (s) => String(s.id) === submissionId
        );

        if (!submission) {
            return res.status(404).json({ error: "Submission not found yet" });
        }

        if (submission.verdict !== "OK") {
            return res.status(400).json({ error: "Submission not accepted" });
        }

        const solvedProblemId =
            submission.problem.contestId + submission.problem.index;

        if (solvedProblemId !== room.problemId) {
            return res.status(400).json({ error: "Wrong problem submitted" });
        }

        finishRoom(roomId, userId);
        const io = req.app.get("io");
        
        try {
            await applyMatchResult(room, userId, io, roomId);
        } catch(e) {
            console.error("ELO Apply Error:", e);
        }

        return res.status(200).json({ message: "Verification successful!", winner: userId });

    } catch (err) {
        console.error("===== SUBMISSION 500 ERROR =====");
        console.error("Message:", err.message);
        console.error("Stack:", err.stack);
        console.error("Full Error Obj:", err);
        return res.status(500).json({ error: "Submission verification failed" });
    }
}

module.exports = { submitLink };
