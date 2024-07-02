const Bull = require('bull');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { v4: uuidv4 } = require('uuid');
const sha1 = require('sha1');

const userQueue = new Bull('userQueue');

class UsersController {
    static async postNew(req, res) {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }

        if (!password) {
            return res.status(400).json({ error: 'Missing password' });
        }

        const usersCollection = dbClient.db.collection('users');
        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'Already exist' });
        }

        const hashedPassword = sha1(password);
        const user = {
            email,
            password: hashedPassword,
        };

        const result = await usersCollection.insertOne(user);
        const userId = result.insertedId;

        userQueue.add({ userId });

        return res.status(201).json({
            id: userId,
            email,
        });
    }
}

module.exports = UsersController;
