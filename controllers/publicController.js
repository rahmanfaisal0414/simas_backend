const { getNotaKeluarById, getRiwayatPelanggan } = require('../models/stokKeluarModel');
const { generateSig } = require('../utils/signature');

async function renderNota(req, res) {
  const notaId = req.params.notaId;
  const nota = await getNotaKeluarById(notaId);

  if (!nota) {
    return res.status(404).send('Nota tidak ditemukan.');
  }

  const sigRiwayat = generateSig(nota.pelanggan_id);

  res.render('nota', {
    nota,
    sig: sigRiwayat
  });
}

async function renderRiwayat(req, res) {
  const pelangganId = req.params.pelangganId;
  const riwayatData = await getRiwayatPelanggan(pelangganId);

  const riwayat = riwayatData.map(item => ({
    ...item,
    sig: generateSig(pelangganId) 
  }));

  res.render('riwayat', { riwayat });
}

module.exports = {
  renderNota,
  renderRiwayat
};
