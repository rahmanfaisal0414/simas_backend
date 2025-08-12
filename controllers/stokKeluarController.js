const FormData = require("form-data");
const axios = require("axios");
const {
  createNotaStokKeluar,
  getAllNotaKeluar,
  getNotaKeluarById,
  deleteNotaKeluar
} = require("../models/stokKeluarModel");

const addStokKeluar = async (req, res) => {
  try {
    // 1️⃣ Simpan stok keluar
    const result = await createNotaStokKeluar(req.body);
    const notaId = result.id;
    const notaDetail = await getNotaKeluarById(notaId);

    const pelangganNama = notaDetail.nota.nama_pelanggan || "-";
    const pelangganNoWa = notaDetail.nota.no_wa; // format: 628xxxx
    const notaNomor = notaDetail.nota.nota;
    const tanggal = notaDetail.nota.created_at;

    const totalHarga = notaDetail.detail.reduce(
      (sum, b) => sum + Number(b.total_harga),
      0
    );

    // 2️⃣ Buat teks nota rapi
    let notaText = `*Toko Berkah*\nJl. Contoh No. 123, Padang\n`;
    notaText += `=============================\n`;
    notaText += `*NOTA PEMBELIAN*\n`;
    notaText += `No Nota : ${notaNomor}\n`;
    notaText += `Tanggal : ${new Date(tanggal).toLocaleString("id-ID")}\n`;
    notaText += `Pelanggan : ${pelangganNama}\n`;
    notaText += `=============================\n`;
    notaText += `*Daftar Barang:*\n`;

    notaDetail.detail.forEach((item, idx) => {
      notaText += `${idx + 1}. ${item.nama_barang}\n`;
      notaText += `   x${item.jumlah} @ Rp${item.harga_satuan.toLocaleString("id-ID")}\n`;
      notaText += `   = Rp${item.total_harga.toLocaleString("id-ID")}\n`;
    });

    notaText += `=============================\n`;
    notaText += `*Total:* Rp${totalHarga.toLocaleString("id-ID")}\n`;
    notaText += `=============================\n`;
    notaText += `Terima kasih telah berbelanja di Toko Berkah!`;

    // 3️⃣ Kirim pesan teks via Fonnte
    if (pelangganNoWa) {
      const formData = new FormData();
      formData.append("target", pelangganNoWa);
      formData.append("message", notaText);

      await axios.post("https://api.fonnte.com/send", formData, {
        headers: {
          Authorization: process.env.FONNTE_TOKEN,
          ...formData.getHeaders()
        }
      });
    }

    res.status(201).json({
      ...result,
      message: "Stok keluar berhasil disimpan dan nota dikirim ke WA pelanggan (teks)"
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Gagal menyimpan stok keluar" });
  }
};

const getStokKeluarList = async (req, res) => {
  try {
    const result = await getAllNotaKeluar();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStokKeluarDetail = async (req, res) => {
  try {
    const result = await getNotaKeluarById(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteStokKeluar = async (req, res) => {
  try {
    const result = await deleteNotaKeluar(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addStokKeluar,
  getStokKeluarList,
  getStokKeluarDetail,
  deleteStokKeluar
};
