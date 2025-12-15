const express = require("express");
const router = express.Router();

const { startMatch } = require("../controllers/match.controller");

router.post("/start", startMatch);

module.exports = router;
