// modules/propositions/routes.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken } = require('../../middlewares/auth');

// Accessible aux 2 rôles (admin + conseiller)
router.get('/:id/propositions', verifierToken, controller.getPropositionsByDemande);
router.post('/:id/propositions', verifierToken, controller.creerProposition);
router.post('/:id/propositions/:propId/accord', verifierToken, controller.enregistrerAccord);
router.put('/:id/propositions/:propId/elements/:elementId', verifierToken, controller.verifierLigneProposition);

module.exports = router;