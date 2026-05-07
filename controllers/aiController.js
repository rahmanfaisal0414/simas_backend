const {
    getBarangInfoById,
    getSalesHistoryByBarang,
  } = require('../models/aiModel');
  
  const getHistoryByBarang = async (req, res) => {
    try {
      const { barangId } = req.params;
  
      const barang = await getBarangInfoById(barangId);
      if (!barang) {
        return res.status(404).json({ message: 'Barang tidak ditemukan' });
      }
  
      const history = await getSalesHistoryByBarang(barangId);
  
      const cleanHistory = history.map((item) => ({
        tanggal: item.tanggal,
        qty_keluar: Number(item.qty_keluar),
      }));
  
      res.json({
        barang,
        history: cleanHistory,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  module.exports = {
    getHistoryByBarang,
  };