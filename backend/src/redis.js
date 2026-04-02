const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  maxRetriesPerRequest: 3,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

module.exports = redis;
