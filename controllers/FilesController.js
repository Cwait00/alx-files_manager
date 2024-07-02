const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const Bull = require('bull');
const fileQueue = new Bull('fileQueue');

class FilesController {
    static async postUpload(req, res) {
        const token = req.header('X-Token');
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, type, parentId = 0, isPublic = false, data } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing name' });

        const allowedTypes = ['folder', 'file', 'image'];
        if (!type || !allowedTypes.includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }

        if (type !== 'folder' && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        if (parentId !== 0) {
            const parentFile = await dbClient.db.collection('files').findOne({ _id: new dbClient.ObjectId(parentId) });
            if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
            if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
        }

        const fileDocument = {
            userId: new dbClient.ObjectId(userId),
            name,
            type,
            isPublic,
            parentId: parentId === 0 ? 0 : new dbClient.ObjectId(parentId)
        };

        if (type === 'folder') {
            const result = await dbClient.db.collection('files').insertOne(fileDocument);
            return res.status(201).json({
                id: result.insertedId,
                userId,
                name,
                type,
                isPublic,
                parentId
            });
        } else {
            const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            const filePath = path.join(folderPath, uuidv4());
            fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

            fileDocument.localPath = filePath;

            const result = await dbClient.db.collection('files').insertOne(fileDocument);

            // Add a job to the fileQueue if the file is an image
            if (type === 'image') {
                fileQueue.add({ userId, fileId: result.insertedId });
            }

            return res.status(201).json({
                id: result.insertedId,
                userId,
                name,
                type,
                isPublic,
                parentId,
                localPath: filePath
            });
        }
    }

    // Other methods...

    static async getFile(req, res) {
        const token = req.header('X-Token');
        const fileId = req.params.id;
        const size = req.query.size;
        const file = await dbClient.db.collection('files').findOne({ _id: new dbClient.ObjectId(fileId) });

        if (!file) {
            return res.status(404).json({ error: 'Not found' });
        }

        const userId = token ? await redisClient.get(`auth_${token}`) : null;
        const isOwner = userId && file.userId.toString() === userId;

        if (!file.isPublic && !isOwner) {
            return res.status(404).json({ error: 'Not found' });
        }

        if (file.type === 'folder') {
            return res.status(400).json({ error: "A folder doesn't have content" });
        }

        let filePath = file.localPath;
        if (size && ['100', '250', '500'].includes(size)) {
            const thumbnailPath = `${filePath}_${size}`;
            if (fs.existsSync(thumbnailPath)) {
                filePath = thumbnailPath;
            } else {
                return res.status(404).json({ error: 'Not found' });
            }
        } else if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Not found' });
        }

        const mimeType = mime.lookup(file.name) || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        fs.createReadStream(filePath).pipe(res);
    }
}

module.exports = FilesController;
