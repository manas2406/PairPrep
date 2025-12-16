const axios = require("axios");
const { getRoom, submitSolution, finishRoom } = require("../store/rooms");
const { getUser } = require("../store/users");

async function submitLink(req, res) {
    const { roomId, submissionUrl, userId } = req.body;

    const room = getRoom(roomId);
    if (!room || room.finished) {
        return res.status(400).json({ error: "Invalid room" });
    }

    if (!room.participants.includes(userId)) {
        return res.status(403).json({ error: "Not a participant" });
    }

    // Extract submission ID from URL
    const match = submissionUrl.match(/\/submission\/(\d+)/);
    if (!match) {
        return res.status(400).json({ error: "Invalid submission URL" });
    }

    const submissionId = match[1];
    const user = getUser(userId);

    try {
        const url = `https://codeforces.com/api/user.status?handle=${user.cfHandle}`;
        const resp = await axios.get(url);

        async function findSubmissionWithRetry(cfHandle, submissionId, retries = 3) {
            for (let i = 0; i < retries; i++) {
                const resp = await axios.get(
                    `https://codeforces.com/api/user.status?handle=${cfHandle}`
                );

                const found = resp.data.result.find(
                    (s) => String(s.id) === submissionId
                );

                if (found) return found;

                // wait 2 seconds before retry
                await new Promise((res) => setTimeout(res, 2000));
            }
            return null;
        }
        const submission = await findSubmissionWithRetry(
            user.cfHandle,
            submissionId
        );

        if (!submission) {
            return res.status(404).json({ error: "Submission not found" });
        }

        if (submission.verdict !== "OK") {
            return res.status(400).json({ error: "Submission not accepted" });
        }

        const solvedProblemId =
            submission.problem.contestId + submission.problem.index;

        if (solvedProblemId !== room.problemId) {
            return res.status(400).json({ error: "Wrong problem" });
        }

        submitSolution(roomId, userId, submissionUrl);
        finishRoom(roomId, userId);

        const io = req.app.get("io");

        io.to(roomId).emit("match_finished", {
            winner: userId,
        });

        return res.json({
            status: "accepted",
            winner: userId,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Verification failed" });
    }
}

module.exports = {
    submitLink,
};
