import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
const filePath = 'C:\\Users\\user\\Documents\\PBI\\BASE DADOS\\ANIEL\\QUERY\\CARGOS.xlsx';

async function runImport() {
    console.log('🚀 Iniciando processamento do arquivo CARGOS.xlsx...');

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
        const colFuncao = headers.indexOf('Função');
        const colSituacao = headers.indexOf('Situação');

        // 1. Coletar Supervisores Únicos
        const supervisorsMap = new Map();
        data.forEach(row => {
            const cod = String(row[colCodSup] || '').trim();
            const nome = String(row[colNomeSup] || '').trim();
            if (cod && cod !== '0' && cod !== 'null') {
                supervisorsMap.set(cod, nome);
            }
        });

        console.log(`📊 Encontrados ${supervisorsMap.size} supervisores únicos.`);

        // 2. Upsert Supervisores
        const supervisorsPayload = Array.from(supervisorsMap).map(([mat, nome]) => ({
            matricula: mat,
            nome: nome,
            senha: mat, // Senha igual à matrícula conforme solicitado anteriormente
            setor: 'GESTÃO'
        }));

        const { data: upsertedSups, error: errSups } = await supabase
            .from('supervisores')
            .upsert(supervisorsPayload, { onConflict: 'matricula' })
            .select();

        if (errSups) throw new Error(`Erro ao inserir supervisores: ${errSups.message}`);

        const supIdMap = new Map();
        upsertedSups.forEach(s => supIdMap.set(s.matricula, s.id));
        console.log('✅ Supervisores sincronizados.');

        // 3. Preparar Técnicos
        const techniciansPayload = data
            .filter(row => row[colEquipe])
            .map(row => {
                const codSup = String(row[colCodSup] || '').trim();
                return {
                    matricula: String(row[colEquipe]).trim(),
                    nome: String(row[colNome] || '').trim(),
                    cargo: String(row[colFuncao] || '').trim(),
                    setor: 'OPERACIONAL',
                    status: String(row[colSituacao] || 'ATIVO').trim().toLowerCase().includes('ativo') ? 'ativo' : 'inativo',
                    supervisor_id: supIdMap.get(codSup) || null
                };
            });

        console.log(`🚀 Enviando ${techniciansPayload.length} técnicos para o Supabase...`);

        // Split em chunks para não estourar o limite do Supabase
        const chunkSize = 1000;
        for (let i = 0; i < techniciansPayload.length; i += chunkSize) {
            const chunk = techniciansPayload.slice(i, i + chunkSize);
            const { error: errTecs } = await supabase
                .from('tecnicos')
                .upsert(chunk, { onConflict: 'matricula' });

            if (errTecs) console.error(`❌ Erro no chunk ${i}:`, errTecs.message);
            else console.log(`📦 Chunk ${i + chunk.length} processado.`);
        }

        console.log('🎉 Sincronização de Hierarquia Completa!');

    } catch (err) {
        console.error('❌ Erro Fatal:', err);
    }
}

runImport();
