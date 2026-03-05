// ============================================================
// PÁGINA DO ESTOQUE — Painel de Controle da Ferramentaria
// Design minimalista funcional
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useDebounce } from '../hooks/useDebounce';

type StatusEstoque = 'pedido_em_andamento' | 'sem_estoque' | 'liberado_retirada' | 'retirado';

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
    prazo_expirado: boolean;
}

const LIMITE_RETIRADA_MS = 24 * 60 * 60 * 1000;

async function getTrocasSupabase(): Promise<Troca[]> {
    const { data, error } = await supabase
        .from('historico_trocas')
        .select('*')
        .order('data_troca', { ascending: false });
    if (error || !data) return [];
    return data as Troca[];
}

async function atualizarStatusSupabase(id: string, status: StatusEstoque, prazo_expirado = false): Promise<void> {
    const { error } = await supabase
        .from('historico_trocas')
        .update({ status, prazo_expirado })
        .eq('id', id);
    if (error) throw error;
}

const LABEL_STATUS: Record<StatusEstoque, string> = {
    pedido_em_andamento: 'Em andamento',
    sem_estoque: 'Sem estoque',
    liberado_retirada: 'Liberado p/ retirada',
    retirado: 'Finalizado',
};

// ---- Badge de Status ----
function StatusBadge({ status }: { status: StatusEstoque }) {
    const styles: Record<StatusEstoque, string> = {
        pedido_em_andamento: 'bg-blue-50 text-blue-700 border-blue-200',
        sem_estoque: 'bg-red-50 text-red-700 border-red-200',
        liberado_retirada: 'bg-green-50 text-green-700 border-green-200',
        retirado: 'bg-gray-100 text-gray-500 border-gray-200',
    };
    const dots: Record<StatusEstoque, string> = {
        pedido_em_andamento: 'bg-blue-500 animate-pulse',
        sem_estoque: 'bg-red-500',
        liberado_retirada: 'bg-green-500',
        retirado: 'bg-gray-400',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
            {LABEL_STATUS[status]}
        </span>
    );
}

// ---- Countdown prazo retirada ----
function PrazoRetirada({ dataLiberacao }: { dataLiberacao: string }) {
    const [agora, setAgora] = React.useState(Date.now());
    React.useEffect(() => {
        const t = setInterval(() => setAgora(Date.now()), 60_000);
        return () => clearInterval(t);
    }, []);

    const prazo = new Date(dataLiberacao).getTime() + LIMITE_RETIRADA_MS;
    const diffMs = prazo - agora;

    if (diffMs <= 0) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap">
                ⏱ Prazo expirado
            </span>
        );
    }

    const horas = Math.floor(diffMs / 3_600_000);
    const mins = Math.floor((diffMs % 3_600_000) / 60_000);
    const urgente = diffMs < 2 * 3_600_000;
    const cor = urgente ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200';

    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${cor}`}>
            ⏱ {horas > 0 ? `${horas}h ${mins}min` : `${mins}min`} restante
        </span>
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
    onAtualizarStatus: (id: string, status: StatusEstoque, expirado?: boolean) => void;
}) {
    const [statusSelecionado, setStatusSelecionado] = useState<StatusEstoque>(troca.status);
    const [confirmando, setConfirmando] = useState(false);
    const [confirmandoRetirada, setConfirmandoRetirada] = useState(false);

    // Sincroniza o select quando o status muda externamente (ex: polling)
    useEffect(() => {
        if (!confirmando) setStatusSelecionado(troca.status);
    }, [troca.status, confirmando]);

    const idCurto = troca.id.split('-')[0].toUpperCase();
    const dataFormatada = new Date(troca.data_troca).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    function handleConfirmar() {
        const novoStatus: StatusEstoque = confirmandoRetirada ? 'retirado' : statusSelecionado;
        onAtualizarStatus(troca.id, novoStatus);
        setConfirmando(false);
        setConfirmandoRetirada(false);
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
            {/* Cabeçalho do card */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">#{idCurto}</span>
                    <StatusBadge status={troca.status} />
                    {troca.status === 'liberado_retirada' && !troca.prazo_expirado && (
                        <PrazoRetirada dataLiberacao={troca.data_troca} />
                    )}
                    {troca.prazo_expirado && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap">
                            ⏱ Prazo expirado
                        </span>
                    )}
                </div>
                <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{dataFormatada}</span>
            </div>

            {/* Informações */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Supervisor</p>
                    <p className="text-sm font-semibold text-gray-800">{troca.supervisor_nome}</p>
                    <p className="text-xs text-gray-400">{troca.supervisor_matricula}</p>
                </div>
                <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Técnico</p>
                    <p className="text-sm font-semibold text-gray-800">{troca.tecnico_nome}</p>
                    <p className="text-xs text-gray-400">{troca.tecnico_matricula}</p>
                </div>
                <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Item / Devolução</p>
                    <p className="text-sm text-gray-700">{troca.item_saida_nome}</p>
                </div>
                <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Motivo</p>
                    <p className="text-sm text-gray-600">{troca.motivo}</p>
                </div>
            </div>

            {/* Ações */}
            <div className="pt-3 border-t border-gray-100">
                {atualizando ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        Atualizando...
                    </div>
                ) : troca.status === 'retirado' ? (
                    <span className="text-sm text-green-600 font-medium">✓ Retirada confirmada — pedido finalizado</span>
                ) : confirmando ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                        <span className="text-sm text-gray-700 grow">
                            {confirmandoRetirada
                                ? 'Confirmar retirada do item? Isso irá finalizar o pedido.'
                                : <>Confirmar mudança para: <strong>{LABEL_STATUS[statusSelecionado]}</strong>?</>}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => { setConfirmando(false); setConfirmandoRetirada(false); }}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmar}
                                className="text-xs px-4 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={statusSelecionado}
                            onChange={(e) => setStatusSelecionado(e.target.value as StatusEstoque)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
                        >
                            <option value="pedido_em_andamento">Em andamento</option>
                            <option value="sem_estoque">Sem estoque</option>
                            <option value="liberado_retirada">Liberado p/ retirada</option>
                        </select>
                        <button
                            onClick={() => setConfirmando(true)}
                            disabled={statusSelecionado === troca.status}
                            className="text-xs px-4 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Atualizar
                        </button>
                        {troca.status === 'liberado_retirada' && (
                            <button
                                onClick={() => { setConfirmandoRetirada(true); setConfirmando(true); }}
                                className="text-xs px-4 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                            >
                                ✓ Confirmar Retirada
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- Lista com filtros, paginação e export ----
const ITENS_POR_PAGINA = 10;

function TrocasList({
    trocas,
    tabAtiva,
    atualizando,
    onAtualizarStatus,
    todosOsDados,
}: {
    trocas: Troca[];
    tabAtiva: 'fila' | 'liberados' | 'sem_estoque' | 'finalizados';
    atualizando: string | null;
    onAtualizarStatus: (id: string, status: StatusEstoque, expirado?: boolean) => void;
    todosOsDados: Troca[];
}) {
    const [busca, setBusca] = useState('');
    const debouncedBusca = useDebounce(busca, 300);
    const [filtroData, setFiltroData] = useState('');
    const [pagina, setPagina] = useState(1);
    const [exportStatus, setExportStatus] = useState('todos');

    React.useEffect(() => { setPagina(1); }, [tabAtiva, debouncedBusca, filtroData]);

    const filtrados = useMemo(() => {
        const q = debouncedBusca.toLowerCase().trim();
        return trocas.filter((t) => {
            const matchBusca = !q ||
                t.tecnico_nome?.toLowerCase().includes(q) ||
                t.tecnico_matricula?.toLowerCase().includes(q) ||
                t.supervisor_nome?.toLowerCase().includes(q) ||
                t.supervisor_matricula?.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q);
            const matchData = !filtroData || t.data_troca?.startsWith(filtroData);
            return matchBusca && matchData;
        });
    }, [trocas, debouncedBusca, filtroData]);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const paginados = filtrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

    async function exportarXLSX() {
        // Dynamic import: a biblioteca pesada só será baixada quando (e se) o usuário clicar no botão
        const XLSX = await import('xlsx');

        const dados = exportStatus === 'todos' ? todosOsDados : todosOsDados.filter((t) => t.status === exportStatus);
        const linhas = dados.map((t) => ({
            'ID': t.id.split('-')[0].toUpperCase(),
            'Supervisor': t.supervisor_nome,
            'Matrícula Supervisor': t.supervisor_matricula,
            'Técnico': t.tecnico_nome,
            'Matrícula Técnico': t.tecnico_matricula,
            'Item Devolução': t.item_saida_nome,
            'Motivo': t.motivo,
            'Status': LABEL_STATUS[t.status] ?? t.status,
            'Prazo Expirado': t.prazo_expirado ? 'Sim' : 'Não',
            'Data': new Date(t.data_troca).toLocaleDateString('pt-BR'),
        }));
        const ws = XLSX.utils.json_to_sheet(linhas);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
        XLSX.writeFile(wb, `pedidos_estoque_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    const emptyMsg: Record<typeof tabAtiva, string> = {
        fila: 'Nenhum pedido em andamento',
        liberados: 'Nenhum pedido liberado',
        sem_estoque: 'Sem registros de falta de estoque',
        finalizados: 'Nenhum pedido finalizado ainda',
    };

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative grow">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                    </svg>
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por técnico, supervisor, matrícula ou ID..."
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                </div>
                <input
                    type="date"
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                />
                {(busca || filtroData) && (
                    <button
                        onClick={() => { setBusca(''); setFiltroData(''); }}
                        className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors whitespace-nowrap"
                    >
                        Limpar
                    </button>
                )}
                <div className="flex items-center shrink-0">
                    <select
                        value={exportStatus}
                        onChange={(e) => setExportStatus(e.target.value)}
                        className="text-sm border border-gray-200 rounded-l-lg px-2 py-2 bg-white text-gray-600 focus:outline-none cursor-pointer"
                    >
                        <option value="todos">Todos</option>
                        <option value="pedido_em_andamento">Em andamento</option>
                        <option value="liberado_retirada">Liberados</option>
                        <option value="sem_estoque">Sem estoque</option>
                        <option value="retirado">Finalizados</option>
                    </select>
                    <button
                        onClick={exportarXLSX}
                        disabled={todosOsDados.length === 0}
                        className="flex items-center gap-1.5 text-sm px-3 py-2 border border-l-0 border-gray-200 rounded-r-lg text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Excel
                    </button>
                </div>
            </div>

            {/* Lista */}
            {filtrados.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <p className="text-sm text-gray-400 font-medium">
                        {trocas.length === 0 ? emptyMsg[tabAtiva] : 'Nenhum resultado encontrado'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {paginados.map((troca) => (
                            <TrocaCard
                                key={troca.id}
                                troca={troca}
                                atualizando={atualizando === troca.id}
                                onAtualizarStatus={onAtualizarStatus}
                            />
                        ))}
                    </div>

                    {totalPaginas > 1 && (
                        <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-white">
                            <span className="text-xs text-gray-400">
                                Pág. {paginaAtual} de {totalPaginas} · {filtrados.length} pedidos
                            </span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPagina(1)} disabled={paginaAtual === 1}
                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" /></svg>
                                </button>
                                <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1}
                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                    const inicio = Math.max(1, Math.min(paginaAtual - 2, totalPaginas - 4));
                                    const num = inicio + i;
                                    return num <= totalPaginas ? (
                                        <button key={num} onClick={() => setPagina(num)}
                                            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${num === paginaAtual ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                            {num}
                                        </button>
                                    ) : null;
                                })}
                                <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas}
                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                                <button onClick={() => setPagina(totalPaginas)} disabled={paginaAtual === totalPaginas}
                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ---- Página principal ----
export default function EstoquePage() {
    const { usuario, logout } = useAuth();

    const [trocas, setTrocas] = useState<Troca[]>([]);
    const [loading, setLoading] = useState(true);
    const [atualizando, setAtualizando] = useState<string | null>(null);
    const [tabAtiva, setTabAtiva] = useState<'fila' | 'liberados' | 'sem_estoque' | 'finalizados'>('fila');
    const [sucesso, setSucesso] = useState('');
    const [erro, setErro] = useState('');

    // Modal alterar senha
    const [showSenha, setShowSenha] = useState(false);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [senhaNova, setSenhaNova] = useState('');
    const [senhaConfirm, setSenhaConfirm] = useState('');
    const [senhaErro, setSenhaErro] = useState('');
    const [senhaSucesso, setSenhaSucesso] = useState('');
    const [salvandoSenha, setSalvandoSenha] = useState(false);

    const fetchTrocas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getTrocasSupabase();
            const agora = Date.now();
            const expirados = data.filter(
                (t) => t.status === 'liberado_retirada' && !t.prazo_expirado &&
                    (agora - new Date(t.data_troca).getTime() > LIMITE_RETIRADA_MS)
            );
            if (expirados.length > 0) {
                await Promise.all(expirados.map((t) => atualizarStatusSupabase(t.id, 'retirado', true)));
                const idsExpirados = new Set(expirados.map((t) => t.id));
                setTrocas(data.map((t) =>
                    idsExpirados.has(t.id) ? { ...t, status: 'retirado' as StatusEstoque, prazo_expirado: true } : t
                ));
            } else {
                setTrocas(data);
            }
        } catch {
            setErro('Erro ao carregar solicitações.');
            setTimeout(() => setErro(''), 6000);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        const startPolling = () => {
            if (!interval) interval = setInterval(fetchTrocas, 30_000);
        };

        const stopPolling = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                fetchTrocas(); // Refresh imediato ao voltar para aba
                startPolling();
            }
        };

        // Boot inicial
        fetchTrocas();
        if (!document.hidden) startPolling();

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            stopPolling();
        };
    }, [fetchTrocas]);

    async function handleAtualizarStatus(id: string, novoStatus: StatusEstoque, expirado = false) {
        setAtualizando(id);
        setErro('');
        try {
            await atualizarStatusSupabase(id, novoStatus, expirado);
            setTrocas((prev) =>
                prev.map((t) => (t.id === id ? { ...t, status: novoStatus, prazo_expirado: expirado } : t))
            );
            const mensagens: Record<StatusEstoque, string> = {
                pedido_em_andamento: 'Status atualizado para Em Andamento.',
                sem_estoque: 'Pedido marcado como Sem Estoque.',
                liberado_retirada: 'Pedido liberado para retirada!',
                retirado: 'Retirada confirmada!',
            };
            setSucesso(mensagens[novoStatus]);
            setTimeout(() => setSucesso(''), 3000);
        } catch {
            setErro('Erro ao atualizar status. Tente novamente.');
            setTimeout(() => setErro(''), 6000);
        } finally {
            setAtualizando(null);
        }
    }

    async function handleAlterarSenha(e: React.FormEvent) {
        e.preventDefault();
        setSenhaErro('');
        setSenhaSucesso('');
        if (senhaNova.length < 4) { setSenhaErro('A nova senha deve ter ao menos 4 caracteres.'); return; }
        if (senhaNova !== senhaConfirm) { setSenhaErro('As senhas não coincidem.'); return; }
        setSalvandoSenha(true);
        try {
            const { data: userData } = await supabase
                .from('usuarios_estoque')
                .select('id')
                .eq('id', usuario?.id)
                .eq('senha', senhaAtual)
                .single();
            if (!userData) { setSenhaErro('Senha atual incorreta.'); return; }
            const { error } = await supabase
                .from('usuarios_estoque')
                .update({ senha: senhaNova })
                .eq('id', usuario?.id);
            if (error) throw error;
            setSenhaSucesso('Senha alterada com sucesso!');
            setSenhaAtual(''); setSenhaNova(''); setSenhaConfirm('');
            setTimeout(() => { setSenhaSucesso(''); setShowSenha(false); }, 2000);
        } catch {
            setSenhaErro('Erro ao alterar senha.');
        } finally {
            setSalvandoSenha(false);
        }
    }

    const emAndamento = trocas.filter((t) => t.status === 'pedido_em_andamento');
    const liberados = trocas.filter((t) => t.status === 'liberado_retirada');
    const semEstoque = trocas.filter((t) => t.status === 'sem_estoque');
    const finalizados = trocas.filter((t) => t.status === 'retirado');

    const tabs: { key: typeof tabAtiva; label: string; count: number }[] = [
        { key: 'fila', label: 'Em Andamento', count: emAndamento.length },
        { key: 'liberados', label: 'Liberados', count: liberados.length },
        { key: 'sem_estoque', label: 'Sem Estoque', count: semEstoque.length },
        { key: 'finalizados', label: 'Finalizados', count: finalizados.length },
    ];

    const trocasAtuais = tabAtiva === 'fila' ? emAndamento
        : tabAtiva === 'liberados' ? liberados
            : tabAtiva === 'sem_estoque' ? semEstoque
                : finalizados;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="FFA" className="h-8" />
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-gray-800">Painel Ferramentaria</p>
                            <p className="text-xs text-gray-400">{usuario?.nome.split(' ')[0]} · {usuario?.setor}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Online
                        </span>
                        <button
                            onClick={fetchTrocas}
                            disabled={loading}
                            title="Atualizar"
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setShowSenha(true)}
                            title="Alterar senha"
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </button>
                        <button
                            id="btn-logout"
                            onClick={logout}
                            className="text-xs text-gray-500 hover:text-gray-800 font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Modal Alterar Senha */}
            {showSenha && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-semibold text-gray-800">Alterar Senha</h2>
                            <button onClick={() => { setShowSenha(false); setSenhaErro(''); setSenhaSucesso(''); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleAlterarSenha} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Senha Atual</label>
                                <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-gray-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Nova Senha</label>
                                <input type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-gray-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Confirmar Nova Senha</label>
                                <input type="password" value={senhaConfirm} onChange={e => setSenhaConfirm(e.target.value)} required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-gray-400" />
                            </div>
                            {senhaErro && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{senhaErro}</p>}
                            {senhaSucesso && <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{senhaSucesso}</p>}
                            <button type="submit" disabled={salvandoSenha}
                                className="w-full bg-gray-800 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50">
                                {salvandoSenha ? 'Salvando...' : 'Salvar Nova Senha'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* Alertas */}
                {sucesso && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        ✓ {sucesso}
                    </div>
                )}
                {erro && (
                    <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        {erro}
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setTabAtiva(tab.key)}
                            className={`text-left bg-white border rounded-xl p-4 transition-all ${tabAtiva === tab.key
                                ? 'border-gray-400 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <p className="text-2xl font-bold text-gray-800 mb-0.5">{tab.count}</p>
                            <p className="text-xs text-gray-400 font-medium">{tab.label}</p>
                        </button>
                    ))}
                </div>

                {/* Navegação de tabs */}
                <div className="flex gap-1 mb-4 border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setTabAtiva(tab.key)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tabAtiva === tab.key
                                ? 'border-gray-800 text-gray-800'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tabAtiva === tab.key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Lista de pedidos */}
                {loading ? (
                    <div className="border border-gray-200 rounded-xl p-16 text-center bg-white">
                        <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-gray-400">Carregando...</p>
                    </div>
                ) : (
                    <TrocasList
                        trocas={trocasAtuais}
                        tabAtiva={tabAtiva}
                        atualizando={atualizando}
                        onAtualizarStatus={handleAtualizarStatus}
                        todosOsDados={trocas}
                    />
                )}
            </main>
        </div>
    );
}
