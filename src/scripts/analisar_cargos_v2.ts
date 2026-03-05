import XLSX from 'xlsx';

const filePath = 'C:\\Users\\user\\Documents\\PBI\\BASE DADOS\\ANIEL\\QUERY\\CARGOS.xlsx';

async function analyzeData() {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // A linha 1 (index 0) é o título do relatório ou lixo
        // A linha 2 (index 1) parece conter os cabeçalhos reais (conforme detectado no log anterior)
        // Na verdade, o XLSX.utils.sheet_to_json removeu o topo.
        // Vamos usar header: 1 para ler tudo como array.

        console.log('Primeiras 3 linhas (brutas):');
        console.log(rows.slice(0, 3));

        // Procurar onde está "Equipe" e "Supervisor"
        let headerIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].includes('Equipe') && rows[i].includes('Supervisor')) {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) {
            console.log('❌ Cabeçalho não encontrado!');
            return;
        }

        const headers = rows[headerIndex];
        const data = rows.slice(headerIndex + 1);

        const colEquipe = headers.indexOf('Equipe');
        const colNome = headers.indexOf('Nome');
        const colCodSup = headers.indexOf('Cod. Supervisor');
        const colNomeSup = headers.indexOf('Supervisor');
        const colFuncao = headers.indexOf('Função');
        const colSituacao = headers.indexOf('Situação');

        const supervisors = new Map<string, string>();
        const technicians: any[] = [];

        data.forEach(row => {
            if (!row[colEquipe]) return;

            const codSup = String(row[colCodSup] || '').trim();
            const nomeSup = String(row[colNomeSup] || '').trim();

            if (codSup && codSup !== '0' && codSup !== 'null') {
                supervisors.set(codSup, nomeSup);
            }

            technicians.push({
                matricula: String(row[colEquipe]).trim(),
                nome: String(row[colNome] || '').trim(),
                supervisor_matricula: codSup,
                funcao: String(row[colFuncao] || '').trim(),
                situacao: String(row[colSituacao] || '').trim()
            });
        });

        console.log(`✅ Total de técnicos: ${technicians.length}`);
        console.log(`✅ Total de supervisores identificados: ${supervisors.size}`);

        console.log('\nExemplo de Supervisores:');
        console.log(Array.from(supervisors.entries()).slice(0, 5));

        console.log('\nExemplo de Técnicos:');
        console.log(technicians.slice(0, 5));

    } catch (err) {
        console.error(err);
    }
}

analyzeData();
