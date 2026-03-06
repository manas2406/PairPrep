const fs = require("fs");
const axios = require("axios");
const path = require("path");

async function fetchProblems() {
    try {
        console.log("Fetching problems from Codeforces API...");
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
        for (const p of problems) {
            if (p.rating && targetRatings.includes(p.rating)) {
                if (problemsByRating[p.rating].length < 100) {
                    // Make sure it's a standard problem (no weird tags or wild variations if desired, but we'll accept any valid id)
                    problemsByRating[p.rating].push({
                        id: `${p.contestId}${p.index}`,
                        name: p.name,
                        rating: p.rating,
                        url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`
                    });
                }
            }
        }

        // Flatten the dict into one master array
        const finalProblemSet = [];
        targetRatings.forEach(r => {
            finalProblemSet.push(...problemsByRating[r]);
            console.log(`Collected ${problemsByRating[r].length} problems for rating ${r}`);
        });

        const outputPath = path.join(__dirname, "../data/codeforces_problems.json");
        fs.writeFileSync(outputPath, JSON.stringify(finalProblemSet, null, 2));

        console.log(`Successfully wrote ${finalProblemSet.length} total problems to ${outputPath}`);
    } catch (err) {
        console.error("Failed to fetch problems:", err.message);
    }
}

fetchProblems();
