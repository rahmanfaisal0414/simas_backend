const express = require('express');
const router = express.Router();
const { getPemasok, addPemasok, removePemasok, editPemasok } = require('../controllers/pemasokController');

router.get('/', getPemasok);
router.post('/', addPemasok);
router.delete('/:id', removePemasok);
router.put('/:id', editPemasok);

module.exports = router;
