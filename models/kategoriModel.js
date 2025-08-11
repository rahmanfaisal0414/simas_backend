const pool = require('../config/db');

// Ambil semua kategori
const getAllKategori = async () => {
    const res = await pool.query('SELECT * FROM kategori_barang ORDER BY id ASC');
    return res.rows;
};

// Tambah kategori
const createKategori = async (nama_kategori) => {
    const res = await pool.query(
        'INSERT INTO kategori_barang (nama_kategori) VALUES ($1) RETURNING *',
        [nama_kategori]
    );
    return res.rows[0];
};

// Hapus kategori
const deleteKategori = async (id) => {
    await pool.query('DELETE FROM kategori_barang WHERE id = $1', [id]);
};

module.exports = { getAllKategori, createKategori, deleteKategori };
