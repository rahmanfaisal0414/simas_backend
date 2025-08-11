const express = require('express');
const router = express.Router();
const {
  getLaporanHariIni,
  getLaporanSemua,
  getLaporanDetail,
  deleteLaporan,
  getLaporanStok,
  getLaporanTransaksi
} = require('../controllers/laporanController');

router.get('/hari-ini', getLaporanHariIni);
router.get('/semua', getLaporanSemua);
router.get('/detail/:tipe/:notaId', getLaporanDetail);
router.delete('/:tipe/:notaId', deleteLaporan);
router.get('/stok', getLaporanStok);
router.get('/transaksi', getLaporanTransaksi);

module.exports = router;
