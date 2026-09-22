const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const ExcelJS = require('exceljs');
const { readXlsxRows } = require('../src/utils/spreadsheet-reader');

describe('XLSX reader', () => {
  test('preserves headers, dates, and calculated cell values', async () => {
    const filePath = path.join(os.tmpdir(), `insuredmine-${Date.now()}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Policies');
    sheet.addRow(['policy_number', 'firstname', 'policy_start_date', 'premium_amount']);
    sheet.addRow(['P-100', 'Jayesh', new Date(Date.UTC(2026, 8, 22)), 250]);
    sheet.getCell('D3').value = { formula: 'D2*2', result: 500 };

    await workbook.xlsx.writeFile(filePath);

    try {
      await expect(readXlsxRows(filePath)).resolves.toEqual([
        {
          policy_number: 'P-100',
          firstname: 'Jayesh',
          policy_start_date: new Date(Date.UTC(2026, 8, 22)),
          premium_amount: 250
        },
        {
          policy_number: '',
          firstname: '',
          policy_start_date: '',
          premium_amount: 500
        }
      ]);
    } finally {
      await fs.rm(filePath, { force: true });
    }
  });
});
