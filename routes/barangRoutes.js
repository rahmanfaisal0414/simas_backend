const express = require('express');
const router = express.Router();
const {
  getBarangList,
  getBarangDetail,
  addBarang,
  editBarang,
  removeBarang,
  getBarangRiwayat,
  getBarangRiwayatDetail,
  removeBarangRiwayat
} = require('../controllers/barangController');
const multer = require('multer');
const path = require('path');

// =============================
// Konfigurasi upload foto
// =============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/barang');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// =============================
// Endpoint CRUD Barang
// =============================
router.get('/', getBarangList);
router.get('/:id', getBarangDetail);
router.post('/', upload.single('foto'), addBarang);
router.put('/:id', upload.single('foto'), editBarang);
router.delete('/:id', removeBarang);
router.get('/:id/riwayat', getBarangRiwayat);
router.get('/riwayat/:tipe/:notaId/:barangId', getBarangRiwayatDetail);
router.delete('/riwayat/:tipe/:notaId/:barangId', removeBarangRiwayat);

module.exports = router;
