const pool = require('../config/db');
const moment = require('moment-timezone'); // pastikan sudah diinstall

const createStokAudit = async (user_id, catatan) => {
  // waktu sekarang Asia/Jakarta
  const nowWIB = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

  const result = await pool.query(
    `INSERT INTO nota_audit_stok (user_id, catatan, created_at) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [user_id, catatan, nowWIB]
  );
  return result.rows[0];
};

const createAuditDetail = async (nota_id, detail) => {
  const nowWIB = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

  for (const item of detail) {
    const { barang_id, stok_sistem, stok_fisik } = item;

    // Insert ke audit_stok_detail
    await pool.query(
      `INSERT INTO audit_stok_detail (nota_id, barang_id, stok_sistem, stok_fisik, created_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [nota_id, barang_id, stok_sistem, stok_fisik, nowWIB]
    );

    // Update stok barang langsung sesuai stok fisik
    await pool.query(
      `UPDATE barang SET stok = $1, updated_at = $3 WHERE id = $2`,
      [stok_fisik, barang_id, nowWIB]
    );
  }
};

module.exports = { createStokAudit, createAuditDetail };
