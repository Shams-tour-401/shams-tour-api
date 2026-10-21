// modules/demandes/routes.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken } = require('../../middlewares/auth');

// Routes publiques (voyageur)
router.post('/', controller.creerDemande);
router.get('/suivi/ref/:reference', controller.getDemandeByReference);
router.get('/suivi/:jeton', controller.getDemandeByJeton);

// Routes protégées (admin)
router.get('/', verifierToken, controller.getAllDemandes);
router.get('/:id', verifierToken, controller.getDemandeById);
router.put('/:id/statut', verifierToken, controller.changerStatut);
router.post('/:id/notes', verifierToken, controller.ajouterNote);

module.exports = router;