const https = require("https");

const fetchSubmission = async (contestId, submissionId) => {
    return new Promise((resolve, reject) => {
        https.get(`https://codeforces.com/contest/${contestId}/submission/${submissionId}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        }, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(data));
        }).on("error", reject);
    });
};

fetchSubmission(4, 303788775).then(html => { // tourist's recent submission
    if(html.includes("program-source-text")) {
        console.log("SUCCESS: Can see source code");
    } else if (html.includes("Just a moment...")) {
        console.log("CLOUDFLARE BLOCK");
    } else {
        console.log("OTHER:", html.substring(0, 200));
    }
});
