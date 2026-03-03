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
    // Primeiro pegamos o ID do técnico
    const { data: tecnico } = await supabase
        .from('tecnicos')
        .select('id')
        .eq('matricula', tecnicoMatricula)
        .single();

    if (!tecnico) return [];

    const { data, error } = await supabase
        .from('carga_tecnicos')
        .select('*')
        .eq('tecnico_id', tecnico.id);

    if (error || !data) return [];

    return data.map(item => ({
        id: item.id,
        tecnicoMatricula,
        materialId: item.id, // Em um sistema real, teríamos uma tabela de materiais vinculada
        materialNome: item.material_nome,
        quantidade: item.quantidade,
        dataAtribuicao: item.data_atribuicao,
        patrimonio: item.patrimonio,
    }));
}

/** 📦 Lista catálogo de materiais (Entrada) */
export async function getCatalogoMateriais(): Promise<Material[]> {
    // Simulação ou busca em tabela de materiais se existir
    const { data, error } = await supabase
        .from('materiais') // Criar esta tabela se necessário
        .select('*');

    if (error || !data) return [];
    return data;
}

/** 📝 Registra a troca no histórico */
export async function registrarTroca(dados: {
    supervisor_id: string;
    tecnico_matricula: string;
    item_saida_id: string;
    material_entrada_id: string;
    motivo: string;
}) {
    // Pegar ID do técnico pela matrícula
    const { data: tecnico } = await supabase
        .from('tecnicos')
        .select('id, nome')
        .eq('matricula', dados.tecnico_matricula)
        .single();

    if (!tecnico) throw new Error('Técnico não encontrado.');

    // Pegar nomes para o histórico simplificado
    const { data: itemSaida } = await supabase
        .from('carga_tecnicos')
        .select('material_nome')
        .eq('id', dados.item_saida_id)
        .single();

    // Registrar no histórico
    const { data, error } = await supabase
        .from('historico_trocas')
        .insert({
            supervisor_id: dados.supervisor_id,
            tecnico_id: tecnico.id,
            item_saida_nome: itemSaida?.material_nome || 'Item Desconhecido',
            item_entrada_nome: dados.material_entrada_id, // Pode virar nome após busca
            motivo: dados.motivo,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** 📜 Recupera o histórico de trocas do supervisor */
export async function getHistoricoTrocas(supervisorId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('historico_trocas')
        .select(`
            *,
            tecnico:tecnico_id (nome, matricula)
        `)
        .eq('supervisor_id', supervisorId)
        .order('data_troca', { ascending: false });

    if (error || !data) return [];
    return data.map(item => ({
        id: item.id,
        tecnicoNome: item.tecnico.nome,
        tecnicoMatricula: item.tecnico.matricula,
        itemSaidaNome: item.item_saida_nome,
        materialEntradaNome: item.item_entrada_nome,
        dataSolicitacao: item.data_troca,
        prazoResolucao: item.data_troca, // Simplificado
        status: 'concluida',
    }));
}
