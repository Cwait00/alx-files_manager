const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');

class AuthController {
    static async getConnect(req, res) {
        const authHeader = req.header('Authorization');
        const b64auth = (authHeader || '').split(' ')[1] || '';
        const [email, password] = Buffer.from(b64auth, 'base64').toString().split(':');

        if (!email || !password) return res.status(401).json({ error: 'Unauthorized' });

        const user = await dbClient.db.collection('users').findOne({ email, password: sha1(password) });
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const token = uuidv4();
        await redisClient.set(`auth_${token}`, user._id.toString(), 86400); // 24 hours

        res.status(200).json({ token });
    }

    static async getDisconnect(req, res) {
        const token = req.header('X-Token');
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        await redisClient.del(`auth_${token}`);
        res.status(204).send();
    }
}

module.exports = AuthController;
