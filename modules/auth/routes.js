const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken } = require('../../middlewares/auth');


// Routes publiques
router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.put('/profil', verifierToken, controller.updateProfil);
router.put('/change-password', verifierToken, controller.changePassword);

// Route protégée
router.get('/me', verifierToken, controller.getMe);

module.exports = router;