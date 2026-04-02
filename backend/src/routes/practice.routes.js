const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const sanitizeHtml = require("sanitize-html");
const axiosRetry = require("axios-retry").default;

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const Problem = require("../models/Problem");
const User = require("../models/User");
const PracticeSubmission = require("../models/PracticeSubmission");
const authMiddleware = require("../middleware/auth");

// 1. Get Practice Problems (with filtering by rating, excluding solved)
router.get("/problems", authMiddleware, async (req, res) => {
  try {
    const { minRating, maxRating, limit = 50, page = 1 } = req.query;
    const query = {};
    
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseInt(minRating);
      if (maxRating) query.rating.$lte = parseInt(maxRating);
    }

    // Filter out problems the user has already attempted
    const user = await User.findOne({ username: req.user.username }).select('attemptedProblems solvedProblems').lean();
    const excluded = new Set([
      ...(user?.attemptedProblems || []),
      ...(user?.solvedProblems || [])
    ]);
    if (excluded.size > 0) {
      query.problemId = { $nin: Array.from(excluded) };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const problems = await Problem.find(query)
      .sort({ rating: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
      
    res.json(problems);
  } catch (err) {
    console.error("Fetch Practice Problems Error:", err);
    res.status(500).json({ error: "Failed to fetch practice problems" });
  }
});

// 2. Submit solution
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { problemId, submissionId } = req.body;
    const userId = req.user.username;
    
    if (!problemId || !submissionId) {
      return res.status(400).json({ error: "Missing problemId or submissionId" });
    }

    const user = await User.findOne({ username: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch submission from Codeforces
    const cfRes = await axios.get(`https://codeforces.com/api/user.status?handle=${user.cfHandle}`);
    
    if (cfRes.data.status !== "OK") {
      return res.status(500).json({ error: "CF API error" });
    }

    const submission = cfRes.data.result.find(s => s.id.toString() === submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: "Submission not found for your handle" });
    }

    // Verify it's the correct problem
    const submittedProblemId = `${submission.problem.contestId}${submission.problem.index}`;
    if (submittedProblemId !== problemId) {
      return res.status(400).json({ error: `Submission is for problem ${submittedProblemId}, not ${problemId}` });
    }

    if (submission.verdict === "TESTING") {
      return res.status(409).json({ error: "Still testing. Try again." });
    }

    // Record submission attempt
    await PracticeSubmission.create({
      username: userId,
      problemId,
      submissionId,
      verdict: submission.verdict
    });

    // Always mark this problem as attempted (atomic, avoids VersionError)
    await User.updateOne(
      { username: userId },
      { 
        $inc: { practiceAttempts: 1 },
        $addToSet: { attemptedProblems: problemId }
      }
    );

    // Handle Correct Answer
    if (submission.verdict === "OK") {
       await User.updateOne(
         { username: userId, solvedProblems: { $ne: problemId } },
         {
           $inc: { practiceSolved: 1 },
           $addToSet: { solvedProblems: problemId }
         }
       );
       return res.json({ verdict: "OK", message: "Correct!" });
    }

    return res.json({ verdict: submission.verdict, message: `Incorrect: ${submission.verdict}` });

  } catch (err) {
    console.error("Practice Submission Error:", err);
    return res.status(500).json({ error: "Internal server error during verification" });
  }
});

// 3. User's Practice History
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const history = await PracticeSubmission.find({ username: req.user.username })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch practice history" });
  }
});

// 4. Proxy Codeforces problem statement
router.get("/problem-html", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing url parameter" });

    const cfRes = await axios.get(url, {
       headers: {
         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.4896.127",
         "Accept": "text/html,application/xhtml+xml,application/xml"
       }
    });
    
    // Parse the HTML using Cheerio to extract just the problem statement
    const $ = cheerio.load(cfRes.data);
    const problemHtml = $(".problem-statement").html();

    if (!problemHtml) {
        return res.status(404).json({ error: "Could not parse problem statement from URL" });
    }

    // Fix relative LaTeX and image URLs from Codeforces
    const formattedHtml = problemHtml
       .replace(/src="\//g, 'src="https://codeforces.com/')
       .replace(/href="\//g, 'href="https://codeforces.com/');

    const cleanHtml = sanitizeHtml(formattedHtml, { 
       allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'math', 'mi', 'mo', 'mn', 'msup', 'msub', 'mrow', 'span']),
       allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          '*': ['class', 'id'],
          'img': ['src', 'alt'],
          'a': ['href']
       }
    });

    res.json({ html: cleanHtml });
  } catch (err) {
    console.error("Fetch Problem HTML Error:", err.message);
    res.status(500).json({ error: "Failed to fetch problem HTML" });
  }
});

module.exports = router;
