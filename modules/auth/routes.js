// modules/auth/routes.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken } = require('../../middlewares/auth');

router.post('/login', controller.login);
router.get('/me', verifierToken, controller.getMe);

module.exports = router;