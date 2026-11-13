const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

// ✅ ROUTE PUBLIQUE (pour tout utilisateur connecté) : Changer son propre mot de passe
// On la met AVANT le "router.use" pour que les conseillers/clients puissent aussi le faire.
router.put('/mot-de-passe', verifierToken, controller.changerMotDePasse);

// 🔒 ROUTES RÉSERVÉES À L'ADMINISTRATEUR
// À partir d'ici, toutes les routes nécessitent le rôle administrateur
router.use(verifierToken, verifierRole('administrateur')); 

router.get('/', controller.getAllUtilisateurs);
router.post('/', controller.createUtilisateur);
router.put('/:id/statut', controller.changerStatutUtilisateur);

module.exports = router;
