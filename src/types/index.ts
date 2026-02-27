// ============================================================
// TIPOS DO SISTEMA DE GESTÃO DE TROCAS
// ============================================================

/** Status do técnico no sistema */
export type TecnicoStatus = 'ativo' | 'inativo' | 'ferias' | 'afastado';

/** Técnico registrado no sistema */
export interface Tecnico {
    matricula: string;
    nome: string;
    cargo: string;
    setor: string;
    status: TecnicoStatus;
}

/** Item que o técnico possui em carga */
export interface ItemCarga {
    id: string;
    tecnicoMatricula: string;
    materialId: string;
    materialNome: string;
    quantidade: number;
    dataAtribuicao: string;
    patrimonio?: string;
}

/** Material disponível no catálogo */
export interface Material {
    id: string;
    codigo: string;
    nome: string;
    categoria: string;
    unidade: string;
    descricao: string;
}

/** Status de uma solicitação de troca */
export type SolicitacaoStatus = 'pendente' | 'aprovada' | 'rejeitada' | 'concluida';

/** Solicitação de troca registrada */
export interface SolicitacaoTroca {
    id: string;
    sequencial: number;
    supervisorMatricula: string;
    tecnicoMatricula: string;
    tecnicoNome: string;
    itemSaidaId: string;
    itemSaidaNome: string;
    itemSaidaPatrimonio?: string;
    materialEntradaId: string;
    materialEntradaNome: string;
    motivo: string;
    dataSolicitacao: string;
    prazoResolucao: string; // D+1
    status: SolicitacaoStatus;
}

/** Credenciais de login do supervisor */
export interface Supervisor {
    matricula: string;
    nome: string;
    senha: string;
    setor: string;
}

/** Dados do formulário de troca (step a step) */
export interface FormularioTroca {
    tecnicoMatricula: string;
    tecnicoValidado: Tecnico | null;
    itemSaidaSelecionado: ItemCarga | null;
    materialEntradaSelecionado: Material | null;
    motivo: string;
}
