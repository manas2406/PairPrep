const express = require("express");
const router = express.Router();
const redis = require("../redis");

// GET /leaderboard (fetch top 100)
router.get("/", async (req, res) => {
  try {
    const topUsers = await redis.zrevrange("leaderboard", 0, 99, "WITHSCORES");
    
    const leaderboard = [];
    for (let i = 0; i < topUsers.length; i += 2) {
      leaderboard.push({
        rank: Math.floor(i / 2) + 1,
        username: topUsers[i],
        rating: parseInt(topUsers[i + 1], 10),
      });
    }

    res.json(leaderboard);
  } catch (err) {
    console.error("Leaderboard Error:", err);
    res.status(500).json({ error: "Could not fetch leaderboard" });
  }
});

module.exports = router;
