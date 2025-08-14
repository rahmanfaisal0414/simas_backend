const pool = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const getLaporanHariIni = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    // Barang Masuk
    const stokMasuk = await pool.query(`
      SELECT 
        COALESCE(SUM(d.jumlah), 0) AS total_jumlah,
        COALESCE(SUM(d.total_harga), 0) AS total_nominal,
        COUNT(DISTINCT n.id) AS total_transaksi
      FROM nota_stok_masuk n
      JOIN stok_masuk_detail d ON n.id = d.nota_id
      WHERE DATE(n.created_at) = $1
    `, [today]);

    // Barang Keluar
    const stokKeluar = await pool.query(`
      SELECT 
        COALESCE(SUM(d.jumlah), 0) AS total_jumlah,
        COALESCE(SUM(d.total_harga), 0) AS total_nominal,
        COUNT(DISTINCT n.id) AS total_transaksi
      FROM nota_stok_keluar n
      JOIN stok_keluar_detail d ON n.id = d.nota_id
      WHERE DATE(n.created_at) = $1
    `, [today]);

    // Hitung total stok sekarang
    const totalStok = await pool.query(`
      SELECT COALESCE(SUM(stok), 0) AS total_stok
      FROM barang
    `);

    res.json({
      stokMasuk: {
        jumlah: parseInt(stokMasuk.rows[0].total_jumlah, 10),
        nominal: parseInt(stokMasuk.rows[0].total_nominal, 10)
      },
      stokKeluar: {
        jumlah: parseInt(stokKeluar.rows[0].total_jumlah, 10),
        nominal: parseInt(stokKeluar.rows[0].total_nominal, 10)
      },
      jumlahTransaksiBaru: parseInt(stokMasuk.rows[0].total_transaksi, 10) + parseInt(stokKeluar.rows[0].total_transaksi, 10),
      totalStokSekarang: parseInt(totalStok.rows[0].total_stok, 10)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil laporan hari ini' });
  }
};

const getLaporanSemua = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        tipe,
        nota_id,
        tanggal,
        nota,
        catatan,
        json_agg(
          json_build_object(
            'barang_id', barang_id,
            'nama_barang', nama_barang,
            'jumlah', jumlah,
            'harga_satuan', harga_satuan,
            'total_harga', total_harga
          )
        ) AS detail,
        SUM(jumlah) AS total_jumlah,
        COUNT(DISTINCT barang_id) AS total_item
      FROM (
        -- stok masuk
        SELECT 
          'masuk' AS tipe,
          n.id AS nota_id,
          n.created_at AS tanggal,
          n.nota,
          n.catatan,
          b.id AS barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          d.jumlah,
          d.harga_satuan,
          (d.harga_satuan * d.jumlah) AS total_harga
        FROM nota_stok_masuk n
        JOIN stok_masuk_detail d ON d.nota_id = n.id
        JOIN barang b ON b.id = d.barang_id

        UNION ALL

        -- stok keluar
        SELECT 
          'keluar' AS tipe,
          n.id AS nota_id,
          n.created_at AS tanggal,
          n.nota,
          n.catatan,
          b.id AS barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          -d.jumlah AS jumlah,
          d.harga_satuan,
          (d.harga_satuan * d.jumlah) AS total_harga
        FROM nota_stok_keluar n
        JOIN stok_keluar_detail d ON d.nota_id = n.id
        JOIN barang b ON b.id = d.barang_id

        UNION ALL

        -- stok audit
        SELECT 
          'audit' AS tipe,
          n.id AS nota_id,
          n.created_at AS tanggal,
          NULL AS nota,
          n.catatan,
          b.id AS barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          d.selisih AS jumlah,
          NULL AS harga_satuan,
          NULL AS total_harga
        FROM nota_audit_stok n
        JOIN audit_stok_detail d ON d.nota_id = n.id
        JOIN barang b ON b.id = d.barang_id
      ) AS combined
      GROUP BY tipe, nota_id, tanggal, nota, catatan
      ORDER BY tanggal DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil laporan semua' });
  }
};

// ===== Detail per nota (semua barang di nota tsb) =====
const getLaporanDetail = async (req, res) => {
  try {
    const { tipe, notaId } = req.params;

    if (!['masuk', 'keluar', 'audit'].includes(tipe)) {
      return res.status(400).json({ message: 'Tipe laporan tidak valid' });
    }

    let headerQuery = '';
    let detailQuery = '';
    let totalExpr = ''; // untuk hitung total_jumlah

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
          d.barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          d.jumlah,
          d.harga_satuan,
          (d.harga_satuan * d.jumlah) AS total_harga
        FROM stok_masuk_detail d
        JOIN barang b ON b.id = d.barang_id
        WHERE d.nota_id = $1
      `;
      totalExpr = 'SUM(d.jumlah)';
    } else if (tipe === 'keluar') {
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
      // jumlah negatif agar konsisten dengan list
      detailQuery = `
        SELECT 
          d.barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          -d.jumlah AS jumlah,
          d.harga_satuan,
          (d.harga_satuan * d.jumlah) AS total_harga
        FROM stok_keluar_detail d
        JOIN barang b ON b.id = d.barang_id
        WHERE d.nota_id = $1
      `;
      totalExpr = 'SUM(-d.jumlah)';
    } else {
      // audit
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
          d.barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          d.stok_sistem,
          d.stok_fisik,
          d.selisih AS jumlah
        FROM audit_stok_detail d
        JOIN barang b ON b.id = d.barang_id
        WHERE d.nota_id = $1
      `;
      totalExpr = 'SUM(jumlah)'; // ✅ pakai jumlah, bukan d.selisih
    }    

    const headerRes = await pool.query(headerQuery, [notaId]);
    if (headerRes.rows.length === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    const detailRes = await pool.query(detailQuery, [notaId]);
    const totalRes = await pool.query(`
      SELECT ${totalExpr} AS total_jumlah, COUNT(*) AS total_item
      FROM (${detailQuery}) d
    `, [notaId]);

    res.json({
      tipe,
      ...headerRes.rows[0],
      total_jumlah: parseInt(totalRes.rows[0].total_jumlah || 0, 10),
      total_item: parseInt(totalRes.rows[0].total_item || 0, 10),
      detail: detailRes.rows
    });
  } catch (error) {
    console.error('Error getLaporanDetail:', error);
    res.status(500).json({ message: 'Gagal mengambil detail riwayat' });
  }
};

// ===== Hapus satu nota + rollback stok =====
const deleteLaporan = async (req, res) => {
  const client = await pool.connect();
  try {
    const { tipe, notaId } = req.params;

    if (!['masuk', 'keluar', 'audit'].includes(tipe)) {
      return res.status(400).json({ message: 'Tipe laporan tidak valid' });
    }

    await client.query('BEGIN');

    if (tipe === 'masuk') {
      // kembalikan stok (kurangi kembali)
      const { rows } = await client.query(
        `SELECT barang_id, jumlah FROM stok_masuk_detail WHERE nota_id = $1`,
        [notaId]
      );
      for (const r of rows) {
        await client.query(
          `UPDATE barang SET stok = stok - $1 WHERE id = $2`,
          [r.jumlah, r.barang_id]
        );
      }
      await client.query(`DELETE FROM stok_masuk_detail WHERE nota_id = $1`, [notaId]);
      await client.query(`DELETE FROM nota_stok_masuk WHERE id = $1`, [notaId]);
    } else if (tipe === 'keluar') {
      // kembalikan stok (tambah kembali)
      const { rows } = await client.query(
        `SELECT barang_id, jumlah FROM stok_keluar_detail WHERE nota_id = $1`,
        [notaId]
      );
      for (const r of rows) {
        await client.query(
          `UPDATE barang SET stok = stok + $1 WHERE id = $2`,
          [r.jumlah, r.barang_id]
        );
      }
      await client.query(`DELETE FROM stok_keluar_detail WHERE nota_id = $1`, [notaId]);
      await client.query(`DELETE FROM nota_stok_keluar WHERE id = $1`, [notaId]);
    } else {
      // audit: hitung selisih, rollback hanya selisih audit
      const { rows } = await client.query(
        `SELECT barang_id, stok_sistem, stok_fisik 
         FROM audit_stok_detail 
         WHERE nota_id = $1`,
        [notaId]
      );
    
      for (const r of rows) {
        const selisih = r.stok_fisik - r.stok_sistem; // perubahan yang dilakukan saat audit
        // rollback selisih ini
        await client.query(
          `UPDATE barang SET stok = stok - $1 WHERE id = $2`,
          [selisih, r.barang_id]
        );
      }
    
      await client.query(`DELETE FROM audit_stok_detail WHERE nota_id = $1`, [notaId]);
      await client.query(`DELETE FROM nota_audit_stok WHERE id = $1`, [notaId]);
    }    

    await client.query('COMMIT');
    res.json({ message: 'Riwayat berhasil dihapus beserta rollback stok' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleteLaporan:', error);
    res.status(500).json({ message: 'Gagal menghapus riwayat' });
  } finally {
    client.release();
  }
};

// =============================
// LAPORAN STOK (semua pergerakan stok)
// =============================
const getLaporanStok = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filter = '';
    const params = [];

    if (startDate && endDate) {
      params.push(startDate, endDate);
      filter = `WHERE tanggal::date BETWEEN $1 AND $2`;
    }

    const result = await pool.query(`
      WITH pergerakan AS (
        SELECT 
          b.id AS barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          n.created_at AS tanggal,
          'masuk' AS tipe,
          d.jumlah,
          d.harga_satuan
        FROM nota_stok_masuk n
        JOIN stok_masuk_detail d ON d.nota_id = n.id
        JOIN barang b ON b.id = d.barang_id
    
        UNION ALL
    
        SELECT 
          b.id AS barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          n.created_at AS tanggal,
          'keluar' AS tipe,
          -d.jumlah AS jumlah,
          d.harga_satuan
        FROM nota_stok_keluar n
        JOIN stok_keluar_detail d ON d.nota_id = n.id
        JOIN barang b ON b.id = d.barang_id
    
        UNION ALL
    
        SELECT 
          b.id AS barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          n.created_at AS tanggal,
          'audit' AS tipe,
          d.selisih AS jumlah,
          NULL AS harga_satuan
        FROM nota_audit_stok n
        JOIN audit_stok_detail d ON d.nota_id = n.id
        JOIN barang b ON b.id = d.barang_id
      )
      SELECT 
        p.barang_id,
        p.nama_barang,
        b.min_stok,
        SUM(CASE WHEN p.tipe = 'masuk' THEN p.jumlah ELSE 0 END) AS stok_masuk,
        SUM(CASE WHEN p.tipe = 'keluar' THEN ABS(p.jumlah) ELSE 0 END) AS stok_keluar,
        SUM(CASE WHEN p.tipe = 'audit' THEN p.jumlah ELSE 0 END) AS total_audit,
        MAX(p.harga_satuan) FILTER (WHERE p.harga_satuan IS NOT NULL) AS harga_terakhir,
        b.stok AS stok_sisa,
        b.stok * COALESCE(MAX(p.harga_satuan) FILTER (WHERE p.harga_satuan IS NOT NULL), 0) AS nilai_persediaan
      FROM pergerakan p
      JOIN barang b ON b.id = p.barang_id
      ${filter ? `WHERE p.tanggal::date BETWEEN $1 AND $2` : ``}
      GROUP BY p.barang_id, p.nama_barang, b.min_stok, b.stok
      ORDER BY p.nama_barang ASC
    `, params);    

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil laporan stok rekap' });
  }
};


// =============================
// LAPORAN TRANSAKSI (hanya masuk & keluar)
// =============================
const getLaporanTransaksi = async (req, res) => {
  try {
    const { startDate, endDate, tipe } = req.query;

    let filter = '';
    const params = [];

    if (startDate && endDate) {
      params.push(startDate, endDate);
      filter += ` WHERE tanggal::date BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    if (tipe && ['masuk', 'keluar'].includes(tipe)) {
      params.push(tipe);
      filter += filter ? ` AND tipe = $${params.length}` : ` WHERE tipe = $${params.length}`;
    }

    const result = await pool.query(`
      SELECT 
        tipe,
        nota_id,
        tanggal,
        nota,
        catatan,
        COALESCE(pemasok, pelanggan) AS relasi,
        metode,
        SUM(jumlah) AS total_jumlah,
        COUNT(DISTINCT barang_id) AS total_item,
        SUM(total_harga) AS total_nominal,
        json_agg(
          json_build_object(
            'barang_id', barang_id,
            'nama_barang', nama_barang,
            'jumlah', jumlah,
            'harga_satuan', harga_satuan,
            'total_harga', total_harga
          )
        ) AS detail
      FROM (
        -- pembelian (stok masuk)
        SELECT 
          'masuk' AS tipe,
          n.id AS nota_id,
          n.created_at AS tanggal,
          n.nota,
          n.catatan,
          p.nama_pemasok AS pemasok,
          NULL AS pelanggan,
          NULL AS metode,
          b.id AS barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          d.jumlah,
          d.harga_satuan,
          (d.harga_satuan * d.jumlah) AS total_harga
        FROM nota_stok_masuk n
        LEFT JOIN pemasok p ON p.id = n.pemasok_id
        JOIN stok_masuk_detail d ON d.nota_id = n.id
        JOIN barang b ON b.id = d.barang_id

        UNION ALL

        -- penjualan (stok keluar)
        SELECT 
          'keluar' AS tipe,
          n.id AS nota_id,
          n.created_at AS tanggal,
          n.nota,
          n.catatan,
          NULL AS pemasok,
          pl.nama_pelanggan AS pelanggan,
          m.nama_metode AS metode,
          b.id AS barang_id,
          CONCAT(b.nama_barang, ' (', b.kondisi, ')') AS nama_barang,
          d.jumlah,
          d.harga_satuan,
          (d.harga_satuan * d.jumlah) AS total_harga
        FROM nota_stok_keluar n
        LEFT JOIN pelanggan pl ON pl.id = n.pelanggan_id
        LEFT JOIN metode_pembayaran m ON m.id = n.metode_id
        JOIN stok_keluar_detail d ON d.nota_id = n.id
        JOIN barang b ON b.id = d.barang_id
      ) AS combined
      ${filter}
      GROUP BY tipe, nota_id, tanggal, nota, catatan, pemasok, pelanggan, metode
      ORDER BY tanggal DESC
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil laporan transaksi' });
  }
};

async function _queryLaporanStok(startDate, endDate) {
  const params = [];
  let filter = '';

  if (startDate && endDate) {
    params.push(startDate, endDate);
    filter = `WHERE p.tanggal::date BETWEEN $1 AND $2`;
  }

  const { rows } = await pool.query(`
    WITH pergerakan AS (
      SELECT b.id AS barang_id, b.nama_barang,
             n.created_at AS tanggal,
             'masuk' AS tipe, d.jumlah
      FROM nota_stok_masuk n
      JOIN stok_masuk_detail d ON d.nota_id = n.id
      JOIN barang b ON b.id = d.barang_id

      UNION ALL

      SELECT b.id, b.nama_barang,
             n.created_at, 'keluar',
             -d.jumlah
      FROM nota_stok_keluar n
      JOIN stok_keluar_detail d ON d.nota_id = n.id
      JOIN barang b ON b.id = d.barang_id

      UNION ALL

      SELECT b.id, b.nama_barang,
             n.created_at, 'audit',
             d.selisih
      FROM nota_audit_stok n
      JOIN audit_stok_detail d ON d.nota_id = n.id
      JOIN barang b ON b.id = d.barang_id
    )
    SELECT 
      p.barang_id,
      p.nama_barang,
      b.min_stok,
      SUM(CASE WHEN p.tipe='masuk' THEN p.jumlah ELSE 0 END) AS stok_masuk,
      SUM(CASE WHEN p.tipe='keluar' THEN ABS(p.jumlah) ELSE 0 END) AS stok_keluar,
      SUM(CASE WHEN p.tipe='audit' THEN p.jumlah ELSE 0 END) AS total_audit,
      b.stok AS stok_sisa
    FROM pergerakan p
    JOIN barang b ON b.id = p.barang_id
    ${filter}
    GROUP BY p.barang_id, p.nama_barang, b.min_stok, b.stok
    ORDER BY p.nama_barang ASC
  `, params);

  return rows;
}

// =============================
// _queryLaporanTransaksi (Revisi)
// =============================
async function _queryLaporanTransaksi(startDate, endDate, tipe) {
  const params = [];
  const filters = [];

  if (startDate && endDate) {
    params.push(startDate, endDate);
    filters.push(`tanggal::date BETWEEN $${params.length - 1} AND $${params.length}`);
  }

  if (tipe && ['masuk', 'keluar'].includes(tipe.toLowerCase())) {
    params.push(tipe.toLowerCase());
    filters.push(`tipe = $${params.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const { rows } = await pool.query(`
    SELECT 
      tipe,
      tanggal,
      nota,
      CASE 
        WHEN tipe = 'masuk' THEN CONCAT(pemasok, ' (Pemasok)')
        WHEN tipe = 'keluar' THEN CONCAT(pelanggan, ' (Pelanggan)')
        ELSE COALESCE(pemasok, pelanggan)
      END AS relasi,
      nama_barang,
      jumlah,
      harga_satuan,
      (jumlah * harga_satuan) AS nominal
    FROM (
      -- stok masuk
      SELECT 
        'masuk' AS tipe,
        n.created_at AS tanggal,
        n.nota,
        p.nama_pemasok AS pemasok,
        NULL AS pelanggan,
        b.nama_barang,
        d.jumlah,
        d.harga_satuan
      FROM nota_stok_masuk n
      LEFT JOIN pemasok p ON p.id = n.pemasok_id
      JOIN stok_masuk_detail d ON d.nota_id = n.id
      JOIN barang b ON b.id = d.barang_id

      UNION ALL

      -- stok keluar
      SELECT 
        'keluar',
        n.created_at,
        n.nota,
        NULL,
        pl.nama_pelanggan,
        b.nama_barang,
        d.jumlah,
        d.harga_satuan
      FROM nota_stok_keluar n
      LEFT JOIN pelanggan pl ON pl.id = n.pelanggan_id
      JOIN stok_keluar_detail d ON d.nota_id = n.id
      JOIN barang b ON b.id = d.barang_id
    ) combined
    ${whereClause}
    ORDER BY tanggal DESC, nota, nama_barang
  `, params);

  return rows;
}

// di akhir file
module.exports = {
  getLaporanHariIni,
  getLaporanSemua,
  getLaporanDetail,
  deleteLaporan,
  getLaporanStok,
  getLaporanTransaksi,
  _queryLaporanStok,
  _queryLaporanTransaksi,
};


