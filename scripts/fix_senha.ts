import { createClient } from '@supabase/supabase-js';
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
    console.error("ERRO: chaves não encontradas");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // Primeiro buscamos todos os supervisores na tabela
    const { data: supervisores, error: errGet } = await supabase
        .from('supervisores')
        .select('matricula');

    if (errGet) {
        console.log('ERRO AO BUSCAR SUPERVISORES:', errGet);
        return;
    }

    // Agora vamos atualizar a "senha" de cada um para ser igual à matrícula
    if (supervisores && supervisores.length > 0) {
        console.log(`Corrigindo a senha de ${supervisores.length} supervisores...`);
        for (const sup of supervisores) {
            const { error: errUpdate } = await supabase
                .from('supervisores')
                .update({ senha: sup.matricula })
                .eq('matricula', sup.matricula);

            if (errUpdate) {
                console.log(`ERRO AO ATUALIZAR: ${sup.matricula}`, errUpdate);
            }
        }
        console.log('Todas as senhas foram atualizadas com sucesso!');
    }
}

run();
