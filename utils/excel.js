const ExcelJS = require('exceljs');

/**
 * Membuat header judul + subjudul + freeze header
 */
function ensureHeader(ws, title, subtitle) {
  const lastColLetter = ws.getColumn(ws.columnCount).letter;

  // Geser isi tabel ke bawah 2 baris
  ws.spliceRows(1, 0, [], []);

  // Judul
  ws.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' }
  };

  // Subjudul
  ws.mergeCells(`A2:${lastColLetter}2`);
  const subCell = ws.getCell('A2');
  subCell.value = subtitle || '';
  subCell.font = { italic: true, size: 11, color: { argb: 'FF333333' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  subCell.fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' }
  };

  // Style header tabel (row 4)
  ws.getRow(4).eachCell(cell => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  // Freeze pane di bawah header
  ws.views = [{ state: 'frozen', ySplit: 4 }];

  // Auto filter
  ws.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: ws.columnCount }
  };
}

/**
 * Memberikan border, zebra style, format harga, dan auto-fit kolom mulai dari startRow
 */
function zebraAndBorders(ws, startRow) {
  ws.eachRow((row, rowNumber) => {
    if (rowNumber >= startRow) {
      row.eachCell((cell, colNumber) => {
        // Border
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };

        // Format harga otomatis jika kolom mengandung kata "harga" atau "total"
        const headerValue = ws.getRow(startRow - 1).getCell(colNumber).value?.toString().toLowerCase() || '';
        if (headerValue.includes('harga') || headerValue.includes('total')) {
          if (!isNaN(cell.value)) {
            cell.numFmt = '"Rp" #,##0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        }
      });

      // Zebra striping
      if ((rowNumber - startRow) % 2 === 0) {
        row.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: 'FFF7F7F7' }
        };
      }
    }
  });

  // Auto-fit kolom
  ws.columns.forEach(col => {
    let maxLength = 0;
    col.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString() : '';
      maxLength = Math.max(maxLength, val.length);
    });
    col.width = Math.min(maxLength + 2, 50); // batas maksimal lebar
  });
}

module.exports = { ExcelJS, ensureHeader, zebraAndBorders };
