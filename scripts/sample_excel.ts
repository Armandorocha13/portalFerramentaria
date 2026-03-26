import XLSX from 'xlsx';
import fs from 'fs';

const b = fs.readFileSync('ANIEL_Saldo Volante.xlsx');
const w = XLSX.read(b);
const s = w.Sheets[w.SheetNames[0]];
const d = XLSX.utils.sheet_to_json(s);

// Sample first 100 rows to see projects
const projects = new Set(d.map((r: any) => r['Projeto']));
console.log('Projects available:', Array.from(projects));

// Sample some RJ technicians (if any)
const rjRows = d.filter((r: any) => r['Projeto'] === 'RIO DE JANEIRO');
console.log('RJ records found:', rjRows.length);
if (rjRows.length > 0) {
    console.log('First RJ record:', rjRows[0]);
}

// Check for our known matricula 003292
const technicianMatch = d.filter((r: any) => r['Nº F.R.E.'] === '003292');
console.log('Records for 003292 found:', technicianMatch.length);
