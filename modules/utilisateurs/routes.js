const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

router.use(verifierToken, verifierRole('administrateur')); // Réservé admin

router.get('/', controller.getAllUtilisateurs);
router.post('/', controller.createUtilisateur);
router.put('/:id/statut', controller.changerStatutUtilisateur);

module.exports = router;