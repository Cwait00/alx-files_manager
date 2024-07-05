const { v4: uuidv4 } = require('uuid');
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const { Base64 } = require('js-base64'); // Ensure this is correctly imported

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization') || '';
    const token = authHeader.split(' ')[1] || '';
    const credentials = Base64.decode(token).split(':');
    const [email, password] = credentials;

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hashedPassword = sha1(password);
    const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authToken = uuidv4();
    const key = `auth_${authToken}`;
    await redisClient.set(key, user._id.toString(), 86400);

    return res.status(200).json({ token: authToken });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;

    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(key);
    return res.status(204).send();
  }
}

module.exports = AuthController;
