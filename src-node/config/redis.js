import Redis from "ioredis";
//a Redis client with retry strategy
const redis = new Redis({
    host: "127.0.0.1",
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


redis.on("error", (err) => {
    console.error("Redis error: ", err);
});
redis.on("connect", () => {
    console.log("Connected to Redis");
});

export default redis;