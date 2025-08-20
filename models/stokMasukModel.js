const pool = require('../config/db');

const createNotaStokMasuk = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { pemasok_id, user_id, catatan, barang } = data;

    // isi tanggal dengan NOW() supaya bukan hanya date 00:00:00
    const notaRes = await client.query(
      `INSERT INTO nota_stok_masuk (pemasok_id, user_id, catatan, tanggal)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, nota, tanggal, created_at`,
      [pemasok_id, user_id, catatan]
    );
    const nota_id = notaRes.rows[0].id;

    for (const item of barang) {
      const { barang_id, jumlah, harga_satuan } = item;
      const total_harga = jumlah * harga_satuan;

      await client.query(
        `INSERT INTO stok_masuk_detail (nota_id, barang_id, jumlah, harga_satuan, total_harga)
         VALUES ($1, $2, $3, $4, $5)`,
        [nota_id, barang_id, jumlah, harga_satuan, total_harga]
      );

      await client.query(
        `UPDATE barang SET stok = stok + $1, updated_at = NOW() WHERE id = $2`,
        [jumlah, barang_id]
      );
    }

    await client.query('COMMIT');
    return {
      message: 'Stok masuk berhasil disimpan',
      nota: notaRes.rows[0].nota,
      tanggal: notaRes.rows[0].tanggal,  
      created_at: notaRes.rows[0].created_at 
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getAllNota = async () => {
  const res = await pool.query(`
    SELECT nsm.*, p.nama_pemasok, u.username
    FROM nota_stok_masuk nsm
    LEFT JOIN pemasok p ON nsm.pemasok_id = p.id
    LEFT JOIN users u ON nsm.user_id = u.id
    ORDER BY nsm.tanggal DESC
  `);
  return res.rows;
};

const getNotaById = async (id) => {
  const nota = await pool.query('SELECT * FROM nota_stok_masuk WHERE id = $1', [id]);
  const detail = await pool.query(`
    SELECT d.*, b.nama_barang 
    FROM stok_masuk_detail d
    JOIN barang b ON d.barang_id = b.id
    WHERE d.nota_id = $1
  `, [id]);

  return {
    nota: nota.rows[0],
    detail: detail.rows
  };
};

const deleteNota = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const detailRes = await client.query(`
      SELECT barang_id, jumlah FROM stok_masuk_detail
      WHERE nota_id = $1
    `, [id]);

    for (const item of detailRes.rows) {
      await client.query(`
        UPDATE barang SET stok = stok - $1 WHERE id = $2
      `, [item.jumlah, item.barang_id]);
    }

    // Hapus nota (otomatis hapus detail karena ON DELETE CASCADE)
    await client.query('DELETE FROM nota_stok_masuk WHERE id = $1', [id]);

    await client.query('COMMIT');
    return { message: 'Nota dan stok berhasil dihapus dan dikembalikan' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createNotaStokMasuk,
  getAllNota,
  getNotaById,
  deleteNota
};
