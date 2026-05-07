const express = require('express');
const router = express.Router();
const { getHistoryByBarang } = require('../controllers/aiController');

router.get('/history/:barangId', getHistoryByBarang);

module.exports = router;