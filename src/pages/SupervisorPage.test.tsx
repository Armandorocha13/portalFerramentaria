import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupervisorPage from './SupervisorPage';

// 1. Mock de Auth e dependências de Context
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        usuario: { id: 'mock-id-123', matricula: 'SUP001', nome: 'Supervisor Teste', perfil: 'supervisor' },
        logout: vi.fn(),
    }),
}));

vi.mock('../context/SolicitacoesContext', () => ({
    useSolicitacoes: () => ({
        adicionarSolicitacao: vi.fn().mockReturnValue({ id: 'NEW_ID_123' }),
    }),
}));

// 2. Mock de Database Queries
const mockGetTecnico = vi.hoisted(() => vi.fn());
const mockGetCargaTecnico = vi.hoisted(() => vi.fn());
const mockRegistrarTroca = vi.hoisted(() => vi.fn());
const mockGetHistoricoTrocas = vi.hoisted(() => vi.fn().mockResolvedValue({ data: [], count: 0 }));
const mockVerificarTrocasRecentesBatch = vi.hoisted(() => vi.fn().mockResolvedValue(new Map()));

vi.mock('../lib/database-queries', () => ({
    getTecnico: mockGetTecnico,
    getCargaTecnico: mockGetCargaTecnico,
    registrarTroca: mockRegistrarTroca,
    getHistoricoTrocas: mockGetHistoricoTrocas,
    verificarTrocasRecentesBatch: mockVerificarTrocasRecentesBatch,
}));

// 3. Mock do Supabase Client para contornar problemas de realtime WebSocket
vi.mock('../lib/supabase', () => ({
    supabase: {
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis(),
        }),
        removeChannel: vi.fn(),
    },
}));

describe('SupervisorPage - Fluxo do Stepper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar tela inicial com a tab Nova Solicitação e Stepper step 1', async () => {
        render(<SupervisorPage />);
        expect(screen.getByText('Identificação do Técnico')).toBeInTheDocument();
        expect(screen.getByLabelText(/Matrícula do Técnico/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Validar Técnico/i })).toBeInTheDocument();
    });

    it('deve mostrar erro quando buscar um técnico inválido', async () => {
        const user = userEvent.setup();
        // Técnico não encontrado
        mockGetTecnico.mockResolvedValueOnce(null);

        render(<SupervisorPage />);

        const inputMatricula = screen.getByPlaceholderText(/Ex: 123456/i);
        await user.type(inputMatricula, 'INVALIDO_123');

        const botaoValidar = screen.getByRole('button', { name: /Validar Técnico/i });
        await user.click(botaoValidar);

        // Deve mostrar a mensagem de erro
        await waitFor(() => {
            expect(screen.getByText(/Técnico não encontrado na sua equipe/i)).toBeInTheDocument();
        });
    });

    it('deve avançar no stepper ao validar um técnico ativo e exibir sua carga', async () => {
        const user = userEvent.setup();

        // Mocks de Sucesso
        const mockTecnico = { matricula: 'TEC001', nome: 'João Técnico', cargo: 'Manutenção', status: 'ativo' };
        mockGetTecnico.mockResolvedValueOnce(mockTecnico);

        const mockCarga = [
            { id: 'item1', materialId: 'mat1', materialNome: 'Chave Philips', quantidade: 1, dataAtribuicao: '2025-10-10' }
        ];
        mockGetCargaTecnico.mockResolvedValueOnce(mockCarga);

        render(<SupervisorPage />);

        // Step 1: Inserir matrícula válida e submeter
        await user.type(screen.getByPlaceholderText(/Ex: 123456/i), 'TEC001');
        await user.click(screen.getByRole('button', { name: /Validar Técnico/i }));

        await waitFor(() => {
            expect(screen.getByText('Técnico Validado')).toBeInTheDocument();
            expect(screen.getByText('João Técnico')).toBeInTheDocument();
        });

        // Step 2 para 3: Confirmar técnico e ir para seleção de item
        await user.click(screen.getByRole('button', { name: /Confirmar e Continuar/i }));

        // E exibir a lista de ferramentas (carga do técnico)
        await waitFor(() => {
            expect(screen.getByText('Chave Philips')).toBeInTheDocument();
        });

        // Step 3: Selecionar a ferramenta de saída clicando no card inteiro da ferramenta
        await user.click(screen.getByRole('button', { name: /Chave Philips/i }));

        // Step 4 (Motivo da Troca)
        await waitFor(() => {
            expect(screen.getByText('Motivo da Troca')).toBeInTheDocument();
        });

        // Step 3: Selecionar um motivo
        const selectMotivo = screen.getByRole('combobox');
        await user.selectOptions(selectMotivo, 'Desgaste');
        await user.click(screen.getByRole('button', { name: /Revisar e Finalizar/i }));

        // Deve chegar no Step 5 Confirmação (Resumo Final)
        await waitFor(() => {
            expect(screen.getByText('Resumo Final')).toBeInTheDocument();
            expect(screen.getByText(/Chave Philips/i)).toBeInTheDocument();
            expect(screen.getByText(/Desgaste/i)).toBeInTheDocument();
        });

        // Realizar o Mock da inserção final
        mockRegistrarTroca.mockResolvedValueOnce({ id: 'NEW_ID', status: 'pedido_em_andamento' });

        // Clicar em "Registrar Troca"
        await user.click(screen.getByRole('button', { name: /Registrar Troca/i }));

        // Step 5: Alerta de Sucesso renderizado na tela principal e Step resetado para 0
        await waitFor(() => {
            expect(screen.getByText(/registrada com sucesso!/i)).toBeInTheDocument();
        });

        // Garantir que gravou no banco com as informações corretas
        expect(mockRegistrarTroca).toHaveBeenCalledWith(
            expect.objectContaining({
                supervisor_id: 'mock-id-123',
                supervisor_matricula: 'SUP001',
                tecnico_matricula: 'TEC001',
                item_saida_id: 'item1',
                motivo: 'Desgaste'
            })
        );
    });

});
