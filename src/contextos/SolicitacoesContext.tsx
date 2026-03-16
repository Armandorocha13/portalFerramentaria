// ============================================================
// CONTEXT — Gerenciamento de Estado das Solicitações de Troca
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SolicitacaoTroca, SolicitacaoStatus } from '../tipos';

interface SolicitacoesContextData {
    solicitacoes: SolicitacaoTroca[];
    adicionarSolicitacao: (solicitacao: Omit<SolicitacaoTroca, 'id' | 'sequencial'>) => SolicitacaoTroca;
    atualizarStatus: (id: string, status: SolicitacaoStatus) => void;
    buscarPorSupervisor: (supervisorMatricula: string) => SolicitacaoTroca[];
    proximoSequencial: number;
}

const SolicitacoesContext = createContext<SolicitacoesContextData | undefined>(undefined);

export function SolicitacoesProvider({ children }: { children: ReactNode }) {
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoTroca[]>([]);
    const [sequencial, setSequencial] = useState(1);

    const adicionarSolicitacao = useCallback(
        (dados: Omit<SolicitacaoTroca, 'id' | 'sequencial'>): SolicitacaoTroca => {
            const novaSolicitacao: SolicitacaoTroca = {
                ...dados,
                id: `SOL-${String(sequencial).padStart(5, '0')}`,
                sequencial,
            };

            setSolicitacoes((prev) => [novaSolicitacao, ...prev]);
            setSequencial((prev) => prev + 1);

            return novaSolicitacao;
        },
        [sequencial]
    );

    const atualizarStatus = useCallback((id: string, status: SolicitacaoStatus) => {
        setSolicitacoes((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status } : s))
        );
    }, []);

    const buscarPorSupervisor = useCallback(
        (supervisorMatricula: string) => {
            return solicitacoes.filter(
                (s) => s.supervisorMatricula === supervisorMatricula
            );
        },
        [solicitacoes]
    );

    return (
        <SolicitacoesContext.Provider
            value={{
                solicitacoes,
                adicionarSolicitacao,
                atualizarStatus,
                buscarPorSupervisor,
                proximoSequencial: sequencial,
            }}
        >
            {children}
        </SolicitacoesContext.Provider>
    );
}

export function useSolicitacoes(): SolicitacoesContextData {
    const context = useContext(SolicitacoesContext);
    if (!context) {
        throw new Error('useSolicitacoes deve ser utilizado dentro de um SolicitacoesProvider');
    }
    return context;
}
