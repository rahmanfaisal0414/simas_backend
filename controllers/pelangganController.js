const { getAllPelanggan, createPelanggan, deletePelanggan, updatePelanggan } = require('../models/pelangganModel');

function normalizeWhatsAppNumber(number) {
  if (!number) return "";

  return String(number)
    .trim()
    .replace(/[^\d]/g, "");
}

function isValidWhatsAppNumber(number) {
  const clean = normalizeWhatsAppNumber(number);
  return /^[1-9][0-9]{9,14}$/.test(clean);
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
    let { nama_pelanggan, kontak, alamat, catatan } = req.body;
      kontak = normalizeWhatsAppNumber(kontak);
    if (!nama_pelanggan) return res.status(400).json({ message: 'Nama wajib diisi' });
    if (!kontak || !isValidWhatsAppNumber(kontak)) {
      return res.status(400).json({ 
        message: 'Nomor WhatsApp tidak valid. Gunakan format kode negara, contoh 601123456789 atau 628123456789' 
      });
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
    let { nama_pelanggan, kontak, alamat, catatan } = req.body;
      kontak = normalizeWhatsAppNumber(kontak);

    if (!nama_pelanggan) return res.status(400).json({ message: 'Nama wajib diisi' });
    if (!kontak || !isValidWhatsAppNumber(kontak)) {
      return res.status(400).json({ 
        message: 'Nomor WhatsApp tidak valid. Gunakan format kode negara, contoh 601123456789 atau 628123456789' 
      });
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
