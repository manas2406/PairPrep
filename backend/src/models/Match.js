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

  startedAt: Date,
  endedAt: Date,
  durationSeconds: Number,
});

module.exports = mongoose.model("Match", matchSchema);
