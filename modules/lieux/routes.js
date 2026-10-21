const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

router.get('/', controller.getAllLieux);
router.get('/:id', controller.getLieuById);
router.post('/', verifierToken, verifierRole('administrateur'), controller.createLieu);
router.put('/:id', verifierToken, verifierRole('administrateur'), controller.updateLieu);

module.exports = router;