const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

router.get('/', controller.getAllDestinations);
router.get('/:id', controller.getDestinationById);
router.post('/', verifierToken, verifierRole('administrateur'), controller.createDestination);
router.put('/:id', verifierToken, verifierRole('administrateur'), controller.updateDestination);

module.exports = router;