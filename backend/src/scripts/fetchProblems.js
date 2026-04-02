require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express"); // not needed
const axios = require("axios");
const mongoose = require("mongoose");
const Problem = require("../models/Problem");

if (!process.env.MONGO_URI) {
    require("dotenv").config({ path: __dirname + "/../../.env" });
}

async function fetchProblems() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB. Fetching problems from Codeforces API...");
        const response = await axios.get("https://codeforces.com/api/problemset.problems");
        if (response.data.status !== "OK") {
            throw new Error("Codeforces API failed: " + response.data.comment);
        }

        const problems = response.data.result.problems;

        // Strategy: We want exactly 100 problems per rating tier from 800 to 1600 (inclusive)
        const targetRatings = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600];
        const problemsByRating = {};
        targetRatings.forEach(r => problemsByRating[r] = []);

        // Iterate and collect
        let count = 0;
        for (const p of problems) {
            if (p.rating && targetRatings.includes(p.rating)) {
                if (problemsByRating[p.rating].length < 150) { // Bumped to 150 for more variety
                    const problemId = `${p.contestId}${p.index}`;
                    
                    await Problem.findOneAndUpdate(
                        { problemId },
                        {
                            problemId,
                            name: p.name,
                            rating: p.rating,
                            url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
                            tags: p.tags || [],
                            contestId: p.contestId,
                            index: p.index
                        },
                        { upsert: true, new: true }
                    );
                    problemsByRating[p.rating].push(problemId);
                    count++;
                }
            }
        }

        console.log(`Successfully upserted ${count} total problems to MongoDB.`);
        process.exit(0);
    } catch (err) {
        console.error("Failed to fetch problems:", err.message);
        process.exit(1);
    }
}

fetchProblems();
