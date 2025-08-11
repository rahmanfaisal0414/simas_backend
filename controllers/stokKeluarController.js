const {
    createNotaStokKeluar,
    getAllNotaKeluar,
    getNotaKeluarById,
    deleteNotaKeluar
  } = require('../models/stokKeluarModel');
  
  const addStokKeluar = async (req, res) => {
    try {
      const result = await createNotaStokKeluar(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Gagal menyimpan stok keluar' });
    }
  };
  
  const getStokKeluarList = async (req, res) => {
    try {
      const result = await getAllNotaKeluar();
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  const getStokKeluarDetail = async (req, res) => {
    try {
      const result = await getNotaKeluarById(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  const deleteStokKeluar = async (req, res) => {
    try {
      const result = await deleteNotaKeluar(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  module.exports = {
    addStokKeluar,
    getStokKeluarList,
    getStokKeluarDetail,
    deleteStokKeluar
  };
  