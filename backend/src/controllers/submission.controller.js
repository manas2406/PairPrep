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

    const room = getRoom(roomId);
    if (!room || room.finished) {
        return res.status(400).json({ error: "Invalid room" });
    }

    if (!room.participants.includes(userId)) {
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
        const winner = await User.findOne({ username: userId });
        const room = getRoom(roomId);

        for (const participant of room.participants) {
            const user = await User.findOne({ username: participant });
            user.matchesPlayed += 1;

            if (participant === userId) {
                user.matchesWon += 1;
            } else {
                user.matchesLost += 1;
            }

            await user.save();
        }


        // Persist match result
        const Match = require("../models/Match");

        const endTime = Date.now();
        const durationSeconds = Math.floor(
            (endTime - room.startedAt) / 1000
        );

        const loser = room.participants.find(u => u !== userId);

        await Match.create({
            roomId,
            players: room.participants,
            winner,
            loser,
            problem: room.problem,
            startedAt: new Date(room.startedAt),
            endedAt: new Date(endTime),
            durationSeconds,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Submission verification failed" });
    }
}

module.exports = { submitLink };
