import { supabase } from './supabase';
import type { Tecnico, ItemCarga, Material } from '../types';

/** 🔍 Busca técnico e valida o supervisor dele */
export async function getTecnico(matricula: string, supervisorId: string): Promise<Tecnico | null> {
    const { data, error } = await supabase
        .from('tecnicos')
        .select('*')
        .eq('matricula', matricula.toUpperCase())
        .eq('supervisor_id', supervisorId)
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

/** 🛠️ Recupera a carga/saldo do técnico */
export async function getCargaTecnico(tecnicoMatricula: string): Promise<ItemCarga[]> {
    const { data, error } = await supabase
        .from('carga_tecnicos')
        .select('*')
        .eq('matricula_tecnico', tecnicoMatricula);

    if (error || !data) return [];

    return data.map(item => ({
        id: item.id,
        tecnicoMatricula: item.matricula_tecnico,
        materialId: item.codigo_material,
        materialNome: item.descricao_material,
        quantidade: parseInt(item.saldo) || 0,
        dataAtribuicao: item.created_at,
        patrimonio: '', // O campo patrimonio não veio no CSV básico
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
        .select('id, nome')
        .eq('matricula', dados.tecnico_matricula.toUpperCase())
        .single();

    if (!tecnico) throw new Error('Técnico não encontrado.');

    // Pegar nome do material de saída
    const { data: itemSaida } = await supabase
        .from('carga_tecnicos')
        .select('descricao_material')
        .eq('id', dados.item_saida_id)
        .single();

    // Registrar no histórico com todos os detalhes solicitados
    const { data, error } = await supabase
        .from('historico_trocas')
        .insert({
            supervisor_id: dados.supervisor_id,
            supervisor_matricula: dados.supervisor_matricula,
            supervisor_nome: dados.supervisor_nome,
            tecnico_id: tecnico.id,
            tecnico_matricula: dados.tecnico_matricula,
            tecnico_nome: tecnico.nome,
            item_saida_nome: itemSaida?.descricao_material || 'Item Desconhecido',
            item_entrada_nome: dados.material_entrada_nome,
            motivo: dados.motivo,
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
        .select(`
            *,
            tecnico:tecnico_id (nome, matricula)
        `, { count: 'exact' })
        .eq('supervisor_id', supervisorId)
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
            prazoResolucao: item.data_troca, // Simplificado, ideal calcular D+1 se necessário
            status: item.status || 'pedido_em_andamento',
        })),
        count: count || 0
    };
}
