const { ExcelJS, ensureHeader, zebraAndBorders } = require('../utils/excel');
const { makeDoc, drawTable } = require('../utils/pdf'); // pdf.js sudah pakai style baru
const { _queryLaporanStok, _queryLaporanTransaksi } = require('./laporanController');

const fmtTanggal = (d) => new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
}).format(new Date(d));

/* ========================
   EXPORT STOK - EXCEL (Revisi)
======================== */
async function exportLaporanStokExcel(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await _queryLaporanStok(startDate, endDate);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Laporan Stok', { properties: { defaultRowHeight: 18 } });

    ws.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Barang', key: 'nama_barang', width: 30 },
      { header: 'Stok Masuk', key: 'stok_masuk', width: 14 },
      { header: 'Stok Keluar', key: 'stok_keluar', width: 14 },
      { header: 'Audit', key: 'total_audit', width: 10 },
      { header: 'Stok Sisa', key: 'stok_sisa', width: 12 },
      { header: 'Min Stok', key: 'min_stok', width: 12 },
      { header: 'Harga Terakhir', key: 'harga_terakhir', width: 16 },
      { header: 'Total Harga', key: 'nilai_persediaan', width: 18 },
    ];

    ensureHeader(
      ws,
      'LAPORAN STOK',
      startDate && endDate ? `Periode: ${startDate} s/d ${endDate}` : 'Semua periode'
    );

    data.forEach((r, i) => {
      ws.addRow({
        no: i + 1,
        nama_barang: r.nama_barang,
        stok_masuk: r.stok_masuk ?? 0,
        stok_keluar: r.stok_keluar ?? 0,
        total_audit: r.total_audit ?? 0,
        stok_sisa: r.stok_sisa ?? 0,
        min_stok: r.min_stok ?? 0,
        harga_terakhir: Number(r.harga_terakhir ?? 0), // pastikan number
        nilai_persediaan: Number(r.nilai_persediaan ?? 0), // pastikan number
      });
    });

    zebraAndBorders(ws, 4);

    // Format rupiah untuk kolom harga
    ws.getColumn(8).numFmt = '"Rp" #,##0'; // harga_terakhir
    ws.getColumn(9).numFmt = '"Rp" #,##0'; // nilai_persediaan

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=laporan_stok_${Date.now()}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Gagal export Excel stok:', err);
    res.status(500).json({ message: 'Gagal export Excel stok' });
  }
}

/* ========================
   EXPORT STOK - PDF
======================== */
async function exportLaporanStokPdf(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await _queryLaporanStok(startDate, endDate);

    const subtitle = startDate && endDate
      ? `Periode: ${startDate} s/d ${endDate}`
      : 'Semua periode';

    const doc = makeDoc(res, 'LAPORAN STOK', subtitle);

    drawTable(doc, [
      { label: 'No', key: 'no', width: 28, align: 'center' },
      { label: 'Nama Barang', key: 'nama_barang', width: 150 },
      { label: 'Masuk', key: 'stok_masuk', width: 50, align: 'right', format: 'number' },
      { label: 'Keluar', key: 'stok_keluar', width: 50, align: 'right', format: 'number' },
      { label: 'Audit', key: 'total_audit', width: 40, align: 'right', format: 'number' },
      { label: 'Sisa', key: 'stok_sisa', width: 50, align: 'right', format: 'number' },
      { label: 'Min Stok', key: 'min_stok', width: 50, align: 'right', format: 'number' },
      { label: 'Harga Terakhir', key: 'harga_terakhir', width: 70, align: 'right', format: 'currency' },
      { label: 'Total Harga', key: 'nilai_persediaan', width: 80, align: 'right', format: 'currency' },
    ], data.map((r, i) => ({
      no: i + 1,
      nama_barang: r.nama_barang,
      stok_masuk: r.stok_masuk ?? 0,
      stok_keluar: r.stok_keluar ?? 0,
      total_audit: r.total_audit ?? 0,
      stok_sisa: r.stok_sisa ?? 0,
      min_stok: r.min_stok ?? 0,
      harga_terakhir: r.harga_terakhir ?? 0,
      nilai_persediaan: r.nilai_persediaan ?? 0,
    })));

    doc.end();
  } catch (e) {
    console.error('Gagal export PDF stok:', e);
    res.status(500).json({ message: 'Gagal export PDF stok' });
  }
}

/* ========================
   EXPORT TRANSAKSI - EXCEL (Revisi)
======================== */
async function exportLaporanTransaksiExcel(req, res) {
  try {
    const { startDate, endDate, tipe } = req.query;
    const data = await _queryLaporanTransaksi(startDate, endDate, tipe);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Laporan Transaksi', {
      properties: { defaultRowHeight: 18 }
    });

    // Definisi kolom
    ws.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tipe', key: 'tipe', width: 10 },
      { header: 'Tanggal', key: 'tanggal', width: 22 },
      { header: 'Nota', key: 'nota', width: 16 },
      { header: 'Relasi', key: 'relasi', width: 28 },
      { header: 'Nama Barang', key: 'nama_barang', width: 30 },
      { header: 'Jumlah', key: 'jumlah', width: 10 },
      { header: 'Harga Satuan', key: 'harga_satuan', width: 16 },
      { header: 'Nominal', key: 'nominal', width: 18 }
    ];

    // Subjudul laporan
    const subtitle = [
      startDate && endDate ? `Periode: ${startDate} s/d ${endDate}` : 'Semua Periode',
      tipe ? `Tipe: ${tipe}` : null
    ].filter(Boolean).join(' | ');

    // Tambahkan header & subheader
    ensureHeader(ws, 'LAPORAN TRANSAKSI', subtitle);

    // Isi data
    data.forEach((r, i) => {
      ws.addRow({
        no: i + 1,
        tipe: r.tipe,
        tanggal: fmtTanggal(r.tanggal),
        nota: r.nota,
        relasi: r.relasi || '-',
        nama_barang: r.nama_barang,
        jumlah: r.jumlah,
        harga_satuan: Number(r.harga_satuan || 0), // pastikan number agar format harga jalan
        nominal: Number(r.nominal || 0)
      });
    });

    // Style tabel & format harga
    zebraAndBorders(ws, 4);

    // Format harga otomatis (kolom harga_satuan dan nominal)
    ws.getColumn('harga_satuan').numFmt = '"Rp" #,##0';
    ws.getColumn('nominal').numFmt = '"Rp" #,##0';

    // Kirim file ke client
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=laporan_transaksi_${Date.now()}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Gagal export laporan transaksi:', error);
    res.status(500).json({ error: 'Gagal export laporan transaksi' });
  }
}
  
  async function exportLaporanTransaksiPdf(req, res) {
    try {
      const { startDate, endDate, tipe } = req.query;
      const data = await _queryLaporanTransaksi(startDate, endDate, tipe);
  
      const subParts = [];
      if (startDate && endDate) subParts.push(`Periode: ${startDate} s/d ${endDate}`);
      if (tipe) subParts.push(`Tipe: ${tipe}`);
      const subtitle = subParts.join('  |  ') || 'Semua periode';
  
      const doc = makeDoc(res, 'LAPORAN TRANSAKSI', subtitle);
  
      drawTable(doc, [
        { label: 'No', key: 'no', width: 28, align: 'center' },
        { label: 'Tipe', key: 'tipe', width: 38 },
        { label: 'Tanggal', key: 'tanggal', width: 88, format: 'date' },
        { label: 'Nota', key: 'nota', width: 54 },
        { label: 'Relasi', key: 'relasi', width: 100 },
        { label: 'Nama Barang', key: 'nama_barang', width: 100 },
        { label: 'Jumlah', key: 'jumlah', width: 48, align: 'right', format: 'number' },
        { label: 'Harga Satuan', key: 'harga_satuan', width: 70, align: 'right', format: 'currency' },
        { label: 'Nominal', key: 'nominal', width: 70, align: 'right', format: 'currency' },
      ], data.map((r, i) => ({
        no: i + 1,
        tipe: r.tipe,
        tanggal: r.tanggal,
        nota: r.nota || '-',
        relasi: r.relasi || '-',
        nama_barang: r.nama_barang,
        jumlah: r.jumlah ?? 0,
        harga_satuan: r.harga_satuan ?? 0,
        nominal: r.nominal ?? 0,
      })));
  
      doc.end();
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Gagal export PDF transaksi' });
    }
  }
  
    

module.exports = {
  exportLaporanStokExcel,
  exportLaporanStokPdf,
  exportLaporanTransaksiExcel,
  exportLaporanTransaksiPdf
};
