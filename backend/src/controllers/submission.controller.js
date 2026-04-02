const axios = require("axios");
const Match = require("../models/Match");
const User = require("../models/User");
const { getRoom, finishRoom } = require("../store/rooms");
const { getUserBySocket } = require("../store/sockets");

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

    console.log(`[submitLink] Verify socket: ${socketId} resolved to userId: ${userId}`);

    const room = getRoom(roomId);
    if (!room) {
        return res.status(400).json({ error: "Invalid room" });
    }

    if (room.finished) {
        return res.status(200).json({ message: "Match already finished", winner: room.winner });
    }

    console.log(`[submitLink] Room participants:`, room.participants, `userId:`, userId);

    // Check participant validity
    const isParticipant = room.participants.some(p => {
        // Handle case where p might be an object instead of string
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

        // Fetch submissions from Codeforces
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

        // Finish room
        finishRoom(roomId, userId);

        const roomData = getRoom(roomId);

        for (const participant of roomData.participants) {
            const userObj = await User.findOne({ username: participant });
            if (userObj) {
                userObj.matchesPlayed += 1;

                if (participant === userId) {
                    userObj.matchesWon += 1;
                    userObj.solvedProblems = userObj.solvedProblems || [];
                    if (!userObj.solvedProblems.includes(roomData.problemId)) {
                        userObj.solvedProblems.push(roomData.problemId);
                    }
                } else {
                    userObj.matchesLost += 1;
                }

                await userObj.save();
            }
        }

        // Persist match result

        const endTime = Date.now();
        const durationSeconds = Math.floor(
            (endTime - roomData.startedAt) / 1000
        );

        const loserUsername = roomData.participants.find(u => u !== userId) || "Unknown";

        await Match.create({
            roomId,
            players: roomData.participants,
            winner: userId,
            loser: loserUsername,
            problem: roomData.problem,
            startedAt: new Date(roomData.startedAt),
            endedAt: new Date(endTime),
            durationSeconds,
        });

        // Tell both players the match is over!
        const io = req.app.get("io");
        io.to(roomId).emit("match_finished", { winner: userId });

        // Resolve the "Verifying..." HTTP spinner
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
