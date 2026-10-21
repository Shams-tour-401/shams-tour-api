// modules/alertes/routes.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken } = require('../../middlewares/auth');

router.get('/', verifierToken, controller.getAllAlertes);

module.exports = router;