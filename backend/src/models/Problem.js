const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  problemId: { type: String, required: true, unique: true }, // e.g. "158A"
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  url: { type: String, required: true },
  tags: { type: [String], default: [] },
  contestId: { type: Number },
  index: { type: String }
});

problemSchema.index({ rating: 1 });
problemSchema.index({ tags: 1 });

module.exports = mongoose.model("Problem", problemSchema);
