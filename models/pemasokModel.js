const pool = require('../config/db');

const getAllPemasok = async () => {
  const res = await pool.query('SELECT * FROM pemasok ORDER BY id ASC');
  return res.rows;
};

const createPemasok = async (nama, kontak, alamat, catatan) => {
  const res = await pool.query(
    'INSERT INTO pemasok (nama_pemasok, kontak, alamat, catatan) VALUES ($1,$2,$3,$4) RETURNING *',
    [nama, kontak, alamat, catatan]
  );
  return res.rows[0];
};

// Update pelanggan
const updatePemasok = async (id, nama, kontak, alamat, catatan) => {
  const res = await pool.query(
    `UPDATE pemasok
     SET nama_pemasok = $1, kontak = $2, alamat = $3, catatan = $4
     WHERE id = $5
     RETURNING *`,
    [nama, kontak, alamat, catatan, id]
  );
  return res.rows[0];
};

const deletePemasok = async (id) => {
  await pool.query('DELETE FROM pemasok WHERE id = $1', [id]);
};

module.exports = { getAllPemasok, createPemasok, deletePemasok, updatePemasok };
