// ============================================================
// PÁGINA DO ESTOQUE — Painel de Controle da Ferramentaria
// Dados em tempo real via Supabase
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// ---- Ícones SVG inline ----
function IconCheck() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

function IconRefresh() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    );
}

type StatusEstoque = 'pedido_em_andamento' | 'sem_estoque' | 'liberado_retirada';

interface Troca {
    id: string;
    supervisor_nome: string;
    supervisor_matricula: string;
    tecnico_nome: string;
    tecnico_matricula: string;
    item_saida_nome: string;
    item_entrada_nome: string;
    motivo: string;
    status: StatusEstoque;
    data_troca: string;
}

async function getTrocasSupabase(): Promise<Troca[]> {
    const { data, error } = await supabase
        .from('historico_trocas')
        .select('*')
        .order('data_troca', { ascending: false });

    if (error || !data) return [];
    return data as Troca[];
}

async function atualizarStatusSupabase(id: string, status: StatusEstoque): Promise<void> {
    const { error } = await supabase
        .from('historico_trocas')
        .update({ status })
        .eq('id', id);
    if (error) throw error;
}

export default function EstoquePage() {
    const { usuario, logout } = useAuth();

    const [trocas, setTrocas] = useState<Troca[]>([]);
    const [loading, setLoading] = useState(true);
    const [atualizando, setAtualizando] = useState<string | null>(null);
    const [tabAtiva, setTabAtiva] = useState<'fila' | 'liberados' | 'sem_estoque'>('fila');
    const [sucesso, setSucesso] = useState('');
    const [erro, setErro] = useState('');

    const fetchTrocas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getTrocasSupabase();
            setTrocas(data);
        } catch {
            setErro('Erro ao carregar solicitações.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrocas();
        // Auto-refresh a cada 30 segundos
        const interval = setInterval(fetchTrocas, 30_000);
        return () => clearInterval(interval);
    }, [fetchTrocas]);

    async function handleAtualizarStatus(id: string, novoStatus: StatusEstoque) {
        setAtualizando(id);
        setErro('');
        try {
            await atualizarStatusSupabase(id, novoStatus);
            setTrocas((prev) =>
                prev.map((t) => (t.id === id ? { ...t, status: novoStatus } : t))
            );
            const mensagens: Record<StatusEstoque, string> = {
                pedido_em_andamento: 'Status atualizado para Em Andamento.',
                sem_estoque: 'Pedido marcado como Sem Estoque.',
                liberado_retirada: 'Pedido liberado para retirada!',
            };
            setSucesso(mensagens[novoStatus]);
            setTimeout(() => setSucesso(''), 4000);
        } catch {
            setErro('Erro ao atualizar status. Tente novamente.');
        } finally {
            setAtualizando(null);
        }
    }

    // Filtros por aba
    const emAndamento = trocas.filter((t) => t.status === 'pedido_em_andamento');
    const liberados = trocas.filter((t) => t.status === 'liberado_retirada');
    const semEstoque = trocas.filter((t) => t.status === 'sem_estoque');

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <img src="/logo.png" alt="FFA Infraestrutura" className="h-8 sm:h-10" />
                        <div>
                            <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">Painel Ferramentaria</h1>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-bold truncate max-w-[140px] sm:max-w-none">
                                {usuario?.nome.split(' ')[0]} · {usuario?.setor}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={fetchTrocas}
                            disabled={loading}
                            title="Atualizar lista"
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            <span className={loading ? 'animate-spin inline-block' : ''}><IconRefresh /></span>
                        </button>
                        <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-3 py-1 uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Estoque Online
                        </span>
                        <button
                            id="btn-logout"
                            onClick={logout}
                            className="text-[10px] sm:text-xs text-slate-500 hover:text-black font-black uppercase tracking-widest border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-all bg-white"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

                {/* Alertas */}
                {sucesso && (
                    <div className="mb-4 flex items-center gap-2 text-sm bg-emerald-500 text-white rounded-xl px-4 py-3 shadow-lg shadow-emerald-100 animate-in fade-in duration-200">
                        <IconCheck /> <span className="font-bold">{sucesso}</span>
                    </div>
                )}
                {erro && (
                    <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 font-bold">
                        {erro}
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div
                        onClick={() => setTabAtiva('fila')}
                        className={`cursor-pointer bg-white border-2 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${tabAtiva === 'fila' ? 'border-blue-400 shadow-md shadow-blue-100' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <IconInbox />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{emAndamento.length}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Em andamento</p>
                        </div>
                    </div>

                    <div
                        onClick={() => setTabAtiva('liberados')}
                        className={`cursor-pointer bg-white border-2 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${tabAtiva === 'liberados' ? 'border-emerald-400 shadow-md shadow-emerald-100' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <IconPackage />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{liberados.length}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Liberados</p>
                        </div>
                    </div>

                    <div
                        onClick={() => setTabAtiva('sem_estoque')}
                        className={`cursor-pointer bg-white border-2 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${tabAtiva === 'sem_estoque' ? 'border-red-400 shadow-md shadow-red-100' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.999L13.732 4.001c-.77-1.333-2.694-1.333-3.464 0L3.34 16.001C2.57 17.334 3.532 19 5.072 19z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{semEstoque.length}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Sem estoque</p>
                        </div>
                    </div>
                </div>

                {/* Lista de pedidos */}
                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Carregando...</p>
                    </div>
                ) : (
                    <TrocasList
                        trocas={
                            tabAtiva === 'fila' ? emAndamento
                                : tabAtiva === 'liberados' ? liberados
                                    : semEstoque
                        }
                        tabAtiva={tabAtiva}
                        atualizando={atualizando}
                        onAtualizarStatus={handleAtualizarStatus}
                    />
                )}
            </main>
        </div>
    );
}

// ---- Componente de lista ----
function TrocasList({
    trocas,
    tabAtiva,
    atualizando,
    onAtualizarStatus,
}: {
    trocas: Troca[];
    tabAtiva: 'fila' | 'liberados' | 'sem_estoque';
    atualizando: string | null;
    onAtualizarStatus: (id: string, status: StatusEstoque) => void;
}) {
    const emptyMessages: Record<typeof tabAtiva, { title: string; subtitle: string }> = {
        fila: { title: 'Nenhum pedido em andamento', subtitle: 'Novas solicitações dos supervisores aparecerão aqui.' },
        liberados: { title: 'Nenhum pedido liberado', subtitle: 'Pedidos liberados para retirada aparecerão aqui.' },
        sem_estoque: { title: 'Sem registros de falta', subtitle: 'Pedidos sem estoque disponível aparecerão aqui.' },
    };

    if (trocas.length === 0) {
        const msg = emptyMessages[tabAtiva];
        return (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <IconInbox />
                </div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{msg.title}</p>
                <p className="text-xs text-slate-400 mt-2">{msg.subtitle}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {trocas.map((troca) => (
                <TrocaCard
                    key={troca.id}
                    troca={troca}
                    atualizando={atualizando === troca.id}
                    onAtualizarStatus={onAtualizarStatus}
                />
            ))}
        </div>
    );
}

// ---- Card de cada troca ----
function TrocaCard({
    troca,
    atualizando,
    onAtualizarStatus,
}: {
    troca: Troca;
    atualizando: boolean;
    onAtualizarStatus: (id: string, status: StatusEstoque) => void;
}) {
    const [statusSelecionado, setStatusSelecionado] = useState<StatusEstoque>(troca.status);
    const [confirmando, setConfirmando] = useState(false);

    const idCurto = troca.id.split('-')[0].toUpperCase();
    const dataFormatada = new Date(troca.data_troca).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const labelStatus: Record<StatusEstoque, string> = {
        pedido_em_andamento: 'Pedido em andamento',
        sem_estoque: 'Sem estoque',
        liberado_retirada: 'Liberado p/ retirada',
    };

    function handleConfirmar() {
        onAtualizarStatus(troca.id, statusSelecionado);
        setConfirmando(false);
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Topo: ID + Status + Data */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[10px] font-black text-slate-300 shrink-0">#{idCurto}</span>
                    <StatusBadge status={troca.status} />
                </div>
                <span className="text-[10px] text-slate-400 font-bold shrink-0 hidden sm:block">{dataFormatada}</span>
            </div>

            {/* Corpo: informações */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Supervisor</p>
                    <p className="text-xs font-black text-slate-900 uppercase leading-tight">{troca.supervisor_nome}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{troca.supervisor_matricula}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Técnico</p>
                    <p className="text-xs font-black text-slate-900 uppercase leading-tight">{troca.tecnico_nome}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{troca.tecnico_matricula}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Item para Devolução</p>
                    <p className="text-xs font-bold text-slate-700 uppercase leading-tight">{troca.item_saida_nome}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Motivo</p>
                    <p className="text-xs font-bold text-slate-600 italic">"{troca.motivo}"</p>
                </div>
            </div>

            {/* Ações */}
            <div className="pt-4 border-t border-slate-100">
                {atualizando ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                        <span className="text-xs text-slate-500 font-bold">Atualizando...</span>
                    </div>
                ) : confirmando ? (
                    /* Modal de confirmação inline */
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 text-amber-700 grow">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-black">
                                Confirmar: <span className="italic">{labelStatus[statusSelecionado]}</span>?
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setConfirmando(false)}
                                className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmar}
                                className="text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-lg bg-black text-white hover:bg-slate-800 transition-all"
                            >
                                Sim, confirmar
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Select + botão Finalizar */
                    <div className="flex items-center gap-3">
                        <div className="relative grow max-w-xs">
                            <select
                                value={statusSelecionado}
                                onChange={(e) => setStatusSelecionado(e.target.value as StatusEstoque)}
                                className="w-full appearance-none pl-3 pr-8 py-2 text-[11px] font-black uppercase tracking-wider border-2 border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-slate-400 transition-all cursor-pointer"
                            >
                                <option value="pedido_em_andamento">🔵 Pedido em andamento</option>
                                <option value="sem_estoque">🔴 Sem estoque</option>
                                <option value="liberado_retirada">🟢 Liberado p/ retirada</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <button
                            onClick={() => setConfirmando(true)}
                            disabled={statusSelecionado === troca.status}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl bg-black text-white hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        >
                            <IconCheck />
                            Finalizar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- Badge de status ----
function StatusBadge({ status }: { status: StatusEstoque }) {
    const config: Record<StatusEstoque, { label: string; className: string; dot: string }> = {
        pedido_em_andamento: {
            label: 'Pedido em andamento',
            className: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500 animate-pulse',
        },
        sem_estoque: {
            label: 'Sem estoque',
            className: 'bg-red-50 text-red-700 border-red-200',
            dot: 'bg-red-500',
        },
        liberado_retirada: {
            label: 'Liberado p/ retirada',
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
        },
    };
    const c = config[status];
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap ${c.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
            {c.label}
        </span>
    );
}
