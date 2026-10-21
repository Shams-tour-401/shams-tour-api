const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

// ==========================================
// 1. ROUTES PUBLIQUES (Mobile)
// ==========================================
router.get('/', controller.getAllCircuits);

// ⚠️ LA ROUTE DE RECHERCHE DOIT ÊTRE ICI (avant /:id)
router.post('/recherche', controller.rechercherCircuits);
router.post('/recalculer', controller.recalculerPrix); 

// Maintenant les routes avec paramètres dynamiques
router.get('/:id', controller.getCircuitById);

// ==========================================
// 2. ROUTES PROTÉGÉES (Admin)
// ==========================================
router.post('/', verifierToken, verifierRole('administrateur'), controller.createCircuit);
router.put('/:id', verifierToken, verifierRole('administrateur'), controller.updateCircuit);
router.delete('/:id', verifierToken, verifierRole('administrateur'), controller.deleteCircuit);
router.post('/:id/publier', verifierToken, verifierRole('administrateur'), controller.publierCircuit);
router.post('/:id/jours/:jourId/elements', verifierToken, verifierRole('administrateur'), controller.ajouterElement);
router.delete('/elements/:elementId', verifierToken, verifierRole('administrateur'), controller.supprimerElement);

module.exports = router;