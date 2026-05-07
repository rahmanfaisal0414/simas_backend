const express = require('express');
const router = express.Router();
const {
    getHistoryByBarang,
    getForecastByBarang,
    getReorderRecommendation,
  } = require('../controllers/aiController');

router.get('/history/:barangId', getHistoryByBarang);
router.get('/forecast/:barangId', getForecastByBarang);
router.get('/reorder/:barangId', getReorderRecommendation);

module.exports = router;