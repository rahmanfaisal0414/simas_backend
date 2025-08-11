const express = require('express');
const router = express.Router();
const {
  addStokMasuk,
  getStokMasukList,
  getStokMasukDetail,
  deleteStokMasuk
} = require('../controllers/stokMasukController');

router.post('/', addStokMasuk);
router.get('/', getStokMasukList);
router.get('/:id', getStokMasukDetail);
router.delete('/:id', deleteStokMasuk);

module.exports = router;
