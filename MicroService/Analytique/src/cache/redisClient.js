const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

exports.getCached = async (key, computeFn, ttl = 3600) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const result = await computeFn();
  redis.set(key, JSON.stringify(result), "EX", ttl);
  return result;
};