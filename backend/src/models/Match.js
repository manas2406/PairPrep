const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
    },

    participants: {
      type: [String],
      required: true,
    },

    problemId: {
      type: String,
      required: true,
    },

    winner: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Match", matchSchema);
