const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

// Existing routes
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

// New endpoint for creating a user
router.post('/users', UsersController.postNew);

// Endpoint for uploading files
router.post('/files', FilesController.postUpload);

module.exports = router;
