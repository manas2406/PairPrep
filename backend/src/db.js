const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI environment variable is not set");
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed");
    console.error(err.message);
    process.exit(1); // stop app if DB is broken
  }
}

module.exports = connectDB;
