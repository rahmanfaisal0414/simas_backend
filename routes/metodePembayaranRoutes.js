const express = require('express');
const router = express.Router();
const { getMetode, addMetode, removeMetode } = require('../controllers/metodePembayaranController');

router.get('/', getMetode);
router.post('/', addMetode);
router.delete('/:id', removeMetode);

module.exports = router;
