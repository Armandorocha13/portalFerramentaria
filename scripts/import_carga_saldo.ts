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

export async function importCargaSaldo() {
    console.log("Iniciando atualização de carga (ANIEL_Saldo Volante.xlsx)...");

    const filePath = path.resolve(__dirname, '..', 'BaseDeDados', 'ANIEL_Saldo Volante.xlsx');
    if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // 1. Carregar Técnicos Válidos do Banco (Filtro)
    console.log("Buscando técnicos cadastrados no sistema...");
    const { data: tecsDb } = await supabase.from('tecnicos').select('matricula, nome');
    const setMatriculasValidas = new Set(tecsDb?.map(t => String(t.matricula).trim()) || []);
    const setNomesValidos = new Set(tecsDb?.map(t => String(t.nome).trim().toUpperCase()) || []);
    console.log(`- ${setMatriculasValidas.size} técnicos encontrados para filtragem.`);

    // 2. Carregar mapeamento de nomes -> matrículas do EQUIPES.xlsx (Fonte da Verdade)
    const wbEquipes = xlsx.readFile(path.resolve(__dirname, '..', 'BaseDeDados', 'EQUIPES.xlsx'));
    const dbEquipes = xlsx.utils.sheet_to_json(wbEquipes.Sheets['SINAPSE'], { header: 1, defval: '' }).slice(1);
    const mapGeralNomesMatriculas = new Map();
    dbEquipes.forEach((r: any) => {
        const matriculaCorreta = String(r[0]).trim();
        const nome = String(r[1]).trim().toUpperCase();
        if (nome) mapGeralNomesMatriculas.set(nome, matriculaCorreta);
    });

    // 3. Ler ANIEL_Saldo Volante.xlsx
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['SINAPSE'];
    const dataRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' }).slice(5);

    const cargaItems = [];

    for (const r of dataRows as any[]) {
        const nomeTec = String(r[6] || '').trim();
        if (!nomeTec || nomeTec === 'Nome da Equipe') continue;

        const nomeUpper = nomeTec.toUpperCase();
        const matriculaPlanilha = String(r[5] || '').trim();
        const matriculaOficial = mapGeralNomesMatriculas.get(nomeUpper) || matriculaPlanilha;

        // FILTRO: Só importa se o técnico existir no nosso banco
        if (!setMatriculasValidas.has(matriculaOficial) && !setNomesValidos.has(nomeUpper)) {
            continue;
        }

        cargaItems.push({
            contrato_origem: String(r[0] || '').trim(),
            matricula_tecnico: matriculaOficial,
            nome_tecnico: nomeTec,
            codigo_material: String(r[8] || '').trim(),
            descricao_material: String(r[9] || '').trim(),
            unidade: String(r[12] || '').trim(),
            saldo: String(r[19] || '').trim(),
            valor_total: String(r[21] || '').trim(),
            valor: parseFloat(String(r[20] || '0').replace('.', '').replace(',', '.')) || 0
        });
    }

    if (cargaItems.length === 0) {
        throw new Error("Nenhum item de carga encontrado para os técnicos cadastrados no sistema.");
    }

    console.log(`- ${cargaItems.length} itens filtrados e prontos para importação (de ${dataRows.length} totais).`);

    // 4. Limpar tabela carga_tecnicos com retry
    console.log("Limpando tabela carga_tecnicos...");
    await withRetry(async () => {
        const { error: deleteError } = await supabase.from('carga_tecnicos').delete().not('id', 'is', null);
        if (deleteError) throw deleteError;
    });

    // 5. Inserir novos itens em lotes com delay e retry
    console.log("Inserindo novos dados...");
    const batchSize = 300; // Reduzido para maior estabilidade
    for (let i = 0; i < cargaItems.length; i += batchSize) {
        const batch = cargaItems.slice(i, i + batchSize);

        await withRetry(async () => {
            const { error: insertError } = await supabase.from('carga_tecnicos').insert(batch);
            if (insertError) {
                console.error(`Erro ao inserir lote [${i}] de ${cargaItems.length}:`, insertError);
                throw insertError;
            }
        });

        // Pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 200));
        if (i % 3000 === 0 && i > 0) console.log(`  ... processados ${i} itens`);
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
