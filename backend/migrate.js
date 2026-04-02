require("dotenv").config({ path: __dirname + "/src/.env" });
const mongoose = require("mongoose");
const User = require("./src/models/User");

// Fallback to top-level .env if needed
if (!process.env.MONGO_URI) {
    require("dotenv").config({ path: __dirname + "/.env" });
}

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.updateMany(
    { rating: { $exists: false } },
    { $set: { rating: 1200, peakRating: 1200 } }
  );
  console.log("Migration complete:", result);
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
