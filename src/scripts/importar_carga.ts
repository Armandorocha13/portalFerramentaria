import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function importCarga() {
    console.log('⏳ Iniciando importação da carga (46k registros)...');

    try {
        const content = fs.readFileSync('carga_consolidada_limpa.csv', 'utf-8');
        const records = parse(content, { columns: true, skip_empty_lines: true });

        console.log(`📦 Processando ${records.length} linhas...`);

        const chunkSize = 1000;
        for (let i = 0; i < records.length; i += chunkSize) {
            const chunk = records.slice(i, i + chunkSize).map((r: any) => ({
                contrato_origem: r.contrato_origem,
                matricula_tecnico: r.matricula_tecnico,
                nome_tecnico: r.nome_tecnico,
                codigo_material: r.codigo_material,
                descricao_material: r.descricao_material,
                unidade: r.unidade,
                saldo: r.saldo,
                valor_total: r.valor_total
            }));

            const { error } = await supabase.from('carga_tecnicos').insert(chunk);

            if (error) {
                console.error(`❌ Erro no chunk ${i}:`, error.message);
                if (error.message.includes('column')) {
                    console.log('👉 Certifique-se de que a tabela carga_tecnicos tem as colunas corretas.');
                }
            } else {
                console.log(`✅ Progressão: ${i + chunk.length} / ${records.length}`);
            }
        }

        console.log('🎉 Importação de Carga Finalizada!');

    } catch (err) {
        console.error('❌ Erro Fatal:', err);
    }
}

importCarga();
