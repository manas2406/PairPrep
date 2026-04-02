require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") }); // Load backend/src/.env
const mongoose = require("mongoose");
const User = require("../models/User");
const redis = require("../redis");

async function seedLeaderboard() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is missing");

    await mongoose.connect(uri);
    console.log("MongoDB connected");

    const users = await User.find({}, "username rating");
    
    if (users.length === 0) {
      console.log("No users found in MongoDB to seed.");
    } else {
      for (const user of users) {
        await redis.zadd("leaderboard", user.rating, user.username);
      }
      console.log(`Successfully seeded ${users.length} users into the Redis leaderboard.`);
    }

  } catch (err) {
    console.error("Error seeding leaderboard:", err);
  } finally {
    await mongoose.disconnect();
    redis.quit();
    process.exit(0);
  }
}

seedLeaderboard();
