const ExcelJS = require('exceljs');
const { text } = require('./data');

async function readXlsxRows(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headers = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    headers[columnNumber] = text(cellValue(cell.value));
  });

  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (worksheetRow, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const row = {};
    headers.forEach((header, columnNumber) => {
      if (header) {
        row[header] = cellValue(worksheetRow.getCell(columnNumber).value);
      }
    });
    rows.push(row);
  });

  return rows;
}

function cellValue(value) {
  if (value && typeof value === 'object') {
    if ('result' in value) {
      return value.result ?? '';
    }
    if ('text' in value) {
      return value.text ?? '';
    }
  }

  return value ?? '';
}

module.exports = { readXlsxRows, cellValue };
