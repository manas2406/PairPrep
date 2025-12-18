const axios = require("axios");
const { getRoom, finishRoom } = require("../store/rooms");
const { getUser } = require("../store/users");
const { getSocketByUser } = require("../store/sockets");
const { getUserBySocket } = require("../store/sockets");


/*
  Contract:
  Frontend sends ONLY submissionId (number)
*/

async function submitLink(req, res) {
    console.log("🔵 BACKEND /submission/submit body:", req.body);
    const socketId = req.headers["x-socket-id"];
    const userId = getUserBySocket(socketId);

    if (!userId) {
        return res.status(401).json({ error: "Invalid socket" });
    }
    const { roomId, submissionId } = req.body;
    const io = req.app.get("io");

    // ----------- Validation -----------

    if (!roomId || !submissionId || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (!submissionId || !/^\d+$/.test(submissionId)) {
        return res.status(400).json({ error: "Invalid submission ID" });
    }

    const room = getRoom(roomId);
    if (!room || room.finished) {
        return res.status(400).json({ error: "Invalid room" });
    }

    if (!room.participants.includes(userId)) {
        return res.status(403).json({ error: "Not a participant" });
    }

    const user = getUser(userId);
    if (!user || !user.cfHandle) {
        return res.status(400).json({ error: "Invalid user" });
    }

    // ----------- Codeforces Verification -----------
    console.log("🔵 Verifying submissionId:", submissionId, "for user:", userId);
    try {
        const resp = await axios.get(
            `https://codeforces.com/api/user.status?handle=${user.cfHandle}`
        );

        const submission = resp.data.result.find(
            (s) => String(s.id) === String(submissionId)
        );
        console.log("🔵 Found submission:", submission?.id, submission?.verdict);
        if (!submission) {
            return res.status(404).json({ error: "Submission not found" });
        }

        if (submission.verdict === "TESTING" || submission.verdict === "RUNNING") {
            return res.status(409).json({
                error: "Submission is still being judged. Please try again in a few seconds.",
            });
        }

        if (submission.verdict !== "OK") {
            return res.status(400).json({
                error: `Submission verdict is ${submission.verdict}`,
            });
        }

        const solvedProblemId =
            submission.problem.contestId + submission.problem.index;

        if (solvedProblemId !== room.problemId) {
            return res.status(400).json({ error: "Wrong problem submitted" });
        }

        // ----------- Mark room finished -----------

        finishRoom(roomId, userId);

        // Update solved set (important for future exclusion)
        user.solvedProblems.add(solvedProblemId);

        // ----------- Notify both users (SOCKET = SOURCE OF TRUTH) -----------
        console.log("🏁 Declaring winner:", userId, "for room:", roomId);
        room.participants.forEach((uid) => {
            const socketId = getSocketByUser(uid);
            if (socketId) {
                io.to(socketId).emit("match_finished", {
                    winner: userId,
                });
            }
        });

        return res.json({
            status: "accepted",
            winner: userId,
        });
    } catch (err) {
        console.error("Submission verification failed:", err);
        return res.status(500).json({ error: "Verification failed" });
    }
}

module.exports = {
    submitLink,
};
