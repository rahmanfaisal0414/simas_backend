const FormData = require("form-data");
const axios = require("axios");
const { createNotaStokKeluar, getNotaKeluarById, getAllNotaKeluar, deleteNotaKeluar } = require("../models/stokKeluarModel");
const { generateSig } = require("../utils/signature");

const addStokKeluar = async (req, res) => {
  try {
    const result = await createNotaStokKeluar(req.body);
    const notaId = result.id;
    const notaDetail = await getNotaKeluarById(notaId);

    const pelangganId = notaDetail.pelanggan_id;
    const pelangganNama = notaDetail.nama_pelanggan || "-";
    const pelangganNoWa = notaDetail.no_wa;
    const notaNomor = notaDetail.kode;
    const tanggal = notaDetail.tanggal;

    const formatRupiah = (value) =>
      new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

    const totalHarga = notaDetail.total;

    // 🔹 Generate signature pendek
    const sigNota = generateSig(notaId);
    const sigRiwayat = generateSig(pelangganId);

    // 🔹 Link publik
    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5000/public';
    const linkNota = `${baseUrl}/nota/${notaId}?sig=${sigNota}`;
    const linkRiwayat = `${baseUrl}/pelanggan/${pelangganId}?sig=${sigRiwayat}`;

    // 🔹 Format teks nota
    let notaText = `*TOKO BERKAH*\nJl. Seoekarno-Hatta, Pekanbaru\n`;
    notaText += `--------------------------------\n`;
    notaText += `*NOTA PEMBELIAN*\n`;
    notaText += `*No Nota*   : ${notaNomor}\n`;
    notaText += `*Tanggal*   : ${tanggal}\n`;
    notaText += `*Pelanggan* : ${pelangganNama}\n`;
    notaText += `--------------------------------\n`;
    notaText += `*Daftar Barang:*\n`;

    notaDetail.detail.forEach((item, idx) => {
      notaText += `${idx + 1}. *${item.nama_barang}*\n`;
      notaText += `   ${item.jumlah}x @ ${formatRupiah(item.harga_satuan)} = ${formatRupiah(item.total_harga)}\n`;
    });

    notaText += `--------------------------------\n`;
    notaText += `*Total Bayar*: *${formatRupiah(totalHarga)}*\n`;
    notaText += `--------------------------------\n\n`;
    
    notaText += `🧾 Lihat nota online:\n${linkNota}\n\n`; 
    notaText += `📜 Riwayat pembelian:\n${linkRiwayat}\n\n`; 
    
    notaText += `🙏 Terima kasih telah berbelanja di *Toko Berkah*.\n`;    

    // 🔹 Kirim WA
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
      message: "Stok keluar berhasil disimpan dan nota dikirim ke WA pelanggan (link pendek)"
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
