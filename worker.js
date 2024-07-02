const Bull = require('bull');
const dbClient = require('./utils/db');

const userQueue = new Bull('userQueue');
const fileQueue = new Bull('fileQueue');

userQueue.process(async (job, done) => {
    const { userId } = job.data;

    if (!userId) {
        throw new Error('Missing userId');
    }

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: new require('mongodb').ObjectID(userId) });

    if (!user) {
        throw new Error('User not found');
    }

    console.log(`Welcome ${user.email}!`);

    done();
});

fileQueue.process(async (job, done) => {
    const { userId, fileId } = job.data;

    if (!fileId) {
        throw new Error('Missing fileId');
    }

    if (!userId) {
        throw new Error('Missing userId');
    }

    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOne({ _id: new require('mongodb').ObjectID(fileId), userId });

    if (!file) {
        throw new Error('File not found');
    }

    const imageThumbnail = require('image-thumbnail');
    const fs = require('fs');
    const path = require('path');

    const sizes = [500, 250, 100];
    const filePath = path.join('/tmp/files_manager', file.localPath);

    for (const size of sizes) {
        const thumbnail = await imageThumbnail(filePath, { width: size });
        fs.writeFileSync(`${filePath}_${size}`, thumbnail);
    }

    done();
});
