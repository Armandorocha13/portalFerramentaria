import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function importarSupervisores() {
    console.log('📂 Lendo arquivo sup.xlsx...');

    try {
        const workbook = XLSX.readFile('sup.xlsx');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Converte para JSON
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
            console.error('❌ O arquivo está vazio.');
            return;
        }

        console.log(`🔍 Encontrados ${rows.length} registros no Excel.`);

        // Mapeamento de colunas e DEDUPLICAÇÃO por matrícula
        const tecnicosMap = new Map();

        rows.forEach(row => {
            const matricula = String(row['Matrícula'] || row['Matricula'] || row['matricula'] || row['MATRICULA']).trim().toUpperCase();
            if (matricula && matricula !== 'UNDEFINED' && !tecnicosMap.has(matricula)) {
                tecnicosMap.set(matricula, {
                    matricula: matricula,
                    nome: row['Nome'] || row['nome'] || row['NOME'] || 'Supervisor Sem Nome',
                    senha: matricula, // Senha igual à matrícula
                    setor: row['Função'] || row['funcao'] || row['Setor'] || 'Geral'
                });
            }
        });

        const payload = Array.from(tecnicosMap.values());

        console.log(`🚀 Enviando ${payload.length} supervisores únicos para o Supabase...`);

        const { data, error } = await supabase
            .from('supervisores')
            .upsert(payload, { onConflict: 'matricula' });

        if (error) {
            console.error('❌ Erro na importação:', error.message);
            if (error.message.includes('RLS')) {
                console.log('👉 Lembre-se de rodar o comando SQL "ALTER TABLE supervisores DISABLE ROW LEVEL SECURITY;" no Supabase.');
            }
        } else {
            console.log('✅ Importação concluída com sucesso!');
            console.log(`${payload.length} supervisores agora podem logar no sistema.`);
        }

    } catch (err) {
        console.error('❌ Erro ao processar o arquivo:', err);
    }
}

importarSupervisores();
