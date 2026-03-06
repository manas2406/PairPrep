const mongoose = require("mongoose");

async function connectDB() {
  try {
    console.log(process.env.MONGO_URI);
    await mongoose.connect("mongodb+srv://pairprep_user:aJL9zvJ6irOMviyE@cluster0.2xeltkc.mongodb.net/pairprep?appName=Cluster0");
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed");
    console.error(err.message);
    process.exit(1); // stop app if DB is broken
  }
}

module.exports = connectDB;
