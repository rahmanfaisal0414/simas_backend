const pool = require('../config/db');

const createNotaStokKeluar = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { pelanggan_id, user_id, metode_id, catatan, barang } = data;

    const notaRes = await client.query(`
      INSERT INTO nota_stok_keluar (pelanggan_id, user_id, metode_id, catatan)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nota, created_at
    `, [pelanggan_id, user_id, metode_id, catatan]);

    const nota_id = notaRes.rows[0].id;

    for (const item of barang) {
      const { barang_id, jumlah, harga_satuan } = item;
      const total_harga = jumlah * harga_satuan;

      await client.query(`
        INSERT INTO stok_keluar_detail (nota_id, barang_id, jumlah, harga_satuan, total_harga)
        VALUES ($1, $2, $3, $4, $5)
      `, [nota_id, barang_id, jumlah, harga_satuan, total_harga]);

      await client.query(`
        UPDATE barang SET stok = stok - $1, updated_at = NOW()
        WHERE id = $2
      `, [jumlah, barang_id]);
    }

    await client.query('COMMIT');
    return {
      message: 'Stok keluar berhasil disimpan',
      nota: notaRes.rows[0].nota,
      created_at: notaRes.rows[0].created_at
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getAllNotaKeluar = async () => {
  const res = await pool.query(`
    SELECT nsk.*, p.nama_pelanggan, u.username
    FROM nota_stok_keluar nsk
    LEFT JOIN pelanggan p ON nsk.pelanggan_id = p.id
    LEFT JOIN users u ON nsk.user_id = u.id
    ORDER BY nsk.created_at DESC
  `);
  return res.rows;
};

const getNotaKeluarById = async (id) => {
  const nota = await pool.query(`SELECT * FROM nota_stok_keluar WHERE id = $1`, [id]);
  const detail = await pool.query(`
    SELECT d.*, b.nama_barang FROM stok_keluar_detail d
    JOIN barang b ON d.barang_id = b.id
    WHERE d.nota_id = $1
  `, [id]);

  return {
    nota: nota.rows[0],
    detail: detail.rows
  };
};

const deleteNotaKeluar = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const detailRes = await client.query(`
      SELECT barang_id, jumlah FROM stok_keluar_detail
      WHERE nota_id = $1
    `, [id]);

    for (const item of detailRes.rows) {
      await client.query(`
        UPDATE barang SET stok = stok + $1 WHERE id = $2
      `, [item.jumlah, item.barang_id]);
    }

    await client.query('DELETE FROM nota_stok_keluar WHERE id = $1', [id]);

    await client.query('COMMIT');
    return { message: 'Nota keluar berhasil dihapus dan stok dikembalikan' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createNotaStokKeluar,
  getAllNotaKeluar,
  getNotaKeluarById,
  deleteNotaKeluar
};
