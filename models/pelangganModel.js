const pool = require('../config/db');

const getAllPelanggan = async () => {
  const res = await pool.query('SELECT * FROM pelanggan ORDER BY id ASC');
  return res.rows;
};

const createPelanggan = async (nama, kontak, alamat, catatan) => {
  const res = await pool.query(
    'INSERT INTO pelanggan (nama_pelanggan, kontak, alamat, catatan) VALUES ($1,$2,$3,$4) RETURNING *',
    [nama, kontak, alamat, catatan]
  );
  return res.rows[0];
};

const updatePelanggan = async (id, nama, kontak, alamat, catatan) => {
  const res = await pool.query(
    `UPDATE pelanggan 
     SET nama_pelanggan = $1, kontak = $2, alamat = $3, catatan = $4
     WHERE id = $5
     RETURNING *`,
    [nama, kontak, alamat, catatan, id]
  );
  return res.rows[0];
};

const deletePelanggan = async (id) => {
  await pool.query('DELETE FROM pelanggan WHERE id = $1', [id]);
};

module.exports = { getAllPelanggan, createPelanggan, deletePelanggan, updatePelanggan };
