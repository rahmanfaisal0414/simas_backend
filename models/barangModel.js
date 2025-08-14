const pool = require('../config/db');

// =============================
// Ambil semua barang
// =============================
const getAllBarang = async () => {
  const res = await pool.query('SELECT * FROM barang ORDER BY id DESC');
  return res.rows;
};

// =============================
// Ambil detail barang
// =============================
const getBarangById = async (id) => {
  const res = await pool.query(
    `SELECT 
        b.*, 
        k.nama_kategori 
     FROM barang b
     LEFT JOIN kategori_barang k ON b.kategori_id = k.id 
     WHERE b.id = $1`,
    [id]
  );
  return res.rows[0];
};

// =============================
// Tambah barang baru
// =============================
const createBarang = async (data) => {
  const {
    nama_barang,
    kategori_id,
    kondisi,
    stok,
    min_stok,
    harga,
    lokasi,
    catatan,
    foto_url
  } = data;

  const res = await pool.query(
    `INSERT INTO barang 
        (nama_barang, kategori_id, kondisi, stok, min_stok, harga, lokasi, catatan, foto_url, created_at, updated_at) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
     RETURNING *`,
    [
      nama_barang,
      kategori_id,
      kondisi || 'Baru',
      stok || 0,
      min_stok || 0,
      harga || 0,
      lokasi || '',
      catatan || '',
      foto_url || null
    ]
  );
  return res.rows[0];
};

// =============================
// Update barang
// =============================
const updateBarang = async (id, data) => {
  const {
    nama_barang,
    kategori_id,
    kondisi,
    stok,
    min_stok,
    harga,
    lokasi,
    catatan,
    foto_url
  } = data;

  const res = await pool.query(
    `UPDATE barang SET 
      nama_barang=$1, kategori_id=$2, kondisi=$3, stok=$4, min_stok=$5,
      harga=$6, lokasi=$7, catatan=$8, foto_url=$9, updated_at=NOW()
    WHERE id=$10 RETURNING *`,
    [
      nama_barang,
      kategori_id,
      kondisi || 'Baru',
      stok || 0,
      min_stok || 0,
      harga || 0,
      lokasi || '',
      catatan || '',
      foto_url || null,
      id
    ]
  );
  return res.rows[0];
};

// =============================
// Hapus barang
// =============================
const deleteBarang = async (id) => {
  // Hapus semua riwayat stok masuk detail
  await pool.query(`DELETE FROM stok_masuk_detail WHERE barang_id = $1`, [id]);

  // Hapus semua riwayat stok keluar detail
  await pool.query(`DELETE FROM stok_keluar_detail WHERE barang_id = $1`, [id]);

  // Hapus semua riwayat audit stok detail
  await pool.query(`DELETE FROM audit_stok_detail WHERE barang_id = $1`, [id]);

  // (Opsional) hapus nota yang tidak punya detail lagi
  await pool.query(`
    DELETE FROM nota_stok_masuk
    WHERE id NOT IN (SELECT DISTINCT nota_id FROM stok_masuk_detail)
  `);
  await pool.query(`
    DELETE FROM nota_stok_keluar
    WHERE id NOT IN (SELECT DISTINCT nota_id FROM stok_keluar_detail)
  `);
  await pool.query(`
    DELETE FROM nota_audit_stok
    WHERE id NOT IN (SELECT DISTINCT nota_id FROM audit_stok_detail)
  `);

  // Terakhir hapus barangnya
  await pool.query(`DELETE FROM barang WHERE id = $1`, [id]);
};


// =============================
// Ambil riwayat stok barang
// =============================
// =============================
// Ambil riwayat stok barang
// =============================
const getRiwayatBarang = async (barangId) => {
  const res = await pool.query(
    `
    SELECT 
      tipe,
      nota_id,
      created_at AS tanggal,
      nota,
      json_agg(
        json_build_object(
          'nama_barang', nama_barang,
          'jumlah', jumlah
        )
      ) AS detail,
      SUM(jumlah) AS total_jumlah,
      COUNT(DISTINCT nama_barang) AS total_item
    FROM (
      SELECT 
        'masuk' AS tipe,
        n.id AS nota_id, -- dari nota_stok_masuk
        n.created_at,
        n.nota,
        CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
        smd.jumlah
      FROM stok_masuk_detail smd
      JOIN nota_stok_masuk n ON smd.nota_id = n.id
      JOIN barang b ON smd.barang_id = b.id
      WHERE b.id = $1

      UNION ALL

      SELECT 
        'keluar' AS tipe,
        n.id AS nota_id, -- dari nota_stok_keluar
        n.created_at,
        n.nota,
        CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
        -skd.jumlah AS jumlah
      FROM stok_keluar_detail skd
      JOIN nota_stok_keluar n ON skd.nota_id = n.id
      JOIN barang b ON skd.barang_id = b.id
      WHERE b.id = $1

      UNION ALL

      SELECT 
        'audit' AS tipe,
        n.id AS nota_id, -- dari nota_audit_stok
        n.created_at,
        NULL AS nota,
        CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
        asd.selisih AS jumlah
      FROM audit_stok_detail asd
      JOIN nota_audit_stok n ON asd.nota_id = n.id
      JOIN barang b ON asd.barang_id = b.id
      WHERE b.id = $1
    ) AS combined
    GROUP BY tipe, nota_id, created_at, nota
    ORDER BY created_at DESC
    `,
    [barangId]
  );

  return res.rows;
};


// =============================
// Ambil detail riwayat stok
// =============================
async function getRiwayatDetail(tipe, notaId, barangId) {
  let headerQuery = "";
  let detailQuery = "";

  if (tipe === 'masuk') {
    headerQuery = `
      SELECT 
        n.id AS nota_id,
        n.created_at AS tanggal,
        n.nota,
        n.catatan,
        p.nama_pemasok AS pemasok
      FROM nota_stok_masuk n
      LEFT JOIN pemasok p ON p.id = n.pemasok_id
      WHERE n.id = $1
    `;  
    detailQuery = `
      SELECT 
        d.id,
        d.barang_id,
        CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
        d.jumlah,
        d.harga_satuan,
        (d.harga_satuan * d.jumlah) AS total_harga
      FROM stok_masuk_detail d
      LEFT JOIN barang b ON b.id = d.barang_id
      WHERE d.nota_id = $1
      AND d.barang_id = $2
    `;
  } 
  else if (tipe === 'keluar') {
    headerQuery = `
      SELECT 
        n.id AS nota_id,
        n.created_at AS tanggal,
        n.nota,
        n.catatan,
        pl.nama_pelanggan AS pelanggan,
        m.nama_metode AS metode
      FROM nota_stok_keluar n
      LEFT JOIN pelanggan pl ON pl.id = n.pelanggan_id
      LEFT JOIN metode_pembayaran m ON m.id = n.metode_id
      WHERE n.id = $1
    `;
    detailQuery = `
      SELECT 
        d.id,
        d.barang_id,
        CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
        -d.jumlah AS jumlah,
        d.harga_satuan,
        (d.harga_satuan * d.jumlah) AS total_harga
      FROM stok_keluar_detail d
      LEFT JOIN barang b ON b.id = d.barang_id
      WHERE d.nota_id = $1
      AND d.barang_id = $2
    `;
  } 
  else if (tipe === 'audit') {
    headerQuery = `
      SELECT 
        n.id AS nota_id,
        n.created_at AS tanggal,
        n.catatan
      FROM nota_audit_stok n
      WHERE n.id = $1
    `;
    detailQuery = `
      SELECT 
        d.id,
        d.barang_id,
        CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
        d.stok_sistem,
        d.stok_fisik,
        d.selisih
      FROM audit_stok_detail d
      LEFT JOIN barang b ON b.id = d.barang_id
      WHERE d.nota_id = $1
      AND d.barang_id = $2
    `;
  }

  const header = await pool.query(headerQuery, [notaId]);
  const detail = await pool.query(detailQuery, [notaId, barangId]);

  return {
    tipe,
    ...header.rows[0],
    total_jumlah: detail.rows.reduce((sum, d) => {
      if (tipe === 'audit') return sum + (d.selisih || 0);
      return sum + (d.jumlah || 0);
    }, 0),
    total_item: detail.rows.length,
    detail: detail.rows
  };
}

// =============================
// Hapus riwayat stok
// =============================
const deleteRiwayat = async (tipe, notaId, barangId) => {
  let table = '';
  let jumlah = 0;

  if (tipe === 'masuk') {
    table = 'stok_masuk_detail';
    const res = await pool.query(`SELECT jumlah FROM ${table} WHERE nota_id = $1 AND barang_id = $2`, [notaId, barangId]);
    if (res.rows.length) {
      jumlah = res.rows[0].jumlah;
      await pool.query(`UPDATE barang SET stok = stok - $1 WHERE id = $2`, [jumlah, barangId]);
      await pool.query(`DELETE FROM ${table} WHERE nota_id = $1 AND barang_id = $2`, [notaId, barangId]);
    }
  } 
  else if (tipe === 'keluar') {
    table = 'stok_keluar_detail';
    const res = await pool.query(`SELECT jumlah FROM ${table} WHERE nota_id = $1 AND barang_id = $2`, [notaId, barangId]);
    if (res.rows.length) {
      jumlah = res.rows[0].jumlah;
      await pool.query(`UPDATE barang SET stok = stok + $1 WHERE id = $2`, [jumlah, barangId]);
      await pool.query(`DELETE FROM ${table} WHERE nota_id = $1 AND barang_id = $2`, [notaId, barangId]);
    }
  } 
  else if (tipe === 'audit') {
    table = 'audit_stok_detail';
    const res = await pool.query(
      `SELECT stok_sistem, stok_fisik FROM ${table} WHERE nota_id = $1 AND barang_id = $2`,
      [notaId, barangId]
    );
    if (res.rows.length) {
      const { stok_sistem, stok_fisik } = res.rows[0];
      const selisih = stok_fisik - stok_sistem;
  
      // rollback selisih → kurangi atau tambah stok sekarang
      await pool.query(
        `UPDATE barang SET stok = stok - $1 WHERE id = $2`,
        [selisih, barangId]
      );
  
      await pool.query(
        `DELETE FROM ${table} WHERE nota_id = $1 AND barang_id = $2`,
        [notaId, barangId]
      );
    }
  }
};

// Ambil barang yang stok <= min_stok
const getBarangMinStok = async () => {
  const res = await pool.query(`
    SELECT id, nama_barang, stok, min_stok, foto_url, kondisi
    FROM barang
    WHERE stok <= min_stok
    ORDER BY stok ASC
  `);
  return res.rows;
};


module.exports = {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  getRiwayatBarang,
  getRiwayatDetail,
  deleteRiwayat,
  getBarangMinStok
};
