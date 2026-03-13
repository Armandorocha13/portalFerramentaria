
const xlsx = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\user\\Desktop\\planilhas\\SALDO VOLANTE.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log('--- INSPEÇÃO DE PLANILHA ---');
console.log('Pasta:', sheetName);
console.log('Total de linhas:', data.length);
console.log('\nCabeçalhos (Linhas 1-10):');
data.slice(0, 10).forEach((row, i) => {
    console.log(`L${i + 1}:`, row.slice(0, 25).join(' | '));
});
