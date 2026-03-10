const XLSX = require('xlsx');
const path = require('path');

const filePath = 'c:\\Users\\user\\portalFerramentaria-1\\SITE.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    console.log('--- SHEETS ---');
    console.log(workbook.SheetNames);

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Obter as primeiras 5 linhas para análise
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: '' });

    console.log('--- HEADER AND SAMPLE (TOP 5 ROWS) ---');
    console.log(JSON.stringify(data.slice(0, 6), null, 2));

} catch (err) {
    console.error('Error reading the Excel file:', err);
}
