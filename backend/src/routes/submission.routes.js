const express = require("express");
const { submitLink } = require("../controllers/submission.controller");

const router = express.Router();

router.post("/submit", submitLink);

module.exports = router;
