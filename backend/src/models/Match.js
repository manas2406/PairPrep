const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  roomId: String,

  players: [String], // [u1, u2]

  winner: String,
  loser: String,

  problem: {
    id: String,
    name: String,
    rating: Number,
    url: String,
  },
  // --- RATING DELTAS (NEW) ---
  ratingChanges: [{
    username: String,
    before:   Number,
    after:    Number,
    delta:    Number,
  }],

  startedAt: Date,
  endedAt: Date,
  durationSeconds: Number,
  
  // 'completed' | 'abandoned' | 'timeout'
  status: { type: String, default: "completed" },
});

matchSchema.index({ players: 1, startedAt: -1 });

module.exports = mongoose.model("Match", matchSchema);
