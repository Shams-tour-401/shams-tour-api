// modules/activites/routes.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

// Routes publiques
router.get('/', controller.getAllActivites);
router.get('/:id', controller.getActiviteById);

// Routes protégées (administrateur uniquement)
router.post('/', verifierToken, verifierRole('administrateur'), controller.createActivite);
router.put('/:id', verifierToken, verifierRole('administrateur'), controller.updateActivite);
router.delete('/:id', verifierToken, verifierRole('administrateur'), controller.desactiverActivite);

module.exports = router;