const {
    getBarangInfoById,
    getSalesHistoryByBarang,
  } = require('../models/aiModel');
const { callArimaForecast } = require('../services/arimaClient');


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

  const getForecastByBarang = async (req, res) => {
    try {
      const { barangId } = req.params;
      const { days = 7, p = 1, d = 1, q = 1 } = req.query;
  
      const barang = await getBarangInfoById(barangId);
      if (!barang) {
        return res.status(404).json({ message: 'Barang tidak ditemukan' });
      }
  
      const history = await getSalesHistoryByBarang(barangId);
  
      const values = history.map((item) => Number(item.qty_keluar));
  
      if (!values.length) {
        return res.status(400).json({ message: 'Belum ada history penjualan untuk barang ini' });
      }
  
      const result = await callArimaForecast({
        values,
        steps: Number(days),
        order: [Number(p), Number(d), Number(q)],
      });
  
      const forecastDaily = (result.forecast || []).map((n) => Number(n));
      const forecastTotal = forecastDaily.reduce((sum, n) => sum + n, 0);
  
      res.json({
        barang,
        method: result.method || 'ARIMA',
        order: [Number(p), Number(d), Number(q)],
        input_series: values,
        forecast_daily: forecastDaily,
        forecast_total: forecastTotal,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  const getReorderRecommendation = async (req, res) => {
    try {
      const { barangId } = req.params;
      const { days = 30, p = 1, d = 1, q = 1 } = req.query;
  
      const barang = await getBarangInfoById(barangId);
      if (!barang) {
        return res.status(404).json({ message: 'Barang tidak ditemukan' });
      }
  
      const history = await getSalesHistoryByBarang(barangId);
      const values = history.map((item) => Number(item.qty_keluar));
  
      if (!values.length) {
        return res.status(400).json({ message: 'Belum ada history penjualan untuk barang ini' });
      }
  
      const result = await callArimaForecast({
        values,
        steps: Number(days),
        order: [Number(p), Number(d), Number(q)],
      });
  
      const forecastDaily = (result.forecast || []).map((n) => Number(n));
      const forecastTotal = forecastDaily.reduce((sum, n) => sum + n, 0);
  
      const currentStock = Number(barang.stok || 0);
      const safetyStock = Number(barang.min_stok || 0);
      const recommendedReorder = Math.max(0, forecastTotal + safetyStock - currentStock);
  
      let riskLevel = 'aman';
      if (currentStock <= 0) riskLevel = 'habis';
      else if (currentStock <= safetyStock) riskLevel = 'kritis';
      else if (currentStock <= safetyStock * 2) riskLevel = 'waspada';
  
      res.json({
        barang,
        method: result.method || 'ARIMA',
        order: [Number(p), Number(d), Number(q)],
        forecast_daily: forecastDaily,
        forecast_total: forecastTotal,
        current_stock: currentStock,
        safety_stock: safetyStock,
        recommended_reorder: recommendedReorder,
        risk_level: riskLevel,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  module.exports = {
    getHistoryByBarang,
    getReorderRecommendation,
    getForecastByBarang
  };