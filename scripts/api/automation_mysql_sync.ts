import mysql from 'mysql2/promise';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURAÇÃO ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

// URL da API que acabamos de criar (ou do seu servidor onde a API estiver rodando)
const API_URL = 'http://localhost:3001/api/historico-trocas';

// Configurações do seu MySQL Local
const MYSQL_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'SuaSenhaAqui', // Substitua pela sua senha real
    database: 'portal_ferramentaria_local' // Substitua pelo seu banco
};

async function syncData() {
    let connection;
    try {
        console.log('🔄 Iniciando sincronização do histórico de trocas...');

        // 1. Conectar ao MySQL local
        connection = await mysql.createConnection(MYSQL_CONFIG);
        console.log('✅ Conectado ao MySQL local.');

        // 2. Garantir que a tabela existe no MySQL local
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS historico_trocas (
                id UUID PRIMARY KEY,
                data_troca TIMESTAMP,
                supervisor_id VARCHAR(255),
                supervisor_matricula VARCHAR(255),
                supervisor_nome VARCHAR(255),
                tecnico_matricula VARCHAR(255),
                tecnico_nome VARCHAR(255),
                tecnico_cargo VARCHAR(255),
                tecnico_setor VARCHAR(255),
                item_saida_nome VARCHAR(255),
                item_entrada_nome VARCHAR(255),
                motivo TEXT,
                valor DECIMAL(10,2),
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Buscar dados da nossa API
        console.log(`📡 Buscando dados da API: ${API_URL}...`);
        const response = await axios.get(API_URL);
        const externalData = response.data;

        if (!Array.isArray(externalData)) {
            throw new Error('❌ Formato de dados inválido recebido da API.');
        }

        console.log(`📥 Recebidos ${externalData.length} registros para processar.`);

        // 4. Inserir/Atualizar no MySQL local (UPSERT manual com REPLACE ou ON DUPLICATE)
        const query = `
            REPLACE INTO historico_trocas (
                id, data_troca, supervisor_id, supervisor_matricula, supervisor_nome, 
                tecnico_matricula, tecnico_nome, tecnico_cargo, tecnico_setor, 
                item_saida_nome, item_entrada_nome, motivo, valor, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        let insertedCount = 0;
        for (const record of externalData) {
            await connection.execute(query, [
                record.id,
                record.data_troca,
                record.supervisor_id,
                record.supervisor_matricula,
                record.supervisor_nome,
                record.tecnico_matricula,
                record.tecnico_nome,
                record.tecnico_cargo,
                record.tecnico_setor,
                record.item_saida_nome,
                record.item_entrada_nome,
                record.motivo,
                record.valor || 0,
                record.status || 'concluido'
            ]);
            insertedCount++;
        }

        console.log(`✨ Sincronização concluída! ${insertedCount} registros importados/atualizados.`);

    } catch (err: any) {
        console.error('❌ ERRO NA SINCRONIZAÇÃO:', err.message);
        if (err.code === 'ECONNREFUSED' && err.config.url === API_URL) {
            console.error('👉 Verifique se sua API está rodando (npm run api:start)!');
        }
    } finally {
        if (connection) await connection.end();
    }
}

syncData();
