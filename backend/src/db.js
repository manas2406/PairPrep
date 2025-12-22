const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed");
    console.error(err.message);
    process.exit(1); // stop app if DB is broken
  }
}

module.exports = connectDB;
