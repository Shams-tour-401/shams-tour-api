const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

router.get('/', controller.getAllTrajets);
router.post('/', verifierToken, verifierRole('administrateur'), controller.createTrajet);
router.put('/:id', verifierToken, verifierRole('administrateur'), controller.updateTrajet);
router.delete('/:id', verifierToken, verifierRole('administrateur'), controller.deleteTrajet);

module.exports = router;