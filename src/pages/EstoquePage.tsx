// ============================================================
// PÁGINA DO ESTOQUE — Painel de Controle da Ferramentaria
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSolicitacoes } from '../context/SolicitacoesContext';

// ---- Ícones SVG inline ----
function IconCheck() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

function IconClock() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
    );
}

function IconInbox() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
    );
}

function IconPackage() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    );
}

function IconAlert() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.999L13.732 4.001c-.77-1.333-2.694-1.333-3.464 0L3.34 16.001C2.57 17.334 3.532 19 5.072 19z" />
        </svg>
    );
}

/** Calcula as horas restantes até o prazo D+1 (em horas úteis simplificado) */
function calcularHorasRestantes(prazoResolucao: string): number {
    const agora = new Date();
    const prazo = new Date(prazoResolucao + 'T18:00:00'); // fim do expediente
    const diffMs = prazo.getTime() - agora.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
}

/** Retorna a classificação de urgência baseada nas horas restantes */
function classificarUrgencia(horasRestantes: number): 'critico' | 'urgente' | 'normal' {
    if (horasRestantes <= 4) return 'critico';
    if (horasRestantes <= 12) return 'urgente';
    return 'normal';
}

export default function EstoquePage() {
    const { usuario, logout } = useAuth();
    const { solicitacoes, atualizarStatus } = useSolicitacoes();
    const [tabAtiva, setTabAtiva] = useState<'fila' | 'concluidos'>('fila');
    const [confirmando, setConfirmando] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState('');
    const [, setTick] = useState(0);

    // Atualiza o timer a cada minuto
    useEffect(() => {
        const interval = setInterval(() => setTick((t) => t + 1), 60_000);
        return () => clearInterval(interval);
    }, []);

    // Separar solicitações por status
    const pendentes = useMemo(
        () => solicitacoes.filter((s) => s.status === 'pendente'),
        [solicitacoes]
    );

    const concluidas = useMemo(
        () => solicitacoes.filter((s) => s.status === 'concluida'),
        [solicitacoes]
    );

    // Métricas
    const totalPendentes = pendentes.length;
    const totalConcluidas = concluidas.length;
    const totalCriticos = pendentes.filter((s) => {
        const h = calcularHorasRestantes(s.prazoResolucao);
        return classificarUrgencia(h) === 'critico';
    }).length;

    // Finalizar pedido
    function handleFinalizar(id: string) {
        atualizarStatus(id, 'concluida');
        setConfirmando(null);
        setSucesso(`Pedido ${id} finalizado com sucesso!`);
        setTimeout(() => setSucesso(''), 4000);
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="FFA Infraestrutura" className="h-10" />
                        <div>
                            <h1 className="text-sm font-semibold text-slate-900">Painel da Ferramentaria</h1>
                            <p className="text-xs text-slate-500">{usuario?.nome} · {usuario?.setor}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Estoque Online
                        </span>
                        <button
                            id="btn-logout"
                            onClick={logout}
                            className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 rounded px-3 py-1.5 hover:border-slate-400 transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* Sucesso */}
                {sucesso && (
                    <div className="mb-6 flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md px-4 py-3">
                        <IconCheck />
                        {sucesso}
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                            <IconInbox />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{totalPendentes}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Na fila de atendimento</p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalCriticos > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                            <IconAlert />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${totalCriticos > 0 ? 'text-red-600' : 'text-slate-900'}`}>{totalCriticos}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Prazo crítico (&lt;4h)</p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                            <IconPackage />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{totalConcluidas}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Finalizados hoje</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 border-b border-slate-200 mb-6">
                    <button
                        id="tab-fila"
                        onClick={() => setTabAtiva('fila')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tabAtiva === 'fila'
                            ? 'border-black text-slate-900'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Fila de Atendimento
                        {totalPendentes > 0 && (
                            <span className="ml-2 bg-black text-white text-xs rounded-full px-2 py-0.5">
                                {totalPendentes}
                            </span>
                        )}
                    </button>
                    <button
                        id="tab-concluidos"
                        onClick={() => setTabAtiva('concluidos')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tabAtiva === 'concluidos'
                            ? 'border-black text-slate-900'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Concluídos
                        {totalConcluidas > 0 && (
                            <span className="ml-2 bg-slate-200 text-slate-700 text-xs rounded-full px-2 py-0.5">
                                {totalConcluidas}
                            </span>
                        )}
                    </button>
                </div>

                {/* ====== TAB: Fila de Atendimento ====== */}
                {tabAtiva === 'fila' && (
                    <div>
                        {pendentes.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <IconInbox />
                                </div>
                                <p className="text-sm font-medium text-slate-700">Nenhuma solicitação na fila</p>
                                <p className="text-xs text-slate-500 mt-1">As solicitações enviadas pelos supervisores aparecerão aqui.</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket</th>
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Técnico</th>
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Item de Saída</th>
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Item de Entrada</th>
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Prazo D+1</th>
                                                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendentes.map((sol) => {
                                                const horasRestantes = calcularHorasRestantes(sol.prazoResolucao);
                                                const urgencia = classificarUrgencia(horasRestantes);

                                                return (
                                                    <tr key={sol.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-4">
                                                            <p className="font-mono text-xs font-semibold text-slate-900">{sol.id}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                {new Date(sol.dataSolicitacao).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <p className="text-slate-900 font-medium">{sol.tecnicoNome}</p>
                                                            <p className="text-xs text-slate-500">{sol.tecnicoMatricula}</p>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <p className="text-slate-900">{sol.itemSaidaNome}</p>
                                                            {sol.itemSaidaPatrimonio && (
                                                                <p className="text-xs text-slate-500 mt-0.5">PAT: {sol.itemSaidaPatrimonio}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <p className="text-slate-900">{sol.materialEntradaNome}</p>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <PrazoBadge horasRestantes={horasRestantes} urgencia={urgencia} prazo={sol.prazoResolucao} />
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            {confirmando === sol.id ? (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        id={`btn-cancelar-${sol.id}`}
                                                                        onClick={() => setConfirmando(null)}
                                                                        className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-2 py-1 transition-colors"
                                                                    >
                                                                        Não
                                                                    </button>
                                                                    <button
                                                                        id={`btn-confirmar-finalizar-${sol.id}`}
                                                                        onClick={() => handleFinalizar(sol.id)}
                                                                        className="text-xs text-white bg-black rounded px-3 py-1 hover:bg-slate-800 transition-colors font-medium"
                                                                    >
                                                                        Sim, finalizar
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    id={`btn-finalizar-${sol.id}`}
                                                                    onClick={() => setConfirmando(sol.id)}
                                                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-black rounded-md px-3 py-1.5 hover:bg-slate-800 transition-colors"
                                                                >
                                                                    <IconCheck />
                                                                    Finalizar Pedido
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ====== TAB: Concluídos ====== */}
                {tabAtiva === 'concluidos' && (
                    <div>
                        {concluidas.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <IconPackage />
                                </div>
                                <p className="text-sm font-medium text-slate-700">Nenhum pedido finalizado</p>
                                <p className="text-xs text-slate-500 mt-1">Os pedidos finalizados aparecerão nesta lista.</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket</th>
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Técnico</th>
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Item de Saída</th>
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Item de Entrada</th>
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Solicitado em</th>
                                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {concluidas.map((sol) => (
                                                <tr key={sol.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">{sol.id}</td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-slate-900 font-medium">{sol.tecnicoNome}</p>
                                                        <p className="text-xs text-slate-500">{sol.tecnicoMatricula}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700">{sol.itemSaidaNome}</td>
                                                    <td className="px-4 py-3 text-slate-700">{sol.materialEntradaNome}</td>
                                                    <td className="px-4 py-3 text-slate-500">{new Date(sol.dataSolicitacao).toLocaleDateString('pt-BR')}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">
                                                            <IconCheck />
                                                            Concluído
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

// ---- Componentes auxiliares ----

function PrazoBadge({ horasRestantes, urgencia, prazo }: { horasRestantes: number; urgencia: 'critico' | 'urgente' | 'normal'; prazo: string }) {
    const styles = {
        critico: 'bg-red-50 text-red-700 border-red-200',
        urgente: 'bg-amber-50 text-amber-700 border-amber-200',
        normal: 'bg-slate-50 text-slate-700 border-slate-200',
    };

    const labels = {
        critico: 'Crítico',
        urgente: 'Atenção',
        normal: 'No prazo',
    };

    return (
        <div className="space-y-1">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${styles[urgencia]}`}>
                <IconClock />
                {horasRestantes > 0 ? `${horasRestantes}h restantes` : 'Vencido'}
            </span>
            <p className="text-xs text-slate-500">
                {new Date(prazo).toLocaleDateString('pt-BR')} · {labels[urgencia]}
            </p>
        </div>
    );
}
