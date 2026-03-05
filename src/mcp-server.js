import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
/**
 * PORTAL DE FERRAMENTARIA - MCP SERVER (Gemini Integration)
 *
 * Este servidor expõe ferramentas para que o Gemini possa interagir com o fluxo
 * de troca de ferramentas, validando supervisores e consultando os dados do projeto.
 */
const server = new Server({
    name: "portal-ferramentaria-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * DEFINIÇÃO DAS FERRAMENTAS (TOOLS)
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "autenticar_supervisor",
                description: "Valida se uma matrícula pertence a um supervisor cadastrado e permite o acesso ao fluxo de troca.",
                inputSchema: {
                    type: "object",
                    properties: {
                        matricula: {
                            type: "string",
                            description: "A matrícula do colaborador (ex: SUP001)",
                        },
                    },
                    required: ["matricula"],
                },
            },
            {
                name: "get_dados_tecnico",
                description: "Recupera os dados cadastrais (Nome, Setor, Cargo, Status) de um técnico baseado na sua matrícula.",
                inputSchema: {
                    type: "object",
                    properties: {
                        matricula: {
                            type: "string",
                            description: "A matrícula do técnico (ex: TEC001)",
                        },
                    },
                    required: ["matricula"],
                },
            },
            {
                name: "get_carga_tecnico",
                description: "Lista todas as ferramentas e materiais vinculados atualmente à carga/saldo de um técnico.",
                inputSchema: {
                    type: "object",
                    properties: {
                        matricula: {
                            type: "string",
                            description: "A matrícula do técnico",
                        },
                    },
                    required: ["matricula"],
                },
            },
            {
                name: "registrar_troca_ferramenta",
                description: "Processa a solicitação de troca de uma ferramenta, registrando o Jutificativa e vinculando ao supervisor responsável.",
                inputSchema: {
                    type: "object",
                    properties: {
                        supervisor_matricula: { type: "string" },
                        tecnico_matricula: { type: "string" },
                        item_saida_id: { type: "string", description: "O ID do item que está saindo da carga" },
                        material_entrada_id: { type: "string", description: "O ID do novo material que será entregue" },
                        Jutificativa: { type: "string" },
                    },
                    required: ["supervisor_matricula", "tecnico_matricula", "item_saida_id", "material_entrada_id", "Jutificativa"],
                },
            },
        ],
    };
});
/**
 * LÓGICA DE EXECUÇÃO DAS FERRAMENTAS
 * Nota: Como estamos em fase de modelagem e integração, estas ferramentas
 * atuarão como a ponte para o banco de dados final.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (name === "autenticar_supervisor") {
            const { matricula } = z.object({ matricula: z.string() }).parse(args);
            // Aqui o Gemini usará seu contexto de conhecimento (KIs) ou consultas ao banco
            // para validar se o usuário tem permissão de supervisor.
            return {
                content: [{ type: "text", text: `Verificando credenciais para matrícula: ${matricula}. Role: SUPERVISOR.` }],
            };
        }
        if (name === "get_dados_tecnico") {
            const { matricula } = z.object({ matricula: z.string() }).parse(args);
            return {
                content: [{ type: "text", text: `Consultando base de dados para técnico: ${matricula}...` }],
            };
        }
        if (name === "get_carga_tecnico") {
            const { matricula } = z.object({ matricula: z.string() }).parse(args);
            return {
                content: [{ type: "text", text: `Recuperando saldo de carga para: ${matricula}...` }],
            };
        }
        if (name === "registrar_troca_ferramenta") {
            const { Jutificativa } = z.object({ Jutificativa: z.string() }).parse(args);
            return {
                content: [{ type: "text", text: `Solicitação de troca registrada com sucesso. Jutificativa: ${Jutificativa}. Status: PENDENTE.` }],
            };
        }
        throw new Error(`Tool not found: ${name}`);
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Erro na execução: ${error.message}` }],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Portal Ferramentaria MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in MCP server:", error);
    process.exit(1);
});
