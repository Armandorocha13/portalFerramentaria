import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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

async function checkDuplicates() {
    const { count, error } = await supabase.from('carga_tecnicos').select('*', { count: 'exact', head: true });
    if (error) throw error;
    console.log(`Total de registros na tabela carga_tecnicos: ${count}`);

    const { data: duplicates } = await supabase.rpc('check_duplicates_carga'); // This might not exist, let's just do a regular query

    // Check if there's any obvious duplication (same matricula + same material)
    const { data: sample } = await supabase.from('carga_tecnicos')
        .select('matricula_tecnico, codigo_material')
        .limit(1000);

    const map = new Map();
    sample?.forEach(r => {
        const key = `${r.matricula_tecnico}-${r.codigo_material}`;
        map.set(key, (map.get(key) || 0) + 1);
    });

    let dupsCount = 0;
    map.forEach((val) => { if (val > 1) dupsCount++; });
    console.log(`Duplicatas detectadas na amostra de 1000: ${dupsCount}`);
}

checkDuplicates().catch(console.error);
