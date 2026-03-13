
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    const envPath = path.resolve(__dirname, '..', '.env');
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

export async function backupCarga() {
    console.log("🚀 Iniciando Backup da tabela carga_tecnicos...");
    
    const env = loadEnv();
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Erro: Credenciais do Supabase não encontradas.");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar todos os dados da tabela
    const { data, error } = await supabase
        .from('carga_tecnicos')
        .select('*');

    if (error) {
        console.error("❌ Erro ao buscar dados do Supabase:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("⚠️ Tabela carga_tecnicos está vazia. Nada para fazer backup.");
        return;
    }

    // Criar pasta de backup se não existir
    const backupDir = path.resolve(__dirname, '..', 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `db_backup_carga_tecnicos_${timestamp}.json`);

    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`✅ Backup concluído com sucesso!`);
    console.log(`- ${data.length} registros salvos.`);
    console.log(`- Local: ${backupPath}`);
}

// Se executado diretamente
if (import.meta.url === `file:///${fileURLToPath(import.meta.url).replace(/\\/g, '/')}`) {
    backupCarga().catch(err => {
        console.error("Erro fatal no backup:", err);
        process.exit(1);
    });
}
