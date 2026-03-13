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
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function importFinal() {
    console.log("Iniciando Importação Definitiva...");

    // 1. Mapeamento Geral de Equipes (EQUIPES.xlsx)
    // Precisamos ler este arquivo primeiro para ter as matrículas corretas de todos (inclusive supervisores)
    const wbEquipes = xlsx.readFile('BaseDeDados/EQUIPES.xlsx');
    const dbEquipes = xlsx.utils.sheet_to_json(wbEquipes.Sheets['SINAPSE'], { header: 1, defval: '' }).slice(1);

    // Mapa universal de NOME -> MATRICULA (da coluna A)
    const mapGeralNomesMatriculas = new Map();
    const mapEquipesInfo = new Map();

    dbEquipes.forEach(r => {
        const matriculaCorreta = String(r[0]).trim();
        const nome = String(r[1]).trim().toUpperCase();
        if (!nome) return;

        mapGeralNomesMatriculas.set(nome, matriculaCorreta);

        if (!mapEquipesInfo.has(nome) || (r[10] && !mapEquipesInfo.get(nome).matricula)) {
            mapEquipesInfo.set(nome, {
                matricula: String(r[10]).trim() || matriculaCorreta,
                codSup: String(r[4]).trim()
            });
        }
    });

    console.log(`- ${mapGeralNomesMatriculas.size} Nomes mapeados do EQUIPES.xlsx.`);

    // 2. Mapa de Supervisores
    const mapSupsByMatricula = new Map();
    const mapSupsByName = new Map();

    const txtPath = path.resolve(__dirname, 'data', 'supervisores_lista.txt');
    if (fs.existsSync(txtPath)) {
        const lines = fs.readFileSync(txtPath, 'utf8').split('\n').filter(Boolean);
        lines.forEach(l => {
            const p = l.split('\t');
            if (p.length >= 2) {
                const nomeRaw = p[1].trim();
                const nomeUpper = nomeRaw.toUpperCase();

                // Pega a matrícula do EQUIPES.xlsx (coluna A) em vez do arquivo de texto
                const matCorreta = mapGeralNomesMatriculas.get(nomeUpper) || p[0].trim(); // Fallback pro texto se não achar

                const obj = {
                    matricula: matCorreta,
                    nome: nomeRaw,
                    situacao: 'ATIVO',
                    senha: matCorreta
                };
                mapSupsByMatricula.set(matCorreta, obj);
                mapSupsByName.set(nomeUpper, obj);
            }
        });
    }

    // Garantir supervisor padrão 000000
    if (!mapSupsByMatricula.has('000000')) {
        const def = { matricula: '000000', nome: 'SUPERVISOR DESCONHECIDO', situacao: 'INATIVO', senha: '000' };
        mapSupsByMatricula.set('000000', def);
        mapSupsByName.set('DESCONHECIDO', def);
    }
    console.log(`- ${mapSupsByMatricula.size} Supervisores mapeados de acordo com EQUIPES.xlsx.`);

    // 3. Processar FORCA.xlsx
    const wbForca = xlsx.readFile('BaseDeDados/FORCA.xlsx');
    const dbForca = xlsx.utils.sheet_to_json(wbForca.Sheets['Planilha1'], { header: 1, defval: '' }).slice(1);

    const tecnicosFinal = [];
    const syncMap = new Map(); // Para sincronizar a carga depois

    dbForca.forEach(r => {
        const uf = r[0];
        const nome = String(r[1]).trim();
        const funcao = r[2];
        const departamento = r[3];
        const status = r[4];
        const nomeSup = String(r[5]).trim().toUpperCase();

        if (!nome) return;

        // Pega a matrícula do técnico da coluna A do EQUIPES.xlsx (via nosso mapa de nomes)
        const matricula = mapGeralNomesMatriculas.get(nome.toUpperCase()) || `GEN-${tecnicosFinal.length}`;

        // Determinar supervisor matricula
        let matSup = mapSupsByName.get(nomeSup)?.matricula;

        // Se não achou na lista oficial, tenta no mapa geral (coluna A do EQUIPES.xlsx)
        if (!matSup && nomeSup && nomeSup !== 'ETN' && nomeSup !== 'AFASTADO INSS') {
            matSup = mapGeralNomesMatriculas.get(nomeSup);

            // Se achou no mapa geral, vamos adicionar esse supervisor para não dar erro de FK
            if (matSup && !mapSupsByMatricula.has(matSup)) {
                const newSup = {
                    matricula: matSup,
                    nome: r[5].trim(), // Nome original do FORCA.xlsx
                    situacao: 'ATIVO',
                    senha: matSup
                };
                mapSupsByMatricula.set(matSup, newSup);
                mapSupsByName.set(nomeSup, newSup);
            }
        }

        // Fallback: se ainda não tiver matricula de supervisor, usa o codSup do EQUIPES ou 000000
        if (!matSup) {
            matSup = mapEquipesInfo.get(nome.toUpperCase())?.codSup || '000000';
        }

        // Se a matSup final ainda não estiver no nosso mapa, volta pro 000000
        if (matSup !== '000000' && !mapSupsByMatricula.has(matSup)) {
            matSup = '000000';
        }

        tecnicosFinal.push({
            matricula,
            nome,
            regiao: uf,
            funcao,
            equipe: departamento,
            situacao: 'ATIVO',
            supervisor_matricula: matSup,
            cargo: funcao,
            setor: departamento,
            status: 'ativo'
        });
        syncMap.set(nome.toUpperCase(), matricula);
    });

    // Limpeza de tabelas (Ordem importa por causa das FKs)
    console.log("Limpando dados técnicos e supervisores...");
    await supabase.from('tecnicos').delete().not('matricula', 'is', null);
    await supabase.from('supervisores').delete().not('matricula', 'is', null);

    // Inserir Supervisores Primeiro
    const supsArray = Array.from(mapSupsByMatricula.values());
    console.log(`Inserindo ${supsArray.length} supervisores...`);
    const { error: errS } = await supabase.from('supervisores').insert(supsArray);
    if (errS) {
        console.error("Erro crítico ao inserir supervisores:", errS);
        return;
    }

    // Inserir Técnicos
    const tecsArray = Array.from(new Map(tecnicosFinal.map(t => [t.matricula, t])).values());
    console.log(`Inserindo ${tecsArray.length} técnicos únicos...`);
    const batchSize = 100;
    for (let i = 0; i < tecsArray.length; i += batchSize) {
        const batch = tecsArray.slice(i, i + batchSize);
        const { error: errT } = await supabase.from('tecnicos').insert(batch);
        if (errT) console.error(`Erro no lote técnicos [${i}]:`, errT);
    }

    // Sincronizar Carga
    console.log("Sincronizando carga_tecnicos...");
    const { data: carga } = await supabase.from('carga_tecnicos').select('id, nome_tecnico, matricula_tecnico');
    let upCount = 0;
    for (const c of (carga || [])) {
        const nMat = syncMap.get(c.nome_tecnico?.trim().toUpperCase());
        if (nMat && nMat !== c.matricula_tecnico) {
            await supabase.from('carga_tecnicos').update({ matricula_tecnico: nMat }).eq('id', c.id);
            upCount++;
        }
    }
    console.log(`- ${upCount} itens de carga atualizados.`);
    console.log("Importação finalizada!");
}

importFinal();
