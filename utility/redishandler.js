const redis = require('redis');
const HBLogger = require(process.cwd() + '/utility/logger').logger;

// create a new Redis client
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

try {
    HBLogger.info(
        `call redisClient.connect() for host ${process.env.REDIS_HOST}`
    );
    redisClient.connect();
} catch (error) {
    HBLogger.error(
        `error connecting to redis on connection method as ${error.message} for host ${process.env.REDIS_HOST}`
    );
}

// handle errors
redisClient.on('connect', (error) => {
    HBLogger.error(`connected to redis`);
});

// handle errors
redisClient.on('error', (error) => {
    HBLogger.error(
        `error connecting to redis in on error method as  ${error.message} for host ${process.env.REDIS_HOST}`
    );
});

let redishandler = () => ({});

redishandler.set = async (key, value, ttl) => {
    try {
        const result = await redisClient.set(key, value);
        return result;
    } catch (error) {
        HBLogger.error(`redishandler.set error: ${error.message}`);
        return null;
    }
};

redishandler.get = async (key) => {
    try {
        const result = await redisClient.get(key);
        return result;
    } catch (error) {
        HBLogger.error(`redishandler.get error: ${error.message}`);
        return null;
    }
};

redishandler.RPUSH = async (key, jsonString) => {
    try {
        const result = await redisClient.rPush(key, jsonString);
        return result;
    } catch (error) {
        HBLogger.error(`redishandler.RPUSH error: ${error.message}`);
        return null;
    }
};

redishandler.LRANGE = async (key, start, end) => {
    try {
        const result = await redisClient.lRange(key, start, end);
        return result;
    } catch (error) {
        HBLogger.error(`redishandler.LRAINE error: ${error.message}`);
        return null;
    }
};

redishandler.LTRIM = async (key, start, end) => {
    try {
        const result = await redisClient.lTrim(key, start, end);
        return result;
    } catch (error) {
        HBLogger.error(`redishandler.LTRIM error: ${error.message}`);
        return null;
    }
};

redishandler.DEL = async (key, start, end) => {
    try {
        const result = await redisClient.del(key);
        return result;
    } catch (error) {
        HBLogger.error(`redishandler.DEL error: ${error.message}`);
        return null;
    }
};

module.exports = {
    redishandler,
};
