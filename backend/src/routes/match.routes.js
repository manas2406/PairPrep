const express = require("express");
const router = express.Router();

const { startMatch } = require("../controllers/match.controller");
const auth = require("../middleware/auth");
const Match = require("../models/Match");

router.get("/history", auth, async (req, res) => {
    const userId = req.user.username;

    const matches = await Match.find({
        players: userId,
    }).sort({ startedAt: -1 });

    res.json(matches);
});

router.get("/current", auth, async (req, res) => {
    const userId = req.user.username;
    const redis = require("../redis");
    const { getRoom } = require("../store/rooms");
    
    try {
        const activeRoomId = await redis.get(`activeMatch:${userId}`);
        if (!activeRoomId) {
            return res.json({ status: "none", message: "No active match" });
        }
        
        const room = getRoom(activeRoomId);
        if (!room || room.finished) {
             await redis.del(`activeMatch:${userId}`);
             return res.json({ status: "none", message: "Match manually completed or wiped" });
        }
        
        return res.json({
            status: "active",
            roomId: activeRoomId,
            problem: room.problem
        });
    } catch (err) {
        return res.status(500).json({ error: "Failed to fetch current match state" });
    }
});

router.post("/start", auth, startMatch);

module.exports = router;
