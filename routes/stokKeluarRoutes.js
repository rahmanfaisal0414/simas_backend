const express = require('express');
const router = express.Router();
const {
  addStokKeluar,
  getStokKeluarList,
  getStokKeluarDetail,
  deleteStokKeluar
} = require('../controllers/stokKeluarController');

router.post('/', addStokKeluar);
router.get('/', getStokKeluarList);
router.get('/:id', getStokKeluarDetail);
router.delete('/:id', deleteStokKeluar);

module.exports = router;
