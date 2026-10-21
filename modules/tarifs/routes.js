const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifierToken, verifierRole } = require('../../middlewares/auth');

router.get('/', controller.getAllTarifs);
router.get('/activite/:activiteId', controller.getTarifsByActivite);

router.post('/', verifierToken, verifierRole('administrateur'), controller.createTarif);
router.put('/:id', verifierToken, verifierRole('administrateur'), controller.updateTarif);
router.delete('/:id', verifierToken, verifierRole('administrateur'), controller.deleteTarif);
router.put('/:id/verifier', verifierToken, verifierRole('administrateur'), controller.verifierTarif);

module.exports = router;