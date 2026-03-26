import XLSX from 'xlsx';
import fs from 'fs';

const b = fs.readFileSync('ANIEL_Saldo Volante.xlsx');
const w = XLSX.read(b);
const s = w.Sheets[w.SheetNames[0]];
const d: any[] = XLSX.utils.sheet_to_json(s);

const rjProjects = new Set(d.filter((r: any) => String(r['Projeto']).includes('RIO')).map(r => r['Projeto']));
console.log('RJ-related projects:', Array.from(rjProjects));

const rjCount = d.filter((r: any) => String(r['Projeto']).includes('RIO')).length;
console.log('Total RJ-related records:', rjCount);
