import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const xlsx = require('xlsx');
import * as fs from 'fs';
import * as path from 'path';
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: VITE_SUPABASE_URL ou SERVICE_KEY não definidos no .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importData() {
    console.log("Iniciando Importação v2...");

    // 1. Ler arquivo de texto e criar mapa de supervisores
    const mapSupFornecidos = new Map();
    const txtPath = path.resolve(__dirname, 'data', 'supervisores_lista.txt');
    if (fs.existsSync(txtPath)) {
        const lines = fs.readFileSync(txtPath, 'utf8').split('\n').filter(Boolean);
        lines.forEach(l => {
            const p = l.split('\t');
            if (p.length >= 2) {
                const mat = p[0].trim();
                const nome = p[1].trim().toUpperCase();
                const perfil = p[2] ? p[2].trim() : 'SUPERVISOR JR';
                mapSupFornecidos.set(nome, { matricula: mat, nome, cargo: perfil });
            }
        });
        console.log(`Carregados ${mapSupFornecidos.size} supervisores da lista em texto.`);
    }

    // 2. Buscar supervisores atuais no banco de dados
    const { data: supsBanco } = await supabase.from('supervisores').select('*');
    const supsBancoAtuais = supsBanco || [];

    // 3. Ler arquivo Excel
    const filePath = path.resolve(__dirname, 'SITE.xlsx');
    if (!fs.existsSync(filePath)) {
        console.error(`ERRO: Arquivo ${filePath} não encontrado!`);
        return;
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Dados brutos
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    const dataRows = rawData.slice(1); // Pular cabeçalho (UF, matricula, nome, funcao, ...)

    const mapSupervisores = new Map();
    const arrayTecnicos = [];

    let faltantes = 0;

    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];

        // row[0] = UF
        // row[1] = matricula
        // row[2] = nome colaborador
        // row[3] = função
        // row[4] = departamento
        // row[5] = status
        // row[6] = supervisor

        const uf = String(row[0]).trim();
        const matriculaTec = String(row[1]).trim();
        const nomeTec = String(row[2]).trim();
        const funcao = String(row[3]).trim();
        const departamento = String(row[4]).trim();
        const status = String(row[5]).trim();
        const nomeSup = String(row[6]).trim().toUpperCase();

        if (!matriculaTec || !nomeTec) continue;

        // ----- Lógica do Supervisor -----
        let matSup = null;
        let nomeRealSup = nomeSup;

        if (nomeSup) {
            if (mapSupFornecidos.has(nomeSup)) {
                // Encontrou na lista fornecida pelo texto
                matSup = mapSupFornecidos.get(nomeSup).matricula;
            } else {
                // Não achou na lista, tenta achar no banco antigo pelo nome
                const noBanco = supsBancoAtuais.find(s => s.nome.toUpperCase() === nomeSup);
                if (noBanco) {
                    matSup = noBanco.matricula;
                } else {
                    // Novo supervisor que não tem matrícula em lugar nenhum
                    // Cria uma generica (ex: SUB001, SUB002)
                    faltantes++;
                    matSup = `GERADO-${faltantes}`;
                }
            }

            if (!mapSupervisores.has(matSup)) {
                mapSupervisores.set(matSup, {
                    matricula: matSup,
                    nome: nomeRealSup,
                    situacao: 'ATIVO',
                    senha: matSup // senha igual a matricula
                });
            }
        }

        // ----- Lógica do Técnico -----
        arrayTecnicos.push({
            matricula: matriculaTec,
            nome: nomeTec,
            regiao: uf,
            funcao: funcao,
            equipe: departamento,
            situacao: status,
            supervisor_matricula: matSup,
            // Populando as colunas de compatibilidade que já preparamos no Postgres
            cargo: funcao,
            setor: departamento,
            status: status.toLowerCase() === 'ativo' ? 'ativo' : 'inativo'
        });
    }

    const supervisoresInsert = Array.from(mapSupervisores.values());
    console.log(`Pronto para inserir/atualizar ${supervisoresInsert.length} supervisores únicos.`);
    console.log(`Pronto para inserir/atualizar ${arrayTecnicos.length} técnicos.`);

    console.log("Limpando dados antigos do banco...");
    await supabase.from('tecnicos').delete().not('matricula', 'is', null);
    await supabase.from('supervisores').delete().not('matricula', 'is', null);

    // Upsert Supervisores
    if (supervisoresInsert.length > 0) {
        const { error: supError } = await supabase
            .from('supervisores')
            .upsert(supervisoresInsert, { onConflict: 'matricula' });

        if (supError) {
            console.error("Erro ao inserir supervisores:", supError);
            return;
        }
        console.log("Supervisores inseridos/atualizados com sucesso!");
    }

    const arrayTecnicosUnique = Array.from(
        new Map(arrayTecnicos.map(t => [t.matricula, t])).values()
    );

    // Upsert Tecnicos
    if (arrayTecnicosUnique.length > 0) {
        const batchSize = 300;
        let successCount = 0;

        for (let i = 0; i < arrayTecnicosUnique.length; i += batchSize) {
            const batch = arrayTecnicosUnique.slice(i, i + batchSize);
            const { error: tecError } = await supabase
                .from('tecnicos')
                .upsert(batch, { onConflict: 'matricula' });

            if (tecError) {
                console.error(`Erro ao inserir lote técnico:`, tecError);
            } else {
                successCount += batch.length;
            }
        }
        console.log(`Total de ${successCount} técnicos inseridos/atualizados com sucesso baseados na nova planilha!`);
    }

    console.log("Processo concluído.");
}

importData();
