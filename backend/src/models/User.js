const mongoose = require("mongoose");

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

    solvedProblems: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
