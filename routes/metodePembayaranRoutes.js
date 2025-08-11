const express = require('express');
const router = express.Router();
const { getMetode, addMetode, removeMetode } = require('../controllers/metodePembayaranController');

// GET semua metode
router.get('/', getMetode);

// POST tambah metode
router.post('/', addMetode);

// DELETE metode
router.delete('/:id', removeMetode);

module.exports = router;
