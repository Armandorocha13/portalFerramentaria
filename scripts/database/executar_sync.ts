
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
    const envPath = path.resolve('scripts', '.env');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env: any = {};
        envFile.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                let value = match[2] || '';
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                env[match[1]] = value.trim();
            }
        });
        return env;
    }
    return {};
}

async function executeSqlSync() {
    const env = loadEnv();
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Erro: Credenciais do Supabase não encontradas.");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const sqlPath = 'scripts/sql/sincronizar_equipes.sql';
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // O Supabase JS não tem uma função .exec(sql). 
    // Vamos usar a função rpc 'exec_sql' ou processar linha por linha para tabelas específicas.
    // Como são muitos INSERTS, o ideal é processar via rpc ou usar as funções de tabela do Supabase.
    
    console.log("🚀 Iniciando execução do SQL no Supabase...");
    
    // Para simplificar e garantir sucesso sem precisar criar funções no DB, 
    // vamos extrair os comandos e executar via SDK para as tabelas 'supervisores' e 'tecnicos'.
    
    const lines = sqlContent.split('\n');
    let supCount = 0;
    let tecCount = 0;

    for (const line of lines) {
        if (line.startsWith('INSERT INTO supervisores')) {
            // Extrair dados básicos: ('matricula', 'nome')
            const match = line.match(/VALUES\s*\(\s*'([^']+)'\s*,\s*([^)]+)\)/);
            if (match) {
                const matricula = match[1];
                let nome = match[2].trim();
                nome = nome === 'NULL' ? null : nome.replace(/'/g, "");
                
                await supabase.from('supervisores').upsert({ matricula, nome });
                supCount++;
            }
        } else if (line.startsWith('INSERT INTO tecnicos')) {
            // Extrair dados: ('matricula', 'nome', cargo, sup_mat)
            const match = line.match(/VALUES\s*\(\s*'([^']+)'\s*,\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
            if (match) {
                const matricula = match[1];
                const clean = (s: string) => s.trim() === 'NULL' ? null : s.trim().replace(/'/g, "");
                
                await supabase.from('tecnicos').upsert({
                    matricula,
                    nome: clean(match[2]),
                    cargo: clean(match[3]),
                    supervisor_matricula: clean(match[4])
                });
                tecCount++;
                if (tecCount % 100 === 0) console.log(`  ... ${tecCount} técnicos sincronizados`);
            }
        }
    }

    console.log(`✅ Sincronização concluída!`);
    console.log(`- ${supCount} Supervisores atualizados.`);
    console.log(`- ${tecCount} Técnicos atualizados.`);
}

executeSqlSync();
