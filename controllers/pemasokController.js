const { getAllPemasok, createPemasok, deletePemasok, updatePemasok } = require('../models/pemasokModel');

function isValidWhatsAppNumber(number) {
  return /^62[0-9]{8,13}$/.test(number);
}

const getPemasok = async (req, res) => {
  try {
    const data = await getAllPemasok();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const addPemasok = async (req, res) => {
  try {
    const { nama_pemasok, kontak, alamat, catatan } = req.body;
    if (!nama_pemasok) return res.status(400).json({ message: 'Nama wajib diisi' });
    if (!kontak || !isValidWhatsAppNumber(kontak)) {
      return res.status(400).json({ message: 'Nomor WhatsApp tidak valid. Gunakan format 62xxxxxxxxxx' });
    }

    const data = await createPemasok(nama_pemasok, kontak, alamat, catatan);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const editPemasok = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_pemasok, kontak, alamat, catatan } = req.body;

    if (!nama_pemasok) return res.status(400).json({ message: 'Nama wajib diisi' });
    if (!kontak || !isValidWhatsAppNumber(kontak)) {
      return res.status(400).json({ message: 'Nomor WhatsApp tidak valid. Gunakan format 62xxxxxxxxxx' });
    }

    const pemasok = await updatePemasok(id, nama_pemasok, kontak, alamat, catatan);

    if (!pemasok) {
      return res.status(404).json({ message: "Pemasok tidak ditemukan" });
    }

    res.json(pemasok);
  } catch (err) {
    console.error("Error update pemasok:", err);
    res.status(500).json({ message: "Gagal update pemasok" });
  }
};

const removePemasok = async (req, res) => {
  try {
    const { id } = req.params;
    await deletePemasok(id);
    res.json({ message: 'Pemasok berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getPemasok, addPemasok, removePemasok, editPemasok };
