const { ExcelJS, ensureHeader, zebraAndBorders } = require('../utils/excel');
const { makeDoc, drawTable } = require('../utils/pdf');
const { _queryLaporanStok, _queryLaporanTransaksi } = require('./laporanController');

const fmtTanggal = (d) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(d));

const isEmptyData = (data) => !Array.isArray(data) || data.length === 0;

const removeColumnFormat = (columns) =>
  columns.map(({ format, ...rest }) => rest);

const formatTransactionType = (tipe) => {
  const value = String(tipe || '').toLowerCase();

  if (value === 'masuk' || value === 'in' || value === 'stock in') return 'Stock In';
  if (value === 'keluar' || value === 'out' || value === 'stock out') return 'Stock Out';

  return tipe || '-';
};

const formatRelation = (relasi) => {
  if (!relasi) return '-';

  return String(relasi)
    .replace(/\bPelanggan\b/gi, 'Customer')
    .replace(/\bPemasok\b/gi, 'Supplier');
};

/* ========================
   EXPORT STOCK - EXCEL
======================== */
async function exportLaporanStokExcel(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await _queryLaporanStok(startDate, endDate);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Stock Report', {
      properties: { defaultRowHeight: 18 }
    });

    ws.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Item Name', key: 'nama_barang', width: 30 },
      { header: 'Stock In', key: 'stok_masuk', width: 14 },
      { header: 'Stock Out', key: 'stok_keluar', width: 14 },
      { header: 'Audit', key: 'total_audit', width: 10 },
      { header: 'Remaining Stock', key: 'stok_sisa', width: 18 },
      { header: 'Minimum Stock', key: 'min_stok', width: 18 }
    ];

    ensureHeader(
      ws,
      'STOCK REPORT',
      startDate && endDate ? `Period: ${startDate} to ${endDate}` : 'All periods'
    );

    if (isEmptyData(data)) {
      ws.addRow({
        no: '-',
        nama_barang: 'No data available',
        stok_masuk: '-',
        stok_keluar: '-',
        total_audit: '-',
        stok_sisa: '-',
        min_stok: '-'
      });
    } else {
      data.forEach((r, i) => {
        ws.addRow({
          no: i + 1,
          nama_barang: r.nama_barang || '-',
          stok_masuk: r.stok_masuk ?? 0,
          stok_keluar: r.stok_keluar ?? 0,
          total_audit: r.total_audit ?? 0,
          stok_sisa: r.stok_sisa ?? 0,
          min_stok: r.min_stok ?? 0
        });
      });
    }

    zebraAndBorders(ws, 4);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=stock_report_${Date.now()}.xlsx`
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Failed to export stock Excel:', err);
    res.status(500).json({ message: 'Failed to export stock Excel' });
  }
}

/* ========================
   EXPORT STOCK - PDF
======================== */
async function exportLaporanStokPdf(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await _queryLaporanStok(startDate, endDate);

    const subtitle = startDate && endDate
      ? `Period: ${startDate} to ${endDate}`
      : 'All periods';

    const doc = makeDoc(res, 'STOCK REPORT', subtitle);

    const columns = [
      { label: 'No', key: 'no', width: 28, align: 'center' },
      { label: 'Item Name', key: 'nama_barang', width: 150 },
      { label: 'In', key: 'stok_masuk', width: 50, align: 'right', format: 'number' },
      { label: 'Out', key: 'stok_keluar', width: 50, align: 'right', format: 'number' },
      { label: 'Audit', key: 'total_audit', width: 40, align: 'right', format: 'number' },
      { label: 'Remaining', key: 'stok_sisa', width: 60, align: 'right', format: 'number' },
      { label: 'Min Stock', key: 'min_stok', width: 60, align: 'right', format: 'number' }
    ];

    const rows = isEmptyData(data)
      ? [{
          no: '-',
          nama_barang: 'No data available',
          stok_masuk: '-',
          stok_keluar: '-',
          total_audit: '-',
          stok_sisa: '-',
          min_stok: '-'
        }]
      : data.map((r, i) => ({
          no: i + 1,
          nama_barang: r.nama_barang || '-',
          stok_masuk: r.stok_masuk ?? 0,
          stok_keluar: r.stok_keluar ?? 0,
          total_audit: r.total_audit ?? 0,
          stok_sisa: r.stok_sisa ?? 0,
          min_stok: r.min_stok ?? 0
        }));

    drawTable(
      doc,
      isEmptyData(data) ? removeColumnFormat(columns) : columns,
      rows
    );

    doc.end();
  } catch (e) {
    console.error('Failed to export stock PDF:', e);
    res.status(500).json({ message: 'Failed to export stock PDF' });
  }
}

/* ========================
   EXPORT TRANSACTION - EXCEL
======================== */
async function exportLaporanTransaksiExcel(req, res) {
  try {
    const { startDate, endDate, tipe } = req.query;
    const data = await _queryLaporanTransaksi(startDate, endDate, tipe);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Transaction Report', {
      properties: { defaultRowHeight: 18 }
    });

    ws.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Type', key: 'tipe', width: 14 },
      { header: 'Date', key: 'tanggal', width: 22 },
      { header: 'Receipt No.', key: 'nota', width: 16 },
      { header: 'Relation', key: 'relasi', width: 28 },
      { header: 'Item Name', key: 'nama_barang', width: 30 },
      { header: 'Quantity', key: 'jumlah', width: 10 },
      { header: 'Unit Price', key: 'harga_satuan', width: 16 },
      { header: 'Amount', key: 'nominal', width: 18 }
    ];

    const subtitle = [
      startDate && endDate ? `Period: ${startDate} to ${endDate}` : 'All periods',
      tipe ? `Type: ${formatTransactionType(tipe)}` : null
    ].filter(Boolean).join(' | ');

    ensureHeader(ws, 'TRANSACTION REPORT', subtitle);

    if (isEmptyData(data)) {
      ws.addRow({
        no: '-',
        tipe: '-',
        tanggal: '-',
        nota: '-',
        relasi: '-',
        nama_barang: 'No data available',
        jumlah: '-',
        harga_satuan: '-',
        nominal: '-'
      });
    } else {
      data.forEach((r, i) => {
        ws.addRow({
          no: i + 1,
          tipe: formatTransactionType(r.tipe),
          tanggal: fmtTanggal(r.tanggal),
          nota: r.nota || '-',
          relasi: formatRelation(r.relasi),
          nama_barang: r.nama_barang || '-',
          jumlah: r.jumlah ?? 0,
          harga_satuan: Number(r.harga_satuan || 0),
          nominal: Number(r.nominal || 0)
        });
      });
    }

    zebraAndBorders(ws, 4);

    ws.getColumn('harga_satuan').numFmt = '"Rp" #,##0';
    ws.getColumn('nominal').numFmt = '"Rp" #,##0';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=transaction_report_${Date.now()}.xlsx`
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Failed to export transaction Excel:', error);
    res.status(500).json({ message: 'Failed to export transaction Excel' });
  }
}

/* ========================
   EXPORT TRANSACTION - PDF
======================== */
async function exportLaporanTransaksiPdf(req, res) {
  try {
    const { startDate, endDate, tipe } = req.query;
    const data = await _queryLaporanTransaksi(startDate, endDate, tipe);

    const subParts = [];
    if (startDate && endDate) subParts.push(`Period: ${startDate} to ${endDate}`);
    if (tipe) subParts.push(`Type: ${formatTransactionType(tipe)}`);

    const subtitle = subParts.join(' | ') || 'All periods';

    const doc = makeDoc(res, 'TRANSACTION REPORT', subtitle);

    const columns = [
      { label: 'No', key: 'no', width: 28, align: 'center' },
      { label: 'Type', key: 'tipe', width: 52 },
      { label: 'Date', key: 'tanggal', width: 88, format: 'date' },
      { label: 'Receipt', key: 'nota', width: 54 },
      { label: 'Relation', key: 'relasi', width: 90 },
      { label: 'Item Name', key: 'nama_barang', width: 100 },
      { label: 'Qty', key: 'jumlah', width: 40, align: 'right', format: 'number' },
      { label: 'Unit Price', key: 'harga_satuan', width: 70, align: 'right', format: 'currency' },
      { label: 'Amount', key: 'nominal', width: 70, align: 'right', format: 'currency' }
    ];

    const rows = isEmptyData(data)
      ? [{
          no: '-',
          tipe: '-',
          tanggal: '-',
          nota: '-',
          relasi: '-',
          nama_barang: 'No data available',
          jumlah: '-',
          harga_satuan: '-',
          nominal: '-'
        }]
      : data.map((r, i) => ({
          no: i + 1,
          tipe: formatTransactionType(r.tipe),
          tanggal: r.tanggal,
          nota: r.nota || '-',
          relasi: formatRelation(r.relasi),
          nama_barang: r.nama_barang || '-',
          jumlah: r.jumlah ?? 0,
          harga_satuan: r.harga_satuan ?? 0,
          nominal: r.nominal ?? 0
        }));

    drawTable(
      doc,
      isEmptyData(data) ? removeColumnFormat(columns) : columns,
      rows
    );

    doc.end();
  } catch (e) {
    console.error('Failed to export transaction PDF:', e);
    res.status(500).json({ message: 'Failed to export transaction PDF' });
  }
}

module.exports = {
  exportLaporanStokExcel,
  exportLaporanStokPdf,
  exportLaporanTransaksiExcel,
  exportLaporanTransaksiPdf
};