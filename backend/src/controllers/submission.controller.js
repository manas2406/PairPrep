const axios = require("axios");
const { getRoom, finishRoom } = require("../store/rooms");
const { getUser } = require("../store/users");

async function findSubmissionWithRetry(cfHandle, submissionId) {
    const delays = [2000, 4000, 6000];

    for (const delay of delays) {
        const resp = await axios.get(
            `https://codeforces.com/api/user.status?handle=${cfHandle}`
        );

        const found = resp.data.result.find(
            (s) => String(s.id) === submissionId
        );

        if (found) return found;

        await new Promise((r) => setTimeout(r, delay));
    }

    return null;
}

async function submitLink(req, res) {
    const { roomId, submissionUrl, userId } = req.body;
    const io = req.app.get("io");

    const room = getRoom(roomId);
    if (!room || room.finished) {
        return res.status(400).json({ error: "Invalid room" });
    }

    if (!room.participants.includes(userId)) {
        return res.status(403).json({ error: "Not a participant" });
    }

    const match = submissionUrl.match(/\/submission\/(\d+)/);
    if (!match) {
        return res.status(400).json({ error: "Invalid submission URL" });
    }

    const submissionId = match[1];
    const user = getUser(userId);

    try {
        const submission = await findSubmissionWithRetry(
            user.cfHandle,
            submissionId
        );

        if (!submission) {
            return res.status(404).json({
                error: "Submission not found yet. Try again in a few seconds.",
            });
        }

        if (submission.verdict !== "OK") {
            return res.status(400).json({ error: "Submission not accepted" });
        }

        const solvedId =
            submission.problem.contestId + submission.problem.index;

        if (solvedId !== room.problemId) {
            return res.status(400).json({ error: "Wrong problem" });
        }

        // ✅ Update solved history
        user.solvedProblems.add(solvedId);

        finishRoom(roomId, userId);

        room.participants.forEach((uid) => {
            const sid = getSocketByUser(uid);
            if (sid) {
                io.to(sid).emit("match_finished", { winner: userId });
            }
        });

        return res.json({ status: "accepted", winner: userId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Verification failed" });
    }
}

module.exports = { submitLink };
