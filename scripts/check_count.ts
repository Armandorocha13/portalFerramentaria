import XLSX from 'xlsx';
import fs from 'fs';

const b = fs.readFileSync('ANIEL_Saldo Volante.xlsx');
const w = XLSX.read(b);
const s = w.Sheets[w.SheetNames[0]];
const d = XLSX.utils.sheet_to_json(s);
console.log('Rows count:', d.length);
console.log('Unique Technicians:', new Set(d.map((r: any) => r['Nº F.R.E.'])).size);
