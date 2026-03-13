import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const xlsx = require('xlsx');
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    const envPath = path.resolve(__dirname, '..', '.env');
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

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        console.log(` Tentando novamente após erro (${retries} tentativas restantes)...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(fn, retries - 1, delay * 2);
    }
}

import { backupCarga } from './backup_carga.js';

export async function importCargaSaldo() {
    console.log("Iniciando atualização de carga (SALDO VOLANTE.xlsx)...");

    // Realizar backup automático antes de começar
    try {
        await backupCarga();
    } catch (e) {
        console.warn("⚠️ Aviso: Falha ao realizar backup preventivo, mas prosseguindo com a carga...");
    }

    const filePath = 'C:\\Users\\user\\Desktop\\planilhas\\SALDO VOLANTE.xlsx';
    if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // 1. Carregar Técnicos Válidos do Banco (Filtro)
    console.log("Buscando técnicos cadastrados no sistema...");
    const { data: tecsDb } = await supabase.from('tecnicos').select('matricula, nome');
    const setMatriculasValidas = new Set(tecsDb?.map(t => String(t.matricula).trim()) || []);
    const setNomesValidos = new Set(tecsDb?.map(t => String(t.nome).trim().toUpperCase()) || []);
    console.log(`- ${setMatriculasValidas.size} técnicos encontrados para filtragem.`);

    // 2. Carregar mapeamento de nomes -> matrículas (Usando a base atualizada)
    const equipesPath = 'C:\\Users\\user\\Desktop\\planilhas\\BASE_COMPLETA_EQUIPES_ATUALIZADA.xlsx';
    const wbEquipes = xlsx.readFile(equipesPath);
    const dbEquipes = xlsx.utils.sheet_to_json(wbEquipes.Sheets[wbEquipes.SheetNames[0]], { header: 1, defval: '' }).slice(1);
    const mapGeralNomesMatriculas = new Map();
    dbEquipes.forEach((r: any) => {
        const matriculaCorreta = String(r[0]).trim(); // Matrícula na Col A
        const nome = String(r[1]).trim().toUpperCase(); // Nome na Col B
        if (nome) mapGeralNomesMatriculas.set(nome, matriculaCorreta);
    });

    // 3. Ler Saldo Volante e DEDUPLICAR / SOMAR saldos
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dataRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' }).slice(1); // Começa na L2

    const mapDeduplicar = new Map();

    for (const r of dataRows as any[]) {
        const nomeTec = String(r[6] || '').trim(); // Col G
        if (!nomeTec || nomeTec === 'Equipe') continue;

        const nomeUpper = nomeTec.toUpperCase();
        // Tenta pegar matrícula da Col E ou F, ou do mapa se necessário
        const matriculaPlanilha = String(r[4] || r[5] || '').trim();
        const matriculaOficial = mapGeralNomesMatriculas.get(nomeUpper) || matriculaPlanilha;

        if (!setMatriculasValidas.has(matriculaOficial) && !setNomesValidos.has(nomeUpper)) continue;

        const codigoMat = String(r[8] || '').trim(); // Col I
        if (!codigoMat) continue;

        // Saldo na Col U (índice 20) ou similar
        const saldoStr = String(r[20] || '0').replace('.', '').replace(',', '.');
        const saldoFloat = parseFloat(saldoStr) || 0;

        if (saldoFloat <= 0) continue;

        const valorUnitStr = String(r[21] || '0').replace('.', '').replace(',', '.');
        const valorUnit = parseFloat(valorUnitStr) || 0;
        const valorTotal = saldoFloat * valorUnit;

        // Chave única: Matrícula + Código do Material
        const uniqueKey = `${matriculaOficial}_${codigoMat}`;

        if (mapDeduplicar.has(uniqueKey)) {
            const existing = mapDeduplicar.get(uniqueKey);
            const currentSaldo = parseFloat(existing.saldo.replace(',', '.'));
            const currentTotal = parseFloat(existing.valor_total.replace(',', '.'));
            existing.saldo = (currentSaldo + saldoFloat).toFixed(2).replace('.', ',');
            existing.valor_total = (currentTotal + valorTotal).toFixed(2).replace('.', ',');
        } else {
            mapDeduplicar.set(uniqueKey, {
                contrato_origem: String(r[1] || '').trim(), // Col B: FERRAMENTAL VITÓRIA/ETC
                matricula_tecnico: matriculaOficial,
                nome_tecnico: nomeTec,
                codigo_material: codigoMat,
                descricao_material: String(r[9] || '').trim(), // Col J
                unidade: String(r[12] || '').trim(), // Col M
                saldo: saldoFloat.toFixed(2).replace('.', ','),
                valor_total: valorTotal.toFixed(2).replace('.', ','),
                valor: valorUnit
            });
        }
    }

    const cargaItems = Array.from(mapDeduplicar.values());

    if (cargaItems.length === 0) {
        throw new Error("Nenhum item de carga válido encontrado.");
    }

    console.log(`- ${cargaItems.length} itens únicos para importação.`);

    // 4. Limpar tabela carga_tecnicos (Garante que está vazia)
    console.log("Limpando tabela carga_tecnicos...");
    let totalRemovido = 0;
    while (true) {
        const { count: currentCount } = await supabase.from('carga_tecnicos').select('*', { count: 'exact', head: true });
        if (currentCount === 0) break;

        console.log(`- Removendo ${currentCount} registros existentes...`);
        const { error: deleteError } = await supabase.from('carga_tecnicos').delete().not('id', 'is', null);
        if (deleteError) {
            console.log("  Aviso: Erro parcial na limpeza, tentando novamente...");
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // 5. Inserir novos dados em lotes
    console.log("Inserindo novos dados...");
    const batchSize = 200; // Batch menor para evitar timeouts
    for (let i = 0; i < cargaItems.length; i += batchSize) {
        const batch = cargaItems.slice(i, i + batchSize);

        await withRetry(async () => {
            const { error: insertError } = await supabase.from('carga_tecnicos').insert(batch);
            if (insertError) throw insertError;
        });

        await new Promise(resolve => setTimeout(resolve, 250)); // Delay maior
        if (i % 2000 === 0 && i > 0) console.log(`  ... processados ${i} itens`);
    }

    console.log("Carga atualizada com sucesso!");
    return { success: true, count: cargaItems.length };
}

// Se executado diretamente
if (import.meta.url === `file:///${fileURLToPath(import.meta.url).replace(/\\/g, '/')}`) {
    importCargaSaldo().catch(err => {
        console.error("Erro fatal:", err);
        process.exit(1);
    });
}
