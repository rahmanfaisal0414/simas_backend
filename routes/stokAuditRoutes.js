const express = require('express');
const router = express.Router();
const { tambahStokAudit } = require('../controllers/stokAuditController');

router.post('/', tambahStokAudit);

module.exports = router;
