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
  
      const forecastDays = Number(days) || 30;
  
      const barang = await getBarangInfoById(barangId);
      if (!barang) {
        return res.status(404).json({ message: 'Barang tidak ditemukan' });
      }
  
      const history = await getSalesHistoryByBarang(barangId);
      const values = history.map((item) => Number(item.qty_keluar));
  
      if (!values.length) {
        return res.status(400).json({
          message: 'Belum ada history penjualan untuk barang ini',
        });
      }
  
      const result = await callArimaForecast({
        values,
        steps: forecastDays,
        order: [Number(p), Number(d), Number(q)],
      });
  
      const forecastDaily = (result.forecast || []).map((n) => Number(n));
      const forecastTotal = forecastDaily.reduce((sum, n) => sum + n, 0);
  
      const currentStock = Number(barang.stok || 0);
      const safetyStock = Number(barang.min_stok || 0);
      const projectedStock = currentStock - forecastTotal;
  
      const recommendedReorder = Math.max(
        0,
        forecastTotal + safetyStock - currentStock
      );

      const averageDailyDemand = forecastDays > 0 ? forecastTotal / forecastDays : 0;
  
      const daysUntilStockout =
        averageDailyDemand > 0
          ? Math.floor(currentStock / averageDailyDemand)
          : null;

      let riskLevel = 'safe';
      let riskLabel = 'Safe';
  
      if (currentStock <= 0) {
        riskLevel = 'out_of_stock';
        riskLabel = 'Out of Stock';
      } else if (projectedStock <= 0) {
        riskLevel = 'stockout_risk';
        riskLabel = 'Stockout Risk';
      } else if (projectedStock <= safetyStock) {
        riskLevel = 'critical';
        riskLabel = 'Critical';
      } else if (projectedStock <= safetyStock * 2) {
        riskLevel = 'warning';
        riskLabel = 'Warning';
      }
  
      let insight = '';
  
      if (riskLevel === 'out_of_stock') {
        insight = 'This item is currently out of stock. Immediate restocking is required.';
      } else if (riskLevel === 'stockout_risk') {
        insight = `Current stock may not be enough for the next ${forecastDays} days. Reordering is recommended.`;
      } else if (riskLevel === 'critical') {
        insight = `Stock is predicted to fall near the minimum stock level within the next ${forecastDays} days.`;
      } else if (riskLevel === 'warning') {
        insight = `Stock is still available, but demand should be monitored closely.`;
      } else {
        insight = `Current stock is sufficient based on the predicted demand for the next ${forecastDays} days.`;
      }
  
      res.json({
        barang,
        method: result.method || 'ARIMA',
        order: [Number(p), Number(d), Number(q)],
        forecast_daily: forecastDaily,
        forecast_total: forecastTotal,
        current_stock: currentStock,
        safety_stock: safetyStock,
        projected_stock: projectedStock,
        recommended_reorder: recommendedReorder,
        risk_level: riskLevel,
        risk_label: riskLabel,
        days_until_stockout: daysUntilStockout,
        average_daily_demand: Math.round(averageDailyDemand),
        insight,
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