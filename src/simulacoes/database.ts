// ============================================================
// MOCK DATABASE — Sistema de Gestão de Trocas
// ============================================================

import type { Usuario, Supervisor, Tecnico, ItemCarga, Material } from '../tipos';

// ---- USUÁRIOS DO SISTEMA (login unificado por matrícula) ----
const usuarios: Usuario[] = [
    {
        id: 'mock-id-sup001',
        matricula: 'SUP001',
        nome: 'Carlos Eduardo Mendes',
        senha: '123456',
        setor: 'Linha de Produção A',
        perfil: 'supervisor',
    },
    {
        id: 'mock-id-sup002',
        matricula: 'SUP002',
        nome: 'Ana Paula Ferreira',
        senha: '123456',
        setor: 'Linha de Produção B',
        perfil: 'supervisor',
    },
    {
        id: 'mock-id-sup003',
        matricula: 'SUP003',
        nome: 'Roberto Silva Neto',
        senha: '123456',
        setor: 'Linha de Produção C',
        perfil: 'supervisor',
    },
    // ── Estoque / Ferramentaria ──
    {
        id: 'mock-id-est001',
        matricula: 'EST001',
        nome: 'Marcos Vinícius Lopes',
        senha: '123456',
        setor: 'Ferramentaria Central',
        perfil: 'estoque',
    },
    {
        id: 'mock-id-est002',
        matricula: 'EST002',
        nome: 'Juliana Ramos Cardoso',
        senha: '123456',
        setor: 'Ferramentaria Central',
        perfil: 'estoque',
    },
];

// Manter array de supervisores derivado para compatibilidade
const supervisores: Supervisor[] = usuarios
    .filter((u) => u.perfil === 'supervisor')
    .map(({ matricula, nome, senha, setor }) => ({ matricula, nome, senha, setor }));

// ---- TÉCNICOS ----
const tecnicos: Tecnico[] = [
    {
        matricula: 'TEC001',
        nome: 'João Pedro Almeida',
        cargo: 'Técnico de Manutenção I',
        setor: 'Linha de Produção A',
        status: 'ativo',
    },
    {
        matricula: 'TEC002',
        nome: 'Maria Souza Lima',
        cargo: 'Técnica de Manutenção II',
        setor: 'Linha de Produção B',
        status: 'ativo',
    },
    {
        matricula: 'TEC003',
        nome: 'Pedro Henrique Santos',
        cargo: 'Técnico de Manutenção I',
        setor: 'Linha de Produção A',
        status: 'inativo',
    },
    {
        matricula: 'TEC004',
        nome: 'Fernanda Oliveira Costa',
        cargo: 'Técnica de Manutenção III',
        setor: 'Linha de Produção C',
        status: 'ativo',
    },
    {
        matricula: 'TEC005',
        nome: 'Lucas Ribeiro',
        cargo: 'Técnico de Manutenção II',
        setor: 'Linha de Produção A',
        status: 'ferias',
    },
    {
        matricula: 'TEC006',
        nome: 'Camila Ferreira Dias',
        cargo: 'Técnica de Manutenção I',
        setor: 'Linha de Produção B',
        status: 'ativo',
    },
    {
        matricula: 'TEC007',
        nome: 'Rafael Martins Gomes',
        cargo: 'Técnico de Manutenção III',
        setor: 'Linha de Produção C',
        status: 'afastado',
    },
];

// ---- CATÁLOGO DE MATERIAIS ----
const materiais: Material[] = [
    {
        id: 'MAT001',
        codigo: 'FER-001',
        nome: 'Chave de Fenda Phillips 1/4"',
        categoria: 'Ferramentas Manuais',
        unidade: 'UN',
        descricao: 'Chave de fenda com ponta Phillips tamanho 1/4 polegada',
    },
    {
        id: 'MAT002',
        codigo: 'FER-002',
        nome: 'Alicate Universal 8"',
        categoria: 'Ferramentas Manuais',
        unidade: 'UN',
        descricao: 'Alicate universal com isolamento 1000V',
    },
    {
        id: 'MAT003',
        codigo: 'FER-003',
        nome: 'Torquímetro Digital 10-200 Nm',
        categoria: 'Ferramentas de Precisão',
        unidade: 'UN',
        descricao: 'Torquímetro digital com faixa de 10 a 200 Newton metro',
    },
    {
        id: 'MAT004',
        codigo: 'FER-004',
        nome: 'Multímetro Digital CAT III',
        categoria: 'Instrumentos de Medição',
        unidade: 'UN',
        descricao: 'Multímetro digital com categoria de segurança CAT III',
    },
    {
        id: 'MAT005',
        codigo: 'FER-005',
        nome: 'Jogo de Chaves Allen 1.5-10mm',
        categoria: 'Ferramentas Manuais',
        unidade: 'JG',
        descricao: 'Jogo de chaves Allen métricas com 9 peças',
    },
    {
        id: 'MAT006',
        codigo: 'FER-006',
        nome: 'Parafusadeira Elétrica 12V',
        categoria: 'Ferramentas Elétricas',
        unidade: 'UN',
        descricao: 'Parafusadeira/furadeira elétrica sem fio 12V com 2 baterias',
    },
    {
        id: 'MAT007',
        codigo: 'FER-007',
        nome: 'Paquímetro Digital 150mm',
        categoria: 'Instrumentos de Medição',
        unidade: 'UN',
        descricao: 'Paquímetro digital em aço inox com resolução de 0.01mm',
    },
    {
        id: 'MAT008',
        codigo: 'FER-008',
        nome: 'Micrômetro Externo 0-25mm',
        categoria: 'Instrumentos de Medição',
        unidade: 'UN',
        descricao: 'Micrômetro externo com faixa de 0 a 25mm',
    },
    {
        id: 'MAT009',
        codigo: 'FER-009',
        nome: 'Chave Combinada 10mm',
        categoria: 'Ferramentas Manuais',
        unidade: 'UN',
        descricao: 'Chave combinada boca/estrela 10mm em aço cromo vanádio',
    },
    {
        id: 'MAT010',
        codigo: 'FER-010',
        nome: 'Serra Tico-Tico 500W',
        categoria: 'Ferramentas Elétricas',
        unidade: 'UN',
        descricao: 'Serra tico-tico elétrica 500W com controle de velocidade',
    },
    {
        id: 'MAT011',
        codigo: 'EPI-001',
        nome: 'Luva de Proteção Mecânica',
        categoria: 'EPI',
        unidade: 'PAR',
        descricao: 'Luva de segurança para proteção mecânica nível 5',
    },
    {
        id: 'MAT012',
        codigo: 'EPI-002',
        nome: 'Óculos de Proteção Ampla Visão',
        categoria: 'EPI',
        unidade: 'UN',
        descricao: 'Óculos de proteção com ampla visão e antiembaçante',
    },
];

// ---- SNAPSHOT DE CARGA (itens por técnico) ----
const itensCarga: ItemCarga[] = [
    // --- TEC001 - João Pedro ---
    {
        id: 'CAR001',
        tecnicoMatricula: 'TEC001',
        materialId: 'MAT001',
        materialNome: 'Chave de Fenda Phillips 1/4"',
        quantidade: 1,
        dataAtribuicao: '2025-11-15',
        patrimonio: 'PAT-10234',
    },
    {
        id: 'CAR002',
        tecnicoMatricula: 'TEC001',
        materialId: 'MAT002',
        materialNome: 'Alicate Universal 8"',
        quantidade: 1,
        dataAtribuicao: '2025-11-15',
        patrimonio: 'PAT-10235',
    },
    {
        id: 'CAR003',
        tecnicoMatricula: 'TEC001',
        materialId: 'MAT004',
        materialNome: 'Multímetro Digital CAT III',
        quantidade: 1,
        dataAtribuicao: '2025-12-01',
        patrimonio: 'PAT-10410',
    },
    {
        id: 'CAR004',
        tecnicoMatricula: 'TEC001',
        materialId: 'MAT005',
        materialNome: 'Jogo de Chaves Allen 1.5-10mm',
        quantidade: 1,
        dataAtribuicao: '2025-11-15',
    },
    // --- TEC002 - Maria Souza ---
    {
        id: 'CAR005',
        tecnicoMatricula: 'TEC002',
        materialId: 'MAT003',
        materialNome: 'Torquímetro Digital 10-200 Nm',
        quantidade: 1,
        dataAtribuicao: '2025-10-20',
        patrimonio: 'PAT-10301',
    },
    {
        id: 'CAR006',
        tecnicoMatricula: 'TEC002',
        materialId: 'MAT006',
        materialNome: 'Parafusadeira Elétrica 12V',
        quantidade: 1,
        dataAtribuicao: '2025-10-20',
        patrimonio: 'PAT-10302',
    },
    {
        id: 'CAR007',
        tecnicoMatricula: 'TEC002',
        materialId: 'MAT007',
        materialNome: 'Paquímetro Digital 150mm',
        quantidade: 1,
        dataAtribuicao: '2025-11-05',
        patrimonio: 'PAT-10350',
    },
    // --- TEC004 - Fernanda Oliveira ---
    {
        id: 'CAR008',
        tecnicoMatricula: 'TEC004',
        materialId: 'MAT008',
        materialNome: 'Micrômetro Externo 0-25mm',
        quantidade: 1,
        dataAtribuicao: '2025-09-10',
        patrimonio: 'PAT-10120',
    },
    {
        id: 'CAR009',
        tecnicoMatricula: 'TEC004',
        materialId: 'MAT009',
        materialNome: 'Chave Combinada 10mm',
        quantidade: 2,
        dataAtribuicao: '2025-09-10',
    },
    {
        id: 'CAR010',
        tecnicoMatricula: 'TEC004',
        materialId: 'MAT010',
        materialNome: 'Serra Tico-Tico 500W',
        quantidade: 1,
        dataAtribuicao: '2025-10-01',
        patrimonio: 'PAT-10200',
    },
    {
        id: 'CAR011',
        tecnicoMatricula: 'TEC004',
        materialId: 'MAT011',
        materialNome: 'Luva de Proteção Mecânica',
        quantidade: 2,
        dataAtribuicao: '2025-10-01',
    },
    // --- TEC006 - Camila Ferreira ---
    {
        id: 'CAR012',
        tecnicoMatricula: 'TEC006',
        materialId: 'MAT001',
        materialNome: 'Chave de Fenda Phillips 1/4"',
        quantidade: 1,
        dataAtribuicao: '2025-12-01',
        patrimonio: 'PAT-10500',
    },
    {
        id: 'CAR013',
        tecnicoMatricula: 'TEC006',
        materialId: 'MAT012',
        materialNome: 'Óculos de Proteção Ampla Visão',
        quantidade: 1,
        dataAtribuicao: '2025-12-01',
    },
    {
        id: 'CAR014',
        tecnicoMatricula: 'TEC006',
        materialId: 'MAT004',
        materialNome: 'Multímetro Digital CAT III',
        quantidade: 1,
        dataAtribuicao: '2025-12-10',
        patrimonio: 'PAT-10411',
    },
];

// ---- FUNÇÕES AUXILIARES DO MOCK ----

/** Autentica um usuário pelo matrícula e senha (unificado) */
function autenticarUsuario(matricula: string, senha: string): Usuario | null {
    return usuarios.find(
        (u) => u.matricula.toUpperCase() === matricula.toUpperCase() && u.senha === senha
    ) ?? null;
}

/** Autentica um supervisor pelo matrícula e senha (compatibilidade) */
function autenticarSupervisor(matricula: string, senha: string): Supervisor | null {
    return supervisores.find(
        (s) => s.matricula.toUpperCase() === matricula.toUpperCase() && s.senha === senha
    ) ?? null;
}

/** Busca técnico pela matrícula */
function buscarTecnico(matricula: string): Tecnico | null {
    return tecnicos.find(
        (t) => t.matricula.toUpperCase() === matricula.toUpperCase()
    ) ?? null;
}

/** Retorna os itens de carga de um técnico */
function buscarCargaTecnico(tecnicoMatricula: string): ItemCarga[] {
    return itensCarga.filter(
        (item) => item.tecnicoMatricula.toUpperCase() === tecnicoMatricula.toUpperCase()
    );
}

/** Busca um material pelo ID */
function buscarMaterial(materialId: string): Material | null {
    return materiais.find((m) => m.id === materialId) ?? null;
}

/** Retorna todos os materiais do catálogo */
function listarMateriais(): Material[] {
    return materiais;
}

/** Gera data D+N (próximo dia útil simplificado) */
export function calcularPrazo(dataSolicitacao: string, diasAdicionais = 1): string {
    // Força o horário para o meio-dia UTC para evitar problemas de fuso (-3h) caindo no dia anterior
    const data = new Date(dataSolicitacao.split('T')[0] + 'T12:00:00Z');

    let diasContados = 0;
    while (diasContados < diasAdicionais) {
        data.setUTCDate(data.getUTCDate() + 1);
        const diaSemana = data.getUTCDay(); // 0=Domingo, 6=Sábado
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasContados++;
        }
    }

    return data.toISOString().split('T')[0];
}

export function calcularPrazoD1(dataSolicitacao: string): string {
    return calcularPrazo(dataSolicitacao, 1);
}
