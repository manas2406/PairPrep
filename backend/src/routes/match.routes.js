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

router.post("/start", startMatch);

module.exports = router;
