const express = require("express");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/**
 * GET /auth/me
 * Returns the currently logged-in user
 */
router.get("/me", authMiddleware, (req, res) => {
  const user = req.user;

  res.json({
    username: user.username,
    cfHandle: user.cfHandle,
    matchesPlayed: user.matchesPlayed,
    matchesWon: user.matchesWon,
    matchesLost: user.matchesLost,
    solvedCount: user.solvedProblems.length,
  });
});

module.exports = router;
