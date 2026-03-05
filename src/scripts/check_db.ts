import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('--- DIAGNÓSTICO DO BANCO DE DADOS ---');

    // 1. Verificar Supervisores
    const { data: sups, error: errSups } = await supabase.from('supervisores').select('*');
    if (errSups) {
        console.error('❌ Erro ao acessar tabela "supervisores":', errSups.message);
        console.log('👉 Certifique-se de que executou o arquivo supabase_schema.sql no painel do Supabase.');
    } else {
        console.log(`✅ Tabela "supervisores": ${sups?.length || 0} registros encontrados.`);

        if (sups?.length === 0) {
            console.log('⚠️ Tabela de supervisores vazia. Criando supervisor de teste...');
            const { data: newSup, error: createErr } = await supabase.from('supervisores').insert({
                matricula: 'SUP001',
                nome: 'Supervisor Teste',
                senha: '123456',
                setor: 'Administração'
            }).select().single();

            if (createErr) console.error('❌ Erro ao criar supervisor:', createErr.message);
            else console.log('✅ Supervisor SUP001 (senha: 123456) criado com sucesso!');
        }
    }

    // 2. Verificar Técnicos
    const { data: tecs, error: errTecs } = await supabase.from('tecnicos').select('*');
    if (errTecs) console.error('❌ Erro ao acessar tabela "tecnicos":', errTecs.message);
    else console.log(`✅ Tabela "tecnicos": ${tecs?.length || 0} registros encontrados.`);

    // 3. Verificar Carga
    const { data: carga, error: errCarga } = await supabase.from('carga_tecnicos').select('*');
    if (errCarga) console.error('❌ Erro ao acessar tabela "carga_tecnicos":', errCarga.message);
    else console.log(`✅ Tabela "carga_tecnicos": ${carga?.length || 0} registros encontrados.`);
}

checkDatabase();
