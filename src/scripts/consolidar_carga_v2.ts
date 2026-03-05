import XLSX from 'xlsx';
import * as fs from 'fs';

const file21 = '21.xlsx';
const file41 = '41.xlsx';
const outputFile = 'carga_consolidada_limpa.csv';

function processFile(fileName: string, contrato: string) {
    const workbook = XLSX.readFile(fileName);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertemos para array de arrays (matriz) para manipular melhor o cabeçalho bagunçado
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Procuramos a linha que contém os cabeçalhos reais (ex: "Equipe", "Desc. Material", "Saldo")
    const headerRowIndex = rows.findIndex(row =>
        row.includes('Equipe') && row.includes('Desc. Material') && row.includes('Saldo')
    );

    if (headerRowIndex === -1) {
        console.error(`Não foi possível encontrar o cabeçalho no arquivo ${fileName}`);
        return [];
    }

    const headers = rows[headerRowIndex];
    const dataRows = rows.slice(headerRowIndex + 1);

    const formattedData = dataRows
        .filter(row => row.length > 0 && row[headers.indexOf('Equipe')] && row[headers.indexOf('Desc. Material')])
        .map(row => {
            return {
                contrato_origem: contrato,
                matricula_tecnico: row[headers.indexOf('Equipe')],
                nome_tecnico: row[headers.indexOf('Nome da Equipe')],
                codigo_material: row[headers.indexOf('Cd. Material')] || row[headers.indexOf('Cód. Material')],
                descricao_material: row[headers.indexOf('Desc. Material')],
                unidade: row[headers.indexOf('Unidade')],
                saldo: row[headers.indexOf('Saldo')],
                valor_total: row[headers.indexOf('Total R$')]
            };
        });

    return formattedData;
}

try {
    console.log('Iniciando consolidação avançada...');

    const data21 = processFile(file21, '21');
    const data41 = processFile(file41, '41');

    const consolidatedData = [...data21, ...data41];

    const worksheet = XLSX.utils.json_to_sheet(consolidatedData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    fs.writeFileSync(outputFile, csvContent);

    console.log(`Sucesso! Arquivo ${outputFile} gerado.`);
    console.log(`Total de registros: ${consolidatedData.length}`);
    console.log('Primeiro registro para conferência:', consolidatedData[0]);
} catch (error) {
    console.error('Erro ao processar arquivos:', error);
}
