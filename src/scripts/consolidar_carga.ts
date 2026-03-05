import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const file21 = '21.xlsx';
const file41 = '41.xlsx';
const outputFile = 'carga_consolidada.csv';

function processFile(fileName: string, contrato: string) {
    const workbook = XLSX.readFile(fileName);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    return data.map(row => ({
        ...row,
        contrato: contrato
    }));
}

try {
    console.log('Iniciando consolidação...');

    const data21 = processFile(file21, '21');
    const data41 = processFile(file41, '41');

    const consolidatedData = [...data21, ...data41];

    // Converte para CSV para facilitar o import no Supabase
    const worksheet = XLSX.utils.json_to_sheet(consolidatedData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    fs.writeFileSync(outputFile, csvContent);

    console.log(`Sucesso! Arquivo ${outputFile} gerado com ${consolidatedData.length} registros.`);
} catch (error) {
    console.error('Erro ao processar arquivos:', error);
}
