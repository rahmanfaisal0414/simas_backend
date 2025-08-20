const pool = require('../config/db');

const createStokAudit = async (user_id, catatan) => {
  const result = await pool.query(
    `INSERT INTO nota_audit_stok (user_id, catatan, tanggal) 
     VALUES ($1, $2, NOW()) 
     RETURNING id, nota, tanggal, created_at`,
    [user_id, catatan]
  );
  return result.rows[0];
};

const createAuditDetail = async (nota_id, detail) => {
  for (const item of detail) {
    const { barang_id, stok_sistem, stok_fisik } = item;

    await pool.query(
      `INSERT INTO audit_stok_detail (nota_id, barang_id, stok_sistem, stok_fisik)
       VALUES ($1, $2, $3, $4)`,
      [nota_id, barang_id, stok_sistem, stok_fisik]
    );
s
    await pool.query(
      `UPDATE barang SET stok = $1, updated_at = NOW() WHERE id = $2`,
      [stok_fisik, barang_id]
    );
  }
};

module.exports = { createStokAudit, createAuditDetail };
