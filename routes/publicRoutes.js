const express = require('express');
const { renderNota, renderRiwayat } = require('../controllers/publicController');
const router = express.Router();

router.get('/nota/:notaId', renderNota);
router.get('/pelanggan/:pelangganId', renderRiwayat);

module.exports = router;
