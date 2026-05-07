const pool = require('../config/db');

const getBarangInfoById = async (barangId) => {
  const result = await pool.query(
    `
    SELECT id, kode_barang, nama_barang, stok, min_stok
    FROM barang
    WHERE id = $1
    `,
    [barangId]
  );

  return result.rows[0];
};

const getSalesHistoryByBarang = async (barangId, start = null, end = null) => {
    const result = await pool.query(
      `
      SELECT
        DATE(n.tanggal) AS tanggal,
        SUM(d.jumlah) AS qty_keluar
      FROM stok_keluar_detail d
      JOIN nota_stok_keluar n ON d.nota_id = n.id
      WHERE d.barang_id = $1
        AND ($2::date IS NULL OR DATE(n.tanggal) >= $2::date)
        AND ($3::date IS NULL OR DATE(n.tanggal) <= $3::date)
      GROUP BY DATE(n.tanggal)
      ORDER BY tanggal ASC
      `,
      [barangId, start, end]
    );
  
    return result.rows;
  };

module.exports = {
  getBarangInfoById,
  getSalesHistoryByBarang,
};