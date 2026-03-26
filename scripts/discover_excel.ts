import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const filePath = path.join(process.cwd(), 'ANIEL_Saldo Volante.xlsx');
const fileBuffer = fs.readFileSync(filePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

if (data.length > 0) {
    console.log('Columns:', JSON.stringify(data[0]));
    console.log('First row example:', JSON.stringify(data[1]));
} else {
    console.log('No data found in sheet.');
}
