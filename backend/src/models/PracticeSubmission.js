const mongoose = require("mongoose");

const practiceSubmissionSchema = new mongoose.Schema({
  username: { type: String, required: true },
  problemId: { type: String, required: true },
  submissionId: { type: String, required: true },
  verdict: { type: String, required: true }, // e.g., "OK", "WRONG_ANSWER"
  timestamp: { type: Date, default: Date.now }
});

practiceSubmissionSchema.index({ username: 1, problemId: 1 });

module.exports = mongoose.model("PracticeSubmission", practiceSubmissionSchema);
