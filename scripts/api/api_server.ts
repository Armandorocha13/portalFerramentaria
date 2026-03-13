import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURAÇÃO DE AMBIENTE ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: Credenciais do Supabase não encontradas no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- SERVIDOR API ---
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * Endpoint para buscar o histórico de trocas completo.
 * Usado pela automação para sincronizar com o MySQL local.
 */
app.get('/api/historico-trocas', async (req: Request, res: Response) => {
    try {
        console.log('--- Nova requisição de sincronização recebida ---');

        // Busca todos os registros do histórico
        // Nota: se a tabela for muito grande, considere usar paginação ou filtros de data
        const { data, error } = await supabase
            .from('historico_trocas')
            .select('*')
            .order('data_troca', { ascending: true });

        if (error) {
            console.error('❌ Erro no Supabase:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log(`✅ ${data.length} registros recuperados com sucesso.`);
        res.json(data);
    } catch (err: any) {
        console.error('❌ Erro interno:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

/**
 * Endpoint de status
 */
app.get('/api/status', (req: Request, res: Response) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 API de Integração rodando em http://localhost:${PORT}`);
    console.log(`🔗 Endpoint de dados: http://localhost:${PORT}/api/historico-trocas`);
});
