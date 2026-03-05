import XLSX from 'xlsx';
const workbook = XLSX.readFile('sup.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows: any[] = XLSX.utils.sheet_to_json(sheet);
console.log('Nomes das colunas encontradas:', Object.keys(rows[0] || {}));
console.log('Primeiras 5 linhas para amostragem:', rows.slice(0, 5));
