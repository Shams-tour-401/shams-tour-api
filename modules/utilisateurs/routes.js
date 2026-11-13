const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

// ✅ ROUTE ACCESSIBLE À TOUT UTILISATEUR CONNECTÉ
// Placée AVANT le router.use pour ne pas être bloquée par verifierRole('administrateur')
router.put('/mot-de-passe', verifierToken, controller.changerMotDePasse);

// 🔒 ROUTES RÉSERVÉES À L'ADMINISTRATEUR
router.use(verifierToken, verifierRole('administrateur'));

router.get('/', controller.getAllUtilisateurs);
router.post('/', controller.createUtilisateur);
router.put('/:id/statut', controller.changerStatutUtilisateur);

module.exports = router;
