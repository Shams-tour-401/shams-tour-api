const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

// ✅ ROUTE ACCESSIBLE À TOUT UTILISATEUR CONNECTÉ (admin, conseiller, client)
// On la place AVANT le router.use pour qu'elle ne soit pas bloquée par verifierRole('administrateur')
router.put('/mot-de-passe', verifierToken, controller.changerMotDePasse);

// 🔒 ROUTES RÉSERVÉES À L'ADMINISTRATEUR
// À partir d'ici, toutes les routes nécessitent le rôle administrateur
router.use(verifierToken, verifierRole('administrateur'));

router.get('/', controller.getAllUtilisateurs);
router.post('/', controller.createUtilisateur);
router.put('/:id/statut', controller.changerStatutUtilisateur);

module.exports = router;
