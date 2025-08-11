const { getAllKategori, createKategori, deleteKategori } = require('../models/kategoriModel');

// GET semua kategori
const getKategori = async (req, res) => {
    try {
        const kategori = await getAllKategori();
        res.json(kategori);
    } catch (err) {
        console.error('Error getKategori:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// POST tambah kategori
const addKategori = async (req, res) => {
    try {
        const { nama_kategori } = req.body;
        if (!nama_kategori) {
            return res.status(400).json({ message: 'Nama kategori wajib diisi' });
        }
        const kategoriBaru = await createKategori(nama_kategori);
        res.status(201).json(kategoriBaru);
    } catch (err) {
        console.error('Error addKategori:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// DELETE kategori
const removeKategori = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteKategori(id);
        res.json({ message: 'Kategori berhasil dihapus' });
    } catch (err) {
        console.error('Error removeKategori:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

module.exports = { getKategori, addKategori, removeKategori };
