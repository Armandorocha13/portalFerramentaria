// ============================================================
// TESTES UNITÁRIOS — Regra de 45 Dias + SLA
// Sprint 12 — T-12.3
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupervisorPage from '../paginas/SupervisorPage';
import type { ResultadoTrocaRecente } from '../bibliotecas/database-queries';
import { verificarTrocaRecente, verificarTrocasRecentesBatch } from '../bibliotecas/database-queries';
import { supabase } from '../bibliotecas/supabase';

// ---- Mocks ----
vi.mock('../contextos/AuthContext', () => ({
    useAuth: () => ({
        usuario: { id: 'mock-sup-id', matricula: 'SUP001', nome: 'Supervisor Teste', perfil: 'supervisor', setor: 'Teste' },
        logout: vi.fn(),
    }),
}));

vi.mock('../contextos/SolicitacoesContext', () => ({
    useSolicitacoes: () => ({
        adicionarSolicitacao: vi.fn().mockReturnValue({ id: 'NEW_ID_456' }),
    }),
}));

const mockGetTecnico = vi.hoisted(() => vi.fn());
const mockGetCargaTecnico = vi.hoisted(() => vi.fn());
const mockRegistrarTroca = vi.hoisted(() => vi.fn());
const mockGetHistoricoTrocas = vi.hoisted(() => vi.fn().mockResolvedValue({ data: [], count: 0 }));
const mockVerificarTrocasRecentesBatch = vi.hoisted(() => vi.fn());

vi.mock('../bibliotecas/database-queries', () => ({
    getTecnico: mockGetTecnico,
    getCargaTecnico: mockGetCargaTecnico,
    registrarTroca: mockRegistrarTroca,
    getHistoricoTrocas: mockGetHistoricoTrocas,
    verificarTrocasRecentesBatch: mockVerificarTrocasRecentesBatch,
}));

vi.mock('../bibliotecas/supabase', () => ({
    supabase: {
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis(),
        }),
        removeChannel: vi.fn(),
    },
}));

// ---- Dados de teste ----
const TECNICO_ATIVO = { matricula: 'TEC001', nome: 'João Teste', cargo: 'Manutenção', status: 'ativo' };

const CARGA = [
    { id: 'item1', materialId: 'mat1', materialNome: 'Chave Philips', quantidade: 1, dataAtribuicao: '2025-10-10', tecnicoMatricula: 'TEC001' },
    { id: 'item2', materialId: 'mat2', materialNome: 'Alicate Universal', quantidade: 1, dataAtribuicao: '2025-10-10', tecnicoMatricula: 'TEC001' },
    { id: 'item3', materialId: 'mat3', materialNome: 'Multímetro', quantidade: 1, dataAtribuicao: '2025-11-01', tecnicoMatricula: 'TEC001' },
];

// Helper que navega até o Step 2 (seleção de item)
async function navegarAteStep2() {
    const user = userEvent.setup();
    mockGetTecnico.mockResolvedValueOnce(TECNICO_ATIVO);
    mockGetCargaTecnico.mockResolvedValueOnce(CARGA);

    render(<SupervisorPage />);

    await user.type(screen.getByPlaceholderText(/Ex: 123456/i), 'TEC001');
    await user.click(screen.getByRole('button', { name: /Validar Técnico/i }));

    await waitFor(() => {
        expect(screen.getByText('Técnico Validado')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Confirmar e Continuar/i }));

    await waitFor(() => {
        expect(screen.getByText('Selecione o Item')).toBeInTheDocument();
    });

    return user;
}

describe('Regra de 45 Dias — Trava de Troca', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve exibir badge de bloqueio ao lado de itens trocados recentemente', async () => {
        // Configurar: Chave Philips bloqueada (trocada há 12 dias)
        const trocasRecentes = new Map<string, ResultadoTrocaRecente>();
        trocasRecentes.set('Chave Philips', {
            bloqueado: true,
            diasRestantes: 33,
            dataTroca: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            dataLiberacao: '20/04/2026',
        });
        mockVerificarTrocasRecentesBatch.mockResolvedValueOnce(trocasRecentes);

        await navegarAteStep2();

        // Badge deve estar visível
        await waitFor(() => {
            expect(screen.getByText(/Trocado há 12 dias/i)).toBeInTheDocument();
        });

        // Item não-bloqueado deve aparecer normal
        expect(screen.getByText('Alicate Universal')).toBeInTheDocument();
        expect(screen.getByText('Multímetro')).toBeInTheDocument();
    });

    it('deve exibir alerta de bloqueio ao clicar em item bloqueado e NÃO avançar', async () => {
        const trocasRecentes = new Map<string, ResultadoTrocaRecente>();
        trocasRecentes.set('Chave Philips', {
            bloqueado: true,
            diasRestantes: 33,
            dataTroca: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            dataLiberacao: '20/04/2026',
        });
        mockVerificarTrocasRecentesBatch.mockResolvedValueOnce(trocasRecentes);

        const user = await navegarAteStep2();

        // Clicar no item bloqueado
        const botaoItem = screen.getByRole('button', { name: /Chave Philips/i });
        await user.click(botaoItem);

        // Deve exibir alerta, NÃO o step de motivo
        await waitFor(() => {
            expect(screen.getByText(/Item bloqueado — Regra de 45 dias/i)).toBeInTheDocument();
            expect(screen.getByText(/20\/04\/2026/i)).toBeInTheDocument();
            expect(screen.getByText(/33 dias/i)).toBeInTheDocument();
        });

        // NÃO deve ter avançado para o step de motivo
        expect(screen.queryByText('Motivo da Troca')).not.toBeInTheDocument();
    });

    it('deve permitir selecionar outro item após ver o alerta de bloqueio', async () => {
        const trocasRecentes = new Map<string, ResultadoTrocaRecente>();
        trocasRecentes.set('Chave Philips', {
            bloqueado: true,
            diasRestantes: 33,
            dataTroca: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            dataLiberacao: '20/04/2026',
        });
        mockVerificarTrocasRecentesBatch.mockResolvedValueOnce(trocasRecentes);

        const user = await navegarAteStep2();

        // Clicar no item bloqueado primeiro
        await user.click(screen.getByRole('button', { name: /Chave Philips/i }));

        await waitFor(() => {
            expect(screen.getByText(/Item bloqueado/i)).toBeInTheDocument();
        });

        // Clicar em "Selecionar outro item"
        await user.click(screen.getByText(/Selecionar outro item/i));

        // Alerta deve sumir
        await waitFor(() => {
            expect(screen.queryByText(/Item bloqueado/i)).not.toBeInTheDocument();
        });

        // Agora clicar no item livre (Alicate Universal) — deve avançar para motivo
        await user.click(screen.getByRole('button', { name: /Alicate Universal/i }));

        await waitFor(() => {
            expect(screen.getByText('Motivo da Troca')).toBeInTheDocument();
        });
    });

    it('deve permitir todos os itens se nenhum estiver bloqueado', async () => {
        // Sem bloqueio — mapa vazio
        mockVerificarTrocasRecentesBatch.mockResolvedValueOnce(new Map());

        const user = await navegarAteStep2();

        // Nenhum badge de bloqueio
        expect(screen.queryByText(/Trocado há/i)).not.toBeInTheDocument();

        // Clicar em qualquer item deve funcionar
        await user.click(screen.getByRole('button', { name: /Multímetro/i }));

        await waitFor(() => {
            expect(screen.getByText('Motivo da Troca')).toBeInTheDocument();
        });
    });
});
