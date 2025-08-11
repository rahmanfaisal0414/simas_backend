const pool = require('../config/db');

// Ambil semua metode pembayaran
const getAllMetode = async () => {
    const res = await pool.query('SELECT * FROM metode_pembayaran ORDER BY id ASC');
    return res.rows;
};

// Tambah metode pembayaran
const createMetode = async (nama_metode) => {
    const res = await pool.query(
        'INSERT INTO metode_pembayaran (nama_metode) VALUES ($1) RETURNING *',
        [nama_metode]
    );
    return res.rows[0];
};

// Hapus metode pembayaran
const deleteMetode = async (id) => {
    await pool.query('DELETE FROM metode_pembayaran WHERE id = $1', [id]);
};

module.exports = { getAllMetode, createMetode, deleteMetode };
