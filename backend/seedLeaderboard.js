require("dotenv").config({ path: __dirname + "/src/.env" });
const mongoose = require("mongoose");
const User = require("./src/models/User");
const redis = require("./src/redis");

if (!process.env.MONGO_URI) {
    require("dotenv").config({ path: __dirname + "/.env" });
}

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, "username rating").lean();
    
    let count = 0;
    for (const u of users) {
        if (u.username) {
            await redis.zadd("leaderboard", u.rating || 1200, u.username);
            count++;
        }
    }
    
    console.log(`Seeded ${count} users into Redis leaderboard sorted set.`);
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
