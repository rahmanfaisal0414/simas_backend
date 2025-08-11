const express = require('express');
const router = express.Router();
const { getPelanggan, addPelanggan, removePelanggan, editPelanggan } = require('../controllers/pelangganController');

router.get('/', getPelanggan);
router.post('/', addPelanggan);
router.delete('/:id', removePelanggan);
router.put('/:id', editPelanggan);

module.exports = router;
