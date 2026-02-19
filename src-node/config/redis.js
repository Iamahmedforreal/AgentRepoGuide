import Redis from "ioredis";

//a Redis client with retry strategy
const redisClient = new Redis({
    host: "redis",
    port:6379,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: true,
    connectTimeout: 10000
});


Redis.on("error", (err) => {
    console.error("Redis error: ", err);
});
Redis.on("connect", () => {
    console.log("Connected to Redis");
});

export default redisClient;