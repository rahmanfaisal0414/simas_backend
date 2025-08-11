const { createStokAudit, createAuditDetail } = require('../models/stokAuditModel');

const tambahStokAudit = async (req, res) => {
  try {
    const { user_id, catatan, barang } = req.body;
    if (!user_id || !barang || !Array.isArray(barang)) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    const nota = await createStokAudit(user_id, catatan || '');
    await createAuditDetail(nota.id, barang);

    res.status(201).json({ message: 'Audit stok berhasil disimpan dan stok diperbarui' });
  } catch (error) {
    console.error('Error tambah audit:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat audit stok' });
  }
};

module.exports = { tambahStokAudit };
