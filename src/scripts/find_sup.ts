import XLSX from 'xlsx';

const filePath = 'C:\\Users\\user\\Documents\\PBI\\BASE DADOS\\ANIEL\\QUERY\\CARGOS.xlsx';

async function findWithSupervisor() {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let headerIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].includes('Equipe') && rows[i].includes('Supervisor')) {
                headerIndex = i;
                break;
            }
        }

        const headers = rows[headerIndex];
        const data = rows.slice(headerIndex + 1);

        const colEquipe = headers.indexOf('Equipe');
        const colNome = headers.indexOf('Nome');
        const colCodSup = headers.indexOf('Cod. Supervisor');
        const colNomeSup = headers.indexOf('Supervisor');

        const examples = data.filter(row => row[colCodSup] && row[colCodSup] !== '0').slice(0, 10);
        console.log('Exemplos de técnicos COM supervisor:');
        console.log(examples.map(r => ({
            tecnico: r[colNome],
            tecnico_mat: r[colEquipe],
            supervisor: r[colNomeSup],
            supervisor_mat: r[colCodSup]
        })));

    } catch (err) {
        console.error(err);
    }
}

findWithSupervisor();
