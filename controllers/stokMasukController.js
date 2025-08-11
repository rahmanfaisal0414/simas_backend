const {
    createNotaStokMasuk,
    getAllNota,
    getNotaById,
    deleteNota
  } = require('../models/stokMasukModel');
  
  const addStokMasuk = async (req, res) => {
    try {
      const result = await createNotaStokMasuk(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Gagal menyimpan stok masuk' });
    }
  };
  
  const getStokMasukList = async (req, res) => {
    try {
      const result = await getAllNota();
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  const getStokMasukDetail = async (req, res) => {
    try {
      const result = await getNotaById(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  const deleteStokMasuk = async (req, res) => {
    try {
      const result = await deleteNota(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  module.exports = {
    addStokMasuk,
    getStokMasukList,
    getStokMasukDetail,
    deleteStokMasuk
  };
  