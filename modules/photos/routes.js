const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

// Public (pour le mobile)
router.get('/:activiteId', controller.getPhotosByActivite);

// Admin
router.post('/:activiteId', verifierToken, verifierRole('administrateur'), controller.uploadPhotos);
router.delete('/:photoId', verifierToken, verifierRole('administrateur'), controller.deletePhoto);

module.exports = router;