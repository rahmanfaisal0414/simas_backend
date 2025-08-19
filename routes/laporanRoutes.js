const express = require('express');
const router = express.Router();
const {
  getLaporanHariIni, getLaporanSemua, getLaporanDetail, deleteLaporan,
  getLaporanStok, getLaporanTransaksi
} = require('../controllers/laporanController');

const {
  exportLaporanStokExcel, exportLaporanStokPdf,
  exportLaporanTransaksiExcel, exportLaporanTransaksiPdf
} = require('../controllers/laporanExportController');

router.get('/hari-ini', getLaporanHariIni);
router.get('/semua', getLaporanSemua);
router.get('/detail/:tipe/:notaId', getLaporanDetail);
router.delete('/:tipe/:notaId', deleteLaporan);

router.get('/stok', getLaporanStok);
router.get('/transaksi', getLaporanTransaksi);
router.get('/stok/export/excel', exportLaporanStokExcel);
router.get('/stok/export/pdf', exportLaporanStokPdf);
router.get('/transaksi/export/excel', exportLaporanTransaksiExcel);
router.get('/transaksi/export/pdf', exportLaporanTransaksiPdf);

module.exports = router;
