const { getAllMetode, createMetode, deleteMetode } = require('../models/metodePembayaranModel');

const getMetode = async (req, res) => {
    try {
        const metode = await getAllMetode();
        res.json(metode);
    } catch (err) {
        console.error('Error getMetode:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

const addMetode = async (req, res) => {
    try {
        const { nama_metode } = req.body;
        if (!nama_metode) {
            return res.status(400).json({ message: 'Nama metode pembayaran wajib diisi' });
        }
        const metodeBaru = await createMetode(nama_metode);
        res.status(201).json(metodeBaru);
    } catch (err) {
        console.error('Error addMetode:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

const removeMetode = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteMetode(id);
        res.json({ message: 'Metode pembayaran berhasil dihapus' });
    } catch (err) {
        console.error('Error removeMetode:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

module.exports = { getMetode, addMetode, removeMetode };
