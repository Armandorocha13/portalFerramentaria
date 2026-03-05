import XLSX from 'xlsx';

const filePath = 'C:\\Users\\user\\Documents\\PBI\\BASE DADOS\\ANIEL\\QUERY\\CARGOS.xlsx';

async function analyzeFile() {
    console.log('📂 Analisando arquivo CARGOS.xlsx...');

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
            console.error('❌ O arquivo está vazio.');
            return;
        }

        console.log(`🔍 Total de registros: ${rows.length}`);
        console.log('--- COLUNAS ENCONTRADAS ---');
        console.log(Object.keys(rows[0]));

        console.log('\n--- AMOSTRA DE DADOS (5 primeiros registros) ---');
        console.log(JSON.stringify(rows.slice(0, 5), null, 2));

    } catch (err) {
        console.error('❌ Erro ao ler o arquivo:', err);
    }
}

analyzeFile();
