const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
    constructor() {
        this.client = redis.createClient();
        this.client.on('error', (err) => console.error('Redis client not connected to the server:', err));
        this.client.on('connect', () => console.log('Redis client connected to the server'));

        this.get = promisify(this.client.get).bind(this.client);
        this.set = promisify(this.client.set).bind(this.client);
        this.del = promisify(this.client.del).bind(this.client);
    }

    isAlive() {
        return this.client.connected;
    }

    async set(key, value, duration) {
        await this.client.set(key, value, 'EX', duration);
    }

    async get(key) {
        const value = await this.client.get(key);
        return value;
    }

    async del(key) {
        await this.client.del(key);
    }
}

const redisClient = new RedisClient();
module.exports = redisClient;
