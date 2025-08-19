const express = require('express');
const router = express.Router();
const { getKategori, addKategori, removeKategori } = require('../controllers/kategoriController');

router.get('/', getKategori);
router.post('/', addKategori);
router.delete('/:id', removeKategori);

module.exports = router;
