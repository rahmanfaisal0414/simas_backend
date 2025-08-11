const {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  getRiwayatBarang,
  getRiwayatDetail,
  deleteRiwayat
} = require('../models/barangModel'); // ✅ ini sudah benar, jadi langsung pakai getRiwayatDetail

const path = require('path');

// =============================
// GET daftar barang
// =============================
const getBarangList = async (req, res) => {
  try {
    const barang = await getAllBarang();
    res.json(barang);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =============================
// GET detail barang
// =============================
const getBarangDetail = async (req, res) => {
  try {
    const barang = await getBarangById(req.params.id);
    if (!barang) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    res.json(barang);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =============================
// POST tambah barang
// =============================
const addBarang = async (req, res) => {
  try {
    let foto_url = null;
    if (req.file) {
      foto_url = `/uploads/barang/${req.file.filename}`;
    }

    const newBarang = await createBarang({
      ...req.body,
      foto_url
    });

    res.status(201).json(newBarang);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =============================
// PUT update barang
// =============================
const editBarang = async (req, res) => {
  try {
    let foto_url = req.body.foto_url || null;
    if (req.file) {
      foto_url = `/uploads/barang/${req.file.filename}`;
    }

    const updatedBarang = await updateBarang(req.params.id, {
      ...req.body,
      foto_url
    });

    if (!updatedBarang) return res.status(404).json({ message: 'Barang tidak ditemukan' });

    res.json(updatedBarang);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =============================
// DELETE hapus barang
// =============================
const removeBarang = async (req, res) => {
  try {
    await deleteBarang(req.params.id);
    res.json({ message: 'Barang berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =============================
// GET riwayat stok barang
// =============================
const getBarangRiwayat = async (req, res) => {
  try {
    const riwayat = await getRiwayatBarang(req.params.id);
    res.json(riwayat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =============================
// GET detail riwayat stok (pakai notaId)
// =============================
const getBarangRiwayatDetail = async (req, res) => {
  try {
    const { tipe, notaId, barangId } = req.params;
    const data = await getRiwayatDetail(tipe, notaId, barangId);

    if (!data || !data.nota_id) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =============================
// DELETE riwayat stok
// =============================
const removeBarangRiwayat = async (req, res) => {
  try {
    const { tipe, notaId, barangId } = req.params;
    await deleteRiwayat(tipe, notaId, barangId);
    res.json({ message: 'Riwayat berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  getBarangList,
  getBarangDetail,
  addBarang,
  editBarang,
  removeBarang,
  getBarangRiwayat,
  getBarangRiwayatDetail,
  removeBarangRiwayat
};
