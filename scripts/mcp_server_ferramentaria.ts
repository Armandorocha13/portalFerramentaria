import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

// --- CONFIGURAÇÃO DE AMBIENTE ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO: Credenciais do Supabase não encontradas.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- DEFINIÇÃO DO SERVIDOR MCP ---
const server = new Server(
    {
        name: "portal-ferramentaria-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Ferramenta: Lista o histórico de trocas do Supabase
 */
const GET_HISTORY_TOOL: Tool = {
    name: "get_swap_history",
    description: "Busca o histórico completo de trocas do Supabase",
    inputSchema: {
        type: "object",
        properties: {
            limit: { type: "number", description: "Limite de registros (padrão 100)" },
        },
    },
};

/**
 * Ferramenta: Sincroniza com MySQL Local
 */
const SYNC_MYSQL_TOOL: Tool = {
    name: "sync_to_local_mysql",
    description: "Exporta os dados do Supabase para um banco MySQL local",
    inputSchema: {
        type: "object",
        properties: {
            host: { type: "string", description: "IP ou host do MySQL (ex: localhost)" },
            user: { type: "string", description: "Usuário do banco" },
            password: { type: "string", description: "Senha do banco" },
            database: { type: "string", description: "Nome do banco de dados" },
        },
        required: ["host", "user", "password", "database"],
    },
};

// --- HANDLERS ---

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [GET_HISTORY_TOOL, SYNC_MYSQL_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "get_swap_history") {
            const limit = (args?.limit as number) || 100;
            const { data, error } = await supabase
                .from("historico_trocas")
                .select("*")
                .order("data_troca", { ascending: false })
                .limit(limit);

            if (error) throw error;
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            };
        }

        if (name === "sync_to_local_mysql") {
            const { host, user, password, database } = args as any;

            // 1. Busca dados do Supabase
            const { data: externalData, error: sbError } = await supabase
                .from("historico_trocas")
                .select("*");

            if (sbError || !externalData) throw new Error("Erro ao buscar dados do Supabase");

            // 2. Conecta ao MySQL local
            const connection = await mysql.createConnection({ host, user, password, database });

            // Garantir tabela
            await connection.execute(`
          CREATE TABLE IF NOT EXISTS historico_trocas (
              id VARCHAR(36) PRIMARY KEY,
              data_troca TIMESTAMP,
              supervisor_matricula VARCHAR(255),
              tecnico_matricula VARCHAR(255),
              item_saida_nome VARCHAR(255),
              item_entrada_nome VARCHAR(255),
              motivo TEXT,
              status VARCHAR(50)
          )
      `);

            // 3. Importar
            let count = 0;
            for (const record of externalData) {
                await connection.execute(`
          REPLACE INTO historico_trocas 
          (id, data_troca, supervisor_matricula, tecnico_matricula, item_saida_nome, item_entrada_nome, motivo, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    record.id, record.data_troca, record.supervisor_matricula, record.tecnico_matricula,
                    record.item_saida_nome, record.item_entrada_nome, record.motivo, record.status
                ]);
                count++;
            }

            await connection.end();

            return {
                content: [{ type: "text", text: `✅ Sincronização concluída: ${count} registros importados/atualizados no banco ${database}.` }],
            };
        }

        throw new Error(`Ferramenta não encontrada: ${name}`);
    } catch (err: any) {
        return {
            isError: true,
            content: [{ type: "text", text: `❌ Erro: ${err.message}` }],
        };
    }
});

// --- INICIALIZAÇÃO ---
const transport = new StdioServerTransport();
await server.connect(transport);
console.log("🚀 Servidor MCP de Ferramentaria rodando!");
