const ExcelJS = require('exceljs');

function ensureHeader(ws, title, subtitle) {
  const lastColLetter = ws.getColumn(ws.columnCount).letter;

  ws.spliceRows(1, 0, [], []);
  ws.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' }
  };

  ws.mergeCells(`A2:${lastColLetter}2`);
  const subCell = ws.getCell('A2');
  subCell.value = subtitle || '';
  subCell.font = { italic: true, size: 11, color: { argb: 'FF333333' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  subCell.fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' }
  };

  ws.getRow(4).eachCell(cell => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  ws.views = [{ state: 'frozen', ySplit: 4 }];
  ws.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: ws.columnCount }
  };
}

function zebraAndBorders(ws, startRow) {
  ws.eachRow((row, rowNumber) => {
    if (rowNumber >= startRow) {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };

        const headerValue = ws.getRow(startRow - 1).getCell(colNumber).value?.toString().toLowerCase() || '';
        if (headerValue.includes('harga') || headerValue.includes('total')) {
          if (!isNaN(cell.value)) {
            cell.numFmt = '"Rp" #,##0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        }
      });

      if ((rowNumber - startRow) % 2 === 0) {
        row.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: 'FFF7F7F7' }
        };
      }
    }
  });

  ws.columns.forEach(col => {
    let maxLength = 0;
    col.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString() : '';
      maxLength = Math.max(maxLength, val.length);
    });
    col.width = Math.min(maxLength + 2, 50);
  });
}

module.exports = { ExcelJS, ensureHeader, zebraAndBorders };
