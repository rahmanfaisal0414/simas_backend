// utils/pdf.js
const PDFDocument = require('pdfkit');

function makeDoc(res, title, subtitle) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`
  );

  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  doc.pipe(res);

  // Judul
  doc.fontSize(18)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text(title.toUpperCase(), { align: 'center' });

  // Garis bawah judul
  doc.moveTo(36, doc.y + 2)
    .lineTo(doc.page.width - 36, doc.y + 2)
    .strokeColor('#000')
    .lineWidth(1)
    .stroke();

  // Subtitle
  if (subtitle) {
    doc.moveDown(0.5);
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#333')
      .text(subtitle, { align: 'center' });
  }
  doc.moveDown(1);

  return doc;
}

function drawTable(doc, headers, rows) {
  const margin = 36;
  const maxWidth = 523;
  let y = doc.y;
  const defaultRowHeight = 22;

  // Posisi awal tabel untuk konsistensi page break
  const tableStartY = y;

  // Hitung total lebar kolom & scale
  let totalWidth = headers.reduce((sum, h) => sum + h.width, 0);
  if (totalWidth > maxWidth) {
    const scaleFactor = maxWidth / totalWidth;
    headers.forEach(h => h.width = Math.floor(h.width * scaleFactor));
    totalWidth = maxWidth;
  }

  // Fungsi gambar header tabel
  function drawHeader() {
    let headerHeight = defaultRowHeight;
    headers.forEach(h => {
      const textHeight = doc.heightOfString(h.label, { width: h.width - 8 });
      headerHeight = Math.max(headerHeight, textHeight + 8);
    });

    // Background
    doc.rect(margin, y, totalWidth, headerHeight).fillColor('#2F5597').fill();

    // Teks header
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9);
    let x = margin;
    headers.forEach(h => {
      doc.text(h.label, x + 4, y + 4, { width: h.width - 8, align: h.align || 'left' });
      x += h.width;
    });

    y += headerHeight;
    doc.strokeColor('#000').lineWidth(0.5)
      .moveTo(margin, y).lineTo(margin + totalWidth, y).stroke();
  }

  // Gambar header pertama
  drawHeader();

  // Gambar baris data
  rows.forEach((row, rowIndex) => {
    // Format nilai
    headers.forEach(h => {
      let val = row[h.key] ?? '';
      if (h.format === 'number' && !isNaN(val))
        row[h.key] = Number(val).toLocaleString('id-ID');
      if (h.format === 'currency' && !isNaN(val))
        row[h.key] = `Rp ${Number(val).toLocaleString('id-ID')}`;
      if (h.format === 'date' && val)
        row[h.key] = new Date(val).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    });

    // Hitung tinggi baris
    let rowHeight = defaultRowHeight;
    headers.forEach(h => {
      const textHeight = doc.heightOfString(row[h.key]?.toString() || '', {
        width: h.width - 8
      });
      rowHeight = Math.max(rowHeight, textHeight + 6);
    });

    // Cek page break
    if (y + rowHeight > doc.page.height - margin) {
      doc.addPage();
      y = tableStartY; // mulai di posisi awal tabel
      drawHeader();
    }

    // Background striping (per halaman)
    if ((rowIndex % 2) === 0) {
      doc.rect(margin, y, totalWidth, rowHeight).fillColor('#f9f9f9').fill();
    }

    // Isi teks baris
    doc.fillColor('#000').font('Helvetica').fontSize(9);
    let x = margin;
    headers.forEach(h => {
      doc.text(row[h.key]?.toString() || '', x + 4, y + 4, {
        width: h.width - 8,
        align: h.align || 'left'
      });
      x += h.width;
    });

    // Garis bawah
    y += rowHeight;
    doc.strokeColor('#ccc').lineWidth(0.25)
      .moveTo(margin, y).lineTo(margin + totalWidth, y).stroke();

    // Garis vertikal (per baris, biar aman di page break)
    doc.strokeColor('#000').lineWidth(0.5);
    let colX = margin;
    headers.forEach(h => {
      doc.moveTo(colX, y - rowHeight)
        .lineTo(colX, y)
        .stroke();
      colX += h.width;
    });
    doc.moveTo(margin + totalWidth, y - rowHeight)
      .lineTo(margin + totalWidth, y)
      .stroke();
  });
}

module.exports = { makeDoc, drawTable };
