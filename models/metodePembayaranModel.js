const pool = require('../config/db');

const getAllMetode = async () => {
    const res = await pool.query('SELECT * FROM metode_pembayaran ORDER BY id ASC');
    return res.rows;
};

const createMetode = async (nama_metode) => {
    const res = await pool.query(
        'INSERT INTO metode_pembayaran (nama_metode) VALUES ($1) RETURNING *',
        [nama_metode]
    );
    return res.rows[0];
};

const deleteMetode = async (id) => {
    await pool.query('DELETE FROM metode_pembayaran WHERE id = $1', [id]);
};

module.exports = { getAllMetode, createMetode, deleteMetode };
