import { supabase } from './supabase';
import type { Tecnico, ItemCarga, Material } from '../types';
import { calcularPrazo } from './date-utils';

// ============================================================
// REGRA DE NEGÓCIO: Trava de 45 dias
// ============================================================

const DIAS_CARENCIA = 45;

export interface ResultadoTrocaRecente {
    bloqueado: boolean;
    diasRestantes: number;
    dataTroca: string;      // ISO date string da última troca
    dataLiberacao: string;   // DD/MM/AAAA formatado para exibição
}

/**
 * 🔒 Verifica se um item específico foi trocado nos últimos 45 dias
 * para o técnico informado.
 */
export async function verificarTrocaRecente(
    tecnicoMatricula: string,
    itemNome: string
): Promise<ResultadoTrocaRecente | null> {
    // 1. Buscar o UUID do técnico pela matrícula
    const { data: tecnico } = await supabase
        .from('tecnicos')
        .select('matricula')
        .eq('matricula', tecnicoMatricula.toUpperCase())
        .single();

    if (!tecnico) return null;

    // 2. Consultar última troca do item nos últimos 45 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - DIAS_CARENCIA);

    const { data, error } = await supabase
        .from('historico_trocas')
        .select('data_troca')
        .eq('tecnico_matricula', tecnico.matricula)
        .eq('item_saida_nome', itemNome)
        .gte('data_troca', dataLimite.toISOString())
        .order('data_troca', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) return null;

    const dataTroca = new Date(data[0].data_troca);
    const dataLib = new Date(dataTroca);
    dataLib.setDate(dataLib.getDate() + DIAS_CARENCIA);

    const agora = new Date();
    const diffMs = dataLib.getTime() - agora.getTime();
    const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
        bloqueado: diasRestantes > 0,
        diasRestantes,
        dataTroca: data[0].data_troca,
        dataLiberacao: dataLib.toLocaleDateString('pt-BR'),
    };
}

/**
 * 🔒 Busca todas as trocas recentes (< 45 dias) para um técnico.
 * Retorna um Map<itemNome, ResultadoTrocaRecente> para exibir badges na lista.
 */
export async function verificarTrocasRecentesBatch(
    tecnicoMatricula: string
): Promise<Map<string, ResultadoTrocaRecente>> {
    const resultado = new Map<string, ResultadoTrocaRecente>();

    // 1. Buscar UUID do técnico
    const { data: tecnico } = await supabase
        .from('tecnicos')
        .select('matricula')
        .eq('matricula', tecnicoMatricula.toUpperCase())
        .single();

    if (!tecnico) return resultado;

    // 2. Buscar todas as trocas dos últimos 45 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - DIAS_CARENCIA);

    const { data, error } = await supabase
        .from('historico_trocas')
        .select('item_saida_nome, data_troca')
        .eq('tecnico_matricula', tecnico.matricula)
        .gte('data_troca', dataLimite.toISOString())
        .order('data_troca', { ascending: false });

    if (error || !data) return resultado;

    const agora = new Date();

    for (const row of data) {
        // Manter apenas a troca mais recente de cada item
        if (resultado.has(row.item_saida_nome)) continue;

        const dataTroca = new Date(row.data_troca);
        const dataLib = new Date(dataTroca);
        dataLib.setDate(dataLib.getDate() + DIAS_CARENCIA);

        const diffMs = dataLib.getTime() - agora.getTime();
        const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        if (diasRestantes > 0) {
            resultado.set(row.item_saida_nome, {
                bloqueado: true,
                diasRestantes,
                dataTroca: row.data_troca,
                dataLiberacao: dataLib.toLocaleDateString('pt-BR'),
            });
        }
    }

    return resultado;
}

/** 🔍 Busca técnico e valida o supervisor dele */
export async function getTecnico(matricula: string, supervisorId: string): Promise<Tecnico | null> {
    const { data, error } = await supabase
        .from('tecnicos')
        .select('*')
        .eq('matricula', matricula.toUpperCase())
        .eq('supervisor_matricula', supervisorId)
        .single();

    if (error || !data) return null;
    return {
        matricula: data.matricula,
        nome: data.nome,
        cargo: data.cargo,
        setor: data.setor,
        status: data.status as any,
    };
}

// Auxiliar para converter valores monetários (ex: "2,00" -> 2.0)
const sanitizarValor = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(',', '.').replace(/[^\d.]/g, '');
    return parseFloat(str) || 0;
};

/** 🛠️ Recupera a carga/saldo do técnico */
export async function getCargaTecnico(tecnicoMatricula: string, tecnicoNome: string): Promise<ItemCarga[]> {
    const { data, error } = await supabase
        .from('carga_tecnicos')
        .select('*')
        .eq('matricula_tecnico', tecnicoMatricula)
        .ilike('nome_tecnico', `%${tecnicoNome}%`)
        .order('descricao_material', { ascending: true });

    if (error || !data) return [];

    return data.map(item => ({
        id: item.id,
        tecnicoMatricula: item.matricula_tecnico,
        materialId: item.codigo_material,
        materialNome: item.descricao_material,
        quantidade: parseInt(item.saldo) || 0,
        dataAtribuicao: item.created_at,
        patrimonio: '', // O campo patrimonio não veio no CSV básico
        valor: sanitizarValor(item.valor_total),
    }));
}

/** 📦 Lista catálogo de materiais (Entrada) */
async function getCatalogoMateriais(): Promise<Material[]> {
    // Busca materiais únicos da tabela de carga para servir como catálogo
    const { data, error } = await supabase
        .from('carga_tecnicos')
        .select('codigo_material, descricao_material')
        .limit(100); // Limite para não sobrecarregar

    if (error || !data) return [];

    // Remove duplicados por nome
    const unique = new Map();
    data.forEach(item => {
        if (!unique.has(item.descricao_material)) {
            unique.set(item.descricao_material, {
                id: item.codigo_material || item.descricao_material,
                nome: item.descricao_material,
                categoria: 'Geral',
                codigo: item.codigo_material
            });
        }
    });

    return Array.from(unique.values());
}

/** 📝 Registra a troca no histórico */
export async function registrarTroca(dados: {
    supervisor_id: string; // UUID
    supervisor_matricula: string;
    supervisor_nome: string;
    tecnico_matricula: string;
    item_saida_id: string;
    material_entrada_nome: string;
    motivo: string;
}) {
    // Pegar informações do técnico
    const { data: tecnico } = await supabase
        .from('tecnicos')
        .select('matricula, nome, cargo, setor')
        .eq('matricula', dados.tecnico_matricula.toUpperCase())
        .single();

    if (!tecnico) throw new Error('Técnico não encontrado.');

    // Pegar nome e valor do material de saída
    const { data: itemSaida } = await supabase
        .from('carga_tecnicos')
        .select('descricao_material, valor_total')
        .eq('id', dados.item_saida_id)
        .single();

    // Registrar no histórico com todos os detalhes solicitados
    const { data, error } = await supabase
        .from('historico_trocas')
        .insert({
            supervisor_id: dados.supervisor_id,
            supervisor_matricula: dados.supervisor_matricula,
            supervisor_nome: dados.supervisor_nome,
            tecnico_id: null, // Nullificado, já que uuid não existe mais
            tecnico_matricula: dados.tecnico_matricula,
            tecnico_nome: tecnico.nome,
            tecnico_cargo: tecnico.cargo,
            tecnico_setor: tecnico.setor,
            item_saida_nome: itemSaida?.descricao_material || 'Item Desconhecido',
            item_entrada_nome: dados.material_entrada_nome,
            motivo: dados.motivo,
            valor: sanitizarValor(itemSaida?.valor_total),
            status: 'pedido_em_andamento', // Estado inicial — estoque irá atualizar
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** 📜 Recupera o histórico de trocas do supervisor com paginação */
export async function getHistoricoTrocas(supervisorId: string, page = 1, pageSize = 10): Promise<{ data: any[], count: number }> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, count, error } = await supabase
        .from('historico_trocas')
        .select('*', { count: 'exact' })
        .eq('supervisor_matricula', supervisorId)
        .order('data_troca', { ascending: false })
        .range(start, end);

    if (error || !data) return { data: [], count: 0 };
    return {
        data: data.map(item => ({
            id: item.id,
            tecnicoNome: item.tecnico_nome || (item.tecnico ? item.tecnico.nome : 'N/A'),
            tecnicoMatricula: item.tecnico_matricula || (item.tecnico ? item.tecnico.matricula : 'N/A'),
            supervisorNome: item.supervisor_nome,
            supervisorMatricula: item.supervisor_matricula,
            itemSaidaNome: item.item_saida_nome,
            materialEntradaNome: item.item_entrada_nome,
            dataSolicitacao: item.data_troca,
            prazoResolucao: calcularPrazo(item.data_troca, new Date(item.data_troca).getHours() >= 15 ? 2 : 1),
            status: item.status || 'pedido_em_andamento',
        })),
        count: count || 0
    };
}
