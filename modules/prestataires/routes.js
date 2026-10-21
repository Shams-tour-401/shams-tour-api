const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

router.get('/', controller.getAllPrestataires);
router.get('/:id', controller.getPrestataireById);
router.post('/', verifierToken, verifierRole('administrateur'), controller.createPrestataire);
router.put('/:id', verifierToken, verifierRole('administrateur'), controller.updatePrestataire);
router.delete('/:id', verifierToken, verifierRole('administrateur'), controller.desactiverPrestataire);

module.exports = router;