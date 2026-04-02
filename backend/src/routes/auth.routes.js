const express = require("express");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/auth");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const redis = require("../redis");

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many verification requests, please try again later." }
});

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

router.post("/verify/start", verifyLimiter, async (req, res) => {
  const { cfHandle } = req.body;
  if (!cfHandle) return res.status(400).json({ error: "Handle required" });
  
  try {
    const cfRes = await fetch(`https://codeforces.com/api/user.info?handles=${cfHandle}`);
    const data = await cfRes.json();
    if (data.status !== "OK") {
      return res.status(404).json({ error: "Codeforces handle not found" });
    }
    
    // Pick a random problem for the user to submit a Compilation Error to
    const problems = ["4A", "71A", "158A", "231A", "112A", "282A", "266A", "339A", "281A", "263A", "1742A", "1915A", "1800A"];
    const problemId = problems[Math.floor(Math.random() * problems.length)];
    
    // Store in redis for 3 minutes (180s)
    await redis.setex(`verify:${cfHandle}`, 180, JSON.stringify({ problemId, timestamp: Date.now() }));
    
    return res.json({ problemId, expiresIn: 180 });
  } catch (err) {
    return res.status(500).json({ error: "Verification failed" });
  }
});

router.post("/verify/confirm", verifyLimiter, async (req, res) => {
  const { cfHandle } = req.body;
  
  try {
    const verifyDataStr = await redis.get(`verify:${cfHandle}`);
    if (!verifyDataStr) return res.status(400).json({ error: "Verification session expired. Please request a new problem." });
    const { problemId, timestamp } = JSON.parse(verifyDataStr);
    
    // Fetch last 5 submissions for user
    const cfRes = await fetch(`https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=5`);
    const data = await cfRes.json();
    if (data.status !== "OK") return res.status(404).json({ error: "Could not fetch Codeforces submissions" });
    
    // Check if there is a COMPILATION_ERROR submission on the specific problemId submitted AFTER the verification was started
    const submissions = data.result;
    const timeLimitSecs = timestamp / 1000 - 30; // Allow slight clock drift

    const isValid = submissions.find(sub => {
        const subProblemId = `${sub.problem.contestId}${sub.problem.index}`;
        return subProblemId === problemId && 
               sub.verdict === "COMPILATION_ERROR" && 
               sub.creationTimeSeconds >= timeLimitSecs;
    });
    
    if (!isValid) {
        return res.status(401).json({ error: `Could not find a recent Compilation Error on problem ${problemId}. Try submitting again and wait 5 seconds.` });
    }
    
    // verification success
    const preVerifiedToken = jwt.sign(
        { cfHandle, verified: true }, 
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
    
    await redis.del(`verify:${cfHandle}`);
    
    return res.json({ preVerifiedToken });
  } catch (err) {
     console.error(err);
     return res.status(500).json({ error: "Verification confirmation failed" });
  }
});

router.post("/signup", async (req, res) => {
  const { userId, cfHandle, password, preVerifiedToken } = req.body;

  if (!userId || !cfHandle || !password || !preVerifiedToken) {
    return res.status(400).json({ error: "All fields required (including verification token)" });
  }

  try {
    try {
      const decoded = jwt.verify(preVerifiedToken, process.env.JWT_SECRET);
      if (!decoded.verified || decoded.cfHandle !== cfHandle) {
        throw new Error("Invalid");
      }
    } catch {
      return res.status(401).json({ error: "Invalid or expired verification token" });
    }
    const existingUser = await User.findOne({ username: userId });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: userId,
      cfHandle,
      password: hashedPassword,
    });

    const token = generateToken(user.username);

    return res.json({
      token,
      user: {
        username: user.username,
        cfHandle: user.cfHandle,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.username);

    return res.json({
      token,
      user: {
        username: user.username,
        cfHandle: user.cfHandle,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
