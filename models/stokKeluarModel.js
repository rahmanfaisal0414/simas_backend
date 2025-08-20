const pool = require('../config/db');

const createNotaStokKeluar = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { pelanggan_id, user_id, metode_id, catatan, barang } = data;

    const notaRes = await client.query(`
      INSERT INTO nota_stok_keluar (pelanggan_id, user_id, metode_id, catatan, tanggal)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, nota, tanggal, created_at
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
      id: notaRes.rows[0].id,
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

const getAllNotaKeluar = async () => {
  const res = await pool.query(`
    SELECT nsk.*, p.nama_pelanggan, u.username
    FROM nota_stok_keluar nsk
    LEFT JOIN pelanggan p ON nsk.pelanggan_id = p.id
    LEFT JOIN users u ON nsk.user_id = u.id
    ORDER BY nsk.tanggal DESC
  `);
  return res.rows;
};

const getNotaKeluarById = async (id) => {
  const notaRes = await pool.query(`
    SELECT 
      nsk.id,
      nsk.nota AS kode,
      TO_CHAR(nsk.tanggal, 'YYYY-MM-DD HH24:MI:SS') AS tanggal,
      p.id AS pelanggan_id,
      p.nama_pelanggan,
      p.kontak AS no_wa,
      u.username AS kasir
    FROM nota_stok_keluar nsk
    LEFT JOIN pelanggan p ON nsk.pelanggan_id = p.id
    LEFT JOIN users u ON nsk.user_id = u.id
    WHERE nsk.id = $1
  `, [id]);

  if (notaRes.rows.length === 0) return null;

  const detailRes = await pool.query(`
    SELECT 
      b.nama_barang,
      d.jumlah,
      d.harga_satuan,
      d.total_harga
    FROM stok_keluar_detail d
    JOIN barang b ON d.barang_id = b.id
    WHERE d.nota_id = $1
  `, [id]);

  const total = detailRes.rows.reduce((sum, item) => sum + Number(item.total_harga), 0);

  return {
    id: notaRes.rows[0].id,
    kode: notaRes.rows[0].kode,
    tanggal: notaRes.rows[0].tanggal,
    pelanggan_id: notaRes.rows[0].pelanggan_id,
    nama_pelanggan: notaRes.rows[0].nama_pelanggan,
    no_wa: notaRes.rows[0].no_wa,
    kasir: notaRes.rows[0].kasir,
    detail: detailRes.rows,
    total
  };
};

const getRiwayatPelanggan = async (pelangganId) => {
  const res = await pool.query(`
    SELECT 
      nsk.id,
      nsk.nota AS kode,
      TO_CHAR(nsk.tanggal, 'YYYY-MM-DD HH24:MI:SS') AS tanggal,
      COALESCE(SUM(d.total_harga), 0) AS total
    FROM nota_stok_keluar nsk
    LEFT JOIN stok_keluar_detail d ON nsk.id = d.nota_id
    WHERE nsk.pelanggan_id = $1
    GROUP BY nsk.id
    ORDER BY nsk.tanggal DESC
  `, [pelangganId]);
  return res.rows;
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
  deleteNotaKeluar,
  getRiwayatPelanggan
};
