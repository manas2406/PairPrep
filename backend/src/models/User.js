const mongoose = require("mongoose");

const ratingHistorySchema = new mongoose.Schema({
  rating:    { type: Number, required: true },
  delta:     { type: Number, required: true },
  matchId:   { type: String, required: true },
  opponent:  { type: String, required: true },
  result:    { type: String, enum: ["win", "loss"], required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },

    cfHandle: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },
    matchesPlayed: {
      type: Number,
      default: 0,
    },
    matchesWon: {
      type: Number,
      default: 0,
    },
    matchesLost: {
      type: Number,
      default: 0,
    },
    // --- RATING (NEW) ---
    rating: {
      type: Number,
      default: 1200,
    },
    peakRating: {
      type: Number,
      default: 1200,
    },
    ratingHistory: {
      type: [ratingHistorySchema],
      default: [],
    },
    // --- PRACTICE STATS (NEW) ---
    practiceAttempts: {
      type: Number,
      default: 0,
    },
    practiceSolved: {
      type: Number,
      default: 0,
    },
    // --- SOLVED PROBLEMS (EXISTING) ---
    solvedProblems: {
      type: [String],
      default: [],
    },
    // --- ATTEMPTED PROBLEMS (for filtering) ---
    attemptedProblems: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ rating: -1 });

module.exports = mongoose.model("User", userSchema);
