import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const xlsx = require('xlsx');
import * as fs from 'fs';
import * as path from 'path';

// Carrega as variáveis de ambiente baseadas no aquivo .env
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos no .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importData() {
    const filePath = path.resolve(__dirname, 'SITE.xlsx');
    console.log(`Lendo o arquivo Excel: ${filePath}...`);

    if (!fs.existsSync(filePath)) {
        console.error(`ERRO: Arquivo ${filePath} não encontrado!`);
        return;
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = 'SINAPSE'; // Nome da aba onde os dados estão
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
        console.error(`ERRO: Aba '${sheetName}' não encontrada no arquivo.`);
        return;
    }

    // Pegar dados como matriz
    // A linha 1 (índice 0) contém o título: "LISTAGEM DE EQUIPES CADASTRADAS"
    // A linha 2 (índice 1) contém os cabecalhos
    // A linha 3 (índice 2) em diante contém os dados
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: '' });

    // Vamos pular as duas primeiras linhas
    const dataRows = rawData.slice(2);

    const mapSupervisores = new Map();
    const arrayTecnicos = [];

    console.log("Processando dados das linhas...");

    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];

        // Ignorar linhas vazias
        if (!row[0] && !row[1] && !row[10]) continue;

        const matriculaTecnico = String(row[10]).trim(); // Nº FRE
        if (!matriculaTecnico) continue;

        const codSupervisor = String(row[4]).trim();
        const nomeSupervisor = String(row[5]).trim();

        // Mapear supervisores únicos
        if (codSupervisor && nomeSupervisor) {
            if (!mapSupervisores.has(codSupervisor)) {
                mapSupervisores.set(codSupervisor, {
                    matricula: codSupervisor,
                    nome: nomeSupervisor,
                    situacao: 'ATIVO', // Default, já que a planilha não tem situação específica do supervisor
                });
            }
        }

        // Preparar objeto do técnico
        arrayTecnicos.push({
            equipe: String(row[0]).trim(),
            nome: String(row[1]).trim(),
            codigo_perfil: String(row[2]).trim(),
            perfil: String(row[3]).trim(),
            supervisor_matricula: codSupervisor || null,
            cod_fornec: String(row[6]).trim(),
            contrato: String(row[7]).trim(),
            regiao: String(row[8]).trim(),
            data_encerramento: String(row[9]).trim(),
            matricula: matriculaTecnico,
            funcao: String(row[11]).trim(),
            cpf: String(row[12]).trim(),
            data_admissao: String(row[13]).trim(),
            data_demissao: String(row[14]).trim(),
            situacao: String(row[15]).trim(),
            mobile_habilitado: String(row[16]).trim()
        });
    }

    const supervisoresInsert = Array.from(mapSupervisores.values());

    console.log(`Encontrados ${supervisoresInsert.length} supervisores únicos.`);
    console.log(`Encontrados ${arrayTecnicos.length} técnicos.`);

    // Inserir Supervisores
    if (supervisoresInsert.length > 0) {
        console.log("Inserindo supervisores no banco de dados...");
        const { error: supError } = await supabase
            .from('supervisores')
            .upsert(supervisoresInsert, { onConflict: 'matricula' });

        if (supError) {
            console.error("Erro ao inserir supervisores:", supError);
            return;
        }
        console.log("Supervisores inseridos com sucesso!");
    }

    if (arrayTecnicos.length > 0) {
        console.log("Inserindo técnicos no banco de dados...");

        // O Supabase tem um limite de tamanho do payload nas requests. 
        // É bom fazermos o insert em batches (lotes).
        const batchSize = 500;
        let successCount = 0;

        for (let i = 0; i < arrayTecnicos.length; i += batchSize) {
            const batch = arrayTecnicos.slice(i, i + batchSize);
            console.log(`Inserindo lote ${i / batchSize + 1}...`);

            const { error: tecError } = await supabase
                .from('tecnicos')
                .upsert(batch, { onConflict: 'matricula' });

            if (tecError) {
                console.error(`Erro ao inserir lote técnico ${i / batchSize + 1}:`, tecError);
            } else {
                successCount += batch.length;
            }
        }

        console.log(`Total de ${successCount} técnicos inseridos/atualizados com sucesso!`);
    }

    console.log("Processo concluído.");
}

importData();
