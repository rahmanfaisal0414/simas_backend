const { getAllPelanggan, createPelanggan, deletePelanggan, updatePelanggan } = require('../models/pelangganModel');

function isValidWhatsAppNumber(number) {
  // Hanya angka, mulai dengan 62, panjang 10-15 digit
  return /^62[0-9]{8,13}$/.test(number);
}

const getPelanggan = async (req, res) => {
  try {
    const data = await getAllPelanggan();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const addPelanggan = async (req, res) => {
  try {
    const { nama_pelanggan, kontak, alamat, catatan } = req.body;
    if (!nama_pelanggan) return res.status(400).json({ message: 'Nama wajib diisi' });
    if (!kontak || !isValidWhatsAppNumber(kontak)) {
      return res.status(400).json({ message: 'Nomor WhatsApp tidak valid. Gunakan format 62xxxxxxxxxx' });
    }

    const data = await createPelanggan(nama_pelanggan, kontak, alamat, catatan);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const removePelanggan = async (req, res) => {
  try {
    const { id } = req.params;
    await deletePelanggan(id);
    res.json({ message: 'Pelanggan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const editPelanggan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_pelanggan, kontak, alamat, catatan } = req.body;

    if (!nama_pelanggan) return res.status(400).json({ message: 'Nama wajib diisi' });
    if (!kontak || !isValidWhatsAppNumber(kontak)) {
      return res.status(400).json({ message: 'Nomor WhatsApp tidak valid. Gunakan format 62xxxxxxxxxx' });
    }

    const pelanggan = await updatePelanggan(id, nama_pelanggan, kontak, alamat, catatan);

    if (!pelanggan) {
      return res.status(404).json({ message: "Pelanggan tidak ditemukan" });
    }

    res.json(pelanggan);
  } catch (err) {
    console.error("Error update pelanggan:", err);
    res.status(500).json({ message: "Gagal update pelanggan" });
  }
};

module.exports = { getPelanggan, addPelanggan, removePelanggan, editPelanggan };
