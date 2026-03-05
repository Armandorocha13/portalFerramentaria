// ============================================================
// PÁGINA DO ESTOQUE — Painel de Controle da Ferramentaria
// Dados em tempo real via Supabase
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
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

const LIMITE_RETIRADA_MS = 24 * 60 * 60 * 1000; // 24 horas em ms

function estaExpirado(troca: Troca): boolean {
    if (troca.status !== 'liberado_retirada') return false;
    return Date.now() - new Date(troca.data_troca).getTime() > LIMITE_RETIRADA_MS;
}

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

export default function EstoquePage() {
    const { usuario, logout } = useAuth();

    const [trocas, setTrocas] = useState<Troca[]>([]);
    const [loading, setLoading] = useState(true);
    const [atualizando, setAtualizando] = useState<string | null>(null);
    const [tabAtiva, setTabAtiva] = useState<'fila' | 'liberados' | 'sem_estoque' | 'finalizados'>('fila');
    const [sucesso, setSucesso] = useState('');
    const [erro, setErro] = useState('');

    const fetchTrocas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getTrocasSupabase();

            // Auto-expirar pedidos liberados há mais de 24h
            const agora = Date.now();
            const expirados = data.filter(
                (t) => t.status === 'liberado_retirada' && !t.prazo_expirado &&
                    (agora - new Date(t.data_troca).getTime() > LIMITE_RETIRADA_MS)
            );

            if (expirados.length > 0) {
                // Atualiza todos em paralelo no Supabase
                await Promise.all(
                    expirados.map((t) => atualizarStatusSupabase(t.id, 'retirado', true))
                );
                // Atualiza localmente
                const idsExpirados = new Set(expirados.map((t) => t.id));
                setTrocas(
                    data.map((t) =>
                        idsExpirados.has(t.id)
                            ? { ...t, status: 'retirado' as StatusEstoque, prazo_expirado: true }
                            : t
                    )
                );
            } else {
                setTrocas(data);
            }
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
                retirado: 'Retirada confirmada! Pedido finalizado.',
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
    const finalizados = trocas.filter((t) => t.status === 'retirado');

    // ---- Troca de senha ----
    const [showSenha, setShowSenha] = useState(false);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [senhaNova, setSenhaNova] = useState('');
    const [senhaConfirm, setSenhaConfirm] = useState('');
    const [senhaErro, setSenhaErro] = useState('');
    const [senhaSucesso, setSenhaSucesso] = useState('');
    const [salvandoSenha, setSalvandoSenha] = useState(false);

    async function handleAlterarSenha(e: React.FormEvent) {
        e.preventDefault();
        setSenhaErro('');
        setSenhaSucesso('');
        if (senhaNova.length < 4) { setSenhaErro('A nova senha deve ter ao menos 4 caracteres.'); return; }
        if (senhaNova !== senhaConfirm) { setSenhaErro('As senhas não coincidem.'); return; }
        setSalvandoSenha(true);
        try {
            // Valida senha atual
            const { data: userData } = await supabase
                .from('usuarios_estoque')
                .select('id')
                .eq('id', usuario?.id)
                .eq('senha', senhaAtual)
                .single();
            if (!userData) { setSenhaErro('Senha atual incorreta.'); return; }
            // Atualiza senha
            const { error } = await supabase
                .from('usuarios_estoque')
                .update({ senha: senhaNova })
                .eq('id', usuario?.id);
            if (error) throw error;
            setSenhaSucesso('Senha alterada com sucesso!');
            setSenhaAtual(''); setSenhaNova(''); setSenhaConfirm('');
            setTimeout(() => { setSenhaSucesso(''); setShowSenha(false); }, 2000);
        } catch {
            setSenhaErro('Erro ao alterar senha. Tente novamente.');
        } finally {
            setSalvandoSenha(false);
        }
    }

    return (
        <div className="min-h-screen bg-woodsmoke-50">
            {/* Header */}
            <header className="bg-woodsmoke-50 border-b border-woodsmoke-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <img src="/logo.png" alt="FFA Infraestrutura" className="h-8 sm:h-10" />
                        <div>
                            <h1 className="text-xs sm:text-sm font-black text-woodsmoke-900 leading-tight uppercase tracking-tight">Painel Ferramentaria</h1>
                            <p className="text-[10px] sm:text-xs text-woodsmoke-500 font-bold truncate max-w-[140px] sm:max-w-none">
                                {usuario?.nome.split(' ')[0]} · {usuario?.setor}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={fetchTrocas}
                            disabled={loading}
                            title="Atualizar lista"
                            className="p-2 rounded-lg border border-woodsmoke-200 text-woodsmoke-500 hover:text-woodsmoke-800 hover:bg-woodsmoke-50 transition-all disabled:opacity-50"
                        >
                            <span className={loading ? 'animate-spin inline-block' : ''}><IconRefresh /></span>
                        </button>
                        {/* Botão Alterar Senha */}
                        <button
                            onClick={() => setShowSenha(true)}
                            title="Alterar senha"
                            className="p-2 rounded-lg border border-woodsmoke-200 text-woodsmoke-500 hover:text-woodsmoke-800 hover:bg-woodsmoke-50 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </button>
                        <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-surface-600 bg-surface-50 rounded-full px-3 py-1 uppercase tracking-wider border border-surface-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Estoque Online
                        </span>
                        <button
                            id="btn-logout"
                            onClick={logout}
                            className="text-[10px] sm:text-xs text-woodsmoke-500 hover:text-woodsmoke-950 font-black uppercase tracking-widest border border-woodsmoke-200 rounded-lg px-3 py-2 hover:bg-woodsmoke-50 transition-all bg-woodsmoke-50"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Modal Alterar Senha */}
            {showSenha && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="bg-woodsmoke-50 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-black text-woodsmoke-900 uppercase tracking-tight">Alterar Senha</h2>
                            <button onClick={() => { setShowSenha(false); setSenhaErro(''); setSenhaSucesso(''); }} className="text-woodsmoke-400 hover:text-woodsmoke-700 text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleAlterarSenha} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-woodsmoke-400 uppercase tracking-widest">Senha Atual</label>
                                <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required
                                    className="w-full px-4 py-3 border-2 border-woodsmoke-100 rounded-xl text-sm font-bold text-woodsmoke-900 focus:outline-none focus:border-woodsmoke-950 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-woodsmoke-400 uppercase tracking-widest">Nova Senha</label>
                                <input type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} required
                                    className="w-full px-4 py-3 border-2 border-woodsmoke-100 rounded-xl text-sm font-bold text-woodsmoke-900 focus:outline-none focus:border-woodsmoke-950 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-woodsmoke-400 uppercase tracking-widest">Confirmar Nova Senha</label>
                                <input type="password" value={senhaConfirm} onChange={e => setSenhaConfirm(e.target.value)} required
                                    className="w-full px-4 py-3 border-2 border-woodsmoke-100 rounded-xl text-sm font-bold text-woodsmoke-900 focus:outline-none focus:border-woodsmoke-950 transition-all" />
                            </div>
                            {senhaErro && <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{senhaErro}</p>}
                            {senhaSucesso && <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">{senhaSucesso}</p>}
                            <button type="submit" disabled={salvandoSenha}
                                className="w-full bg-woodsmoke-950 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl hover:bg-woodsmoke-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {salvandoSenha ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</> : 'Salvar Nova Senha'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

                {/* Alertas */}
                {sucesso && (
                    <div className="mb-4 flex items-center gap-2 text-sm bg-brand-700 text-white rounded-xl px-4 py-3 shadow-md animate-in fade-in duration-200">
                        <IconCheck /> <span className="font-semibold">{sucesso}</span>
                    </div>
                )}
                {erro && (
                    <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 font-bold">
                        {erro}
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    {/* KPI: Em andamento */}
                    <div onClick={() => setTabAtiva('fila')}
                        className={`cursor-pointer bg-white border-2 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${tabAtiva === 'fila' ? 'border-brand-300 shadow-card-md' : 'border-surface-200 hover:border-surface-300'}`}>
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0"><IconInbox /></div>
                        <div>
                            <p className="text-2xl font-black text-surface-800">{emAndamento.length}</p>
                            <p className="text-[10px] sm:text-xs text-surface-400 font-semibold uppercase tracking-wider">Em andamento</p>
                        </div>
                    </div>

                    {/* KPI: Liberados */}
                    <div onClick={() => setTabAtiva('liberados')}
                        className={`cursor-pointer bg-white border-2 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${tabAtiva === 'liberados' ? 'border-brand-300 shadow-card-md' : 'border-surface-200 hover:border-surface-300'}`}>
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 shrink-0"><IconPackage /></div>
                        <div>
                            <p className="text-2xl font-black text-surface-800">{liberados.length}</p>
                            <p className="text-[10px] sm:text-xs text-surface-400 font-semibold uppercase tracking-wider">Liberados</p>
                        </div>
                    </div>

                    {/* KPI: Sem estoque */}
                    <div onClick={() => setTabAtiva('sem_estoque')}
                        className={`cursor-pointer bg-white border-2 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${tabAtiva === 'sem_estoque' ? 'border-red-200 shadow-card-md' : 'border-surface-200 hover:border-surface-300'}`}>
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.999L13.732 4.001c-.77-1.333-2.694-1.333-3.464 0L3.34 16.001C2.57 17.334 3.532 19 5.072 19z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-surface-800">{semEstoque.length}</p>
                            <p className="text-[10px] sm:text-xs text-surface-400 font-semibold uppercase tracking-wider">Sem estoque</p>
                        </div>
                    </div>

                    {/* KPI: Finalizados */}
                    <div onClick={() => setTabAtiva('finalizados')}
                        className={`cursor-pointer bg-white border-2 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${tabAtiva === 'finalizados' ? 'border-surface-400 shadow-card-md' : 'border-surface-200 hover:border-surface-300'}`}>
                        <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-surface-800">{finalizados.length}</p>
                            <p className="text-[10px] sm:text-xs text-surface-400 font-semibold uppercase tracking-wider">Finalizados</p>
                        </div>
                    </div>
                </div>

                {/* Lista de pedidos */}
                {loading ? (
                    <div className="bg-woodsmoke-50 border border-woodsmoke-200 rounded-2xl p-16 text-center">
                        <div className="w-8 h-8 border-2 border-woodsmoke-200 border-t-woodsmoke-700 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm text-woodsmoke-400 font-bold uppercase tracking-widest">Carregando...</p>
                    </div>
                ) : (
                    <TrocasList
                        trocas={
                            tabAtiva === 'fila' ? emAndamento
                                : tabAtiva === 'liberados' ? liberados
                                    : tabAtiva === 'sem_estoque' ? semEstoque
                                        : finalizados
                        }
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

const ITENS_POR_PAGINA_EST = 10;

const LABEL_STATUS_EST: Record<string, string> = {
    pedido_em_andamento: 'Em andamento',
    sem_estoque: 'Sem estoque',
    liberado_retirada: 'Liberado p/ retirada',
    retirado: 'Finalizado',
};

function exportarXLSXEstoque(dados: Troca[], statusFiltro: string) {
    const filtrado = statusFiltro === 'todos' ? dados : dados.filter((t) => t.status === statusFiltro);
    const linhas = filtrado.map((t) => ({
        'ID': t.id.split('-')[0].toUpperCase(),
        'Supervisor': t.supervisor_nome,
        'Matr\u00edcula Supervisor': t.supervisor_matricula,
        'T\u00e9cnico': t.tecnico_nome,
        'Matr\u00edcula T\u00e9cnico': t.tecnico_matricula,
        'Item Devolu\u00e7\u00e3o': t.item_saida_nome,
        'Motivo': t.motivo,
        'Status': LABEL_STATUS_EST[t.status] ?? t.status,
        'Prazo Expirado': t.prazo_expirado ? 'Sim' : 'N\u00e3o',
        'Data': new Date(t.data_troca).toLocaleDateString('pt-BR'),
    }));
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    const sufixo = statusFiltro === 'todos' ? 'todos' : LABEL_STATUS_EST[statusFiltro]?.replace(/\s/g, '_').toLowerCase() ?? statusFiltro;
    XLSX.writeFile(wb, `pedidos_estoque_${sufixo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ---- Componente de lista com filtros, paginacao e export ----
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
    const [filtroData, setFiltroData] = useState('');
    const [pagina, setPagina] = useState(1);
    const [exportStatus, setExportStatus] = useState('todos');

    // Resetar página ao mudar aba ou filtros
    React.useEffect(() => { setPagina(1); }, [tabAtiva, busca, filtroData]);

    const filtrados = useMemo(() => {
        const q = busca.toLowerCase().trim();
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
    }, [trocas, busca, filtroData]);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA_EST));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const paginados = filtrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA_EST, paginaAtual * ITENS_POR_PAGINA_EST);

    const emptyMessages: Record<typeof tabAtiva, { title: string; subtitle: string }> = {
        fila: { title: 'Nenhum pedido em andamento', subtitle: 'Novas solicitações dos supervisores aparecerão aqui.' },
        liberados: { title: 'Nenhum pedido liberado', subtitle: 'Pedidos liberados para retirada aparecerão aqui.' },
        sem_estoque: { title: 'Sem registros de falta', subtitle: 'Pedidos sem estoque disponível aparecerão aqui.' },
        finalizados: { title: 'Sem finalizados ainda', subtitle: 'Pedidos com retirada confirmada aparecerão aqui.' },
    };

    return (
        <div className="space-y-4">
            {/* Barra busca + data + CSV */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative grow">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-woodsmoke-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                    </svg>
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por técnico, supervisor, matrícula ou ID..."
                        className="w-full pl-9 pr-3 py-2.5 text-xs font-bold border-2 border-woodsmoke-100 rounded-xl bg-woodsmoke-50 text-woodsmoke-700 focus:outline-none focus:border-woodsmoke-300 transition-all"
                    />
                </div>
                <input
                    type="date"
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="px-3 py-2.5 text-[11px] font-black border-2 border-woodsmoke-100 rounded-xl bg-woodsmoke-50 text-woodsmoke-700 focus:outline-none focus:border-woodsmoke-300 transition-all"
                />
                {(busca || filtroData) && (
                    <button onClick={() => { setBusca(''); setFiltroData(''); }} className="text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border-2 border-woodsmoke-200 text-woodsmoke-500 hover:bg-woodsmoke-50 transition-all whitespace-nowrap">
                        Limpar
                    </button>
                )}
                {/* Export com seleção de status */}
                <div className="flex items-center gap-1 shrink-0">
                    <select
                        value={exportStatus}
                        onChange={(e) => setExportStatus(e.target.value)}
                        className="px-2 py-2.5 text-[10px] font-black uppercase tracking-wider border-2 border-surface-200 rounded-l-xl bg-surface-50 text-surface-600 focus:outline-none cursor-pointer"
                    >
                        <option value="todos">Todos</option>
                        <option value="pedido_em_andamento">Em andamento</option>
                        <option value="liberado_retirada">Liberados</option>
                        <option value="sem_estoque">Sem estoque</option>
                        <option value="retirado">Finalizados</option>
                    </select>
                    <button
                        onClick={() => exportarXLSXEstoque(todosOsDados, exportStatus)}
                        disabled={todosOsDados.length === 0}
                        title="Exportar Excel"
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-2.5 border-2 border-l-0 border-surface-200 rounded-r-xl text-surface-600 bg-surface-50 hover:bg-surface-100 transition-all disabled:opacity-40 whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Excel
                    </button>
                </div>
            </div>

            {/* Lista */}
            {filtrados.length === 0 ? (
                <div className="bg-woodsmoke-50 border-2 border-dashed border-woodsmoke-200 rounded-2xl p-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-woodsmoke-100 flex items-center justify-center mx-auto mb-4 text-woodsmoke-300"><IconInbox /></div>
                    <p className="text-sm font-black text-woodsmoke-500 uppercase tracking-widest">
                        {trocas.length === 0 ? emptyMessages[tabAtiva].title : 'Nenhum resultado encontrado'}
                    </p>
                    <p className="text-xs text-woodsmoke-400 mt-2">
                        {trocas.length === 0 ? emptyMessages[tabAtiva].subtitle : 'Tente outros termos de busca.'}
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

                    {/* Paginacao */}
                    {totalPaginas > 1 && (
                        <div className="flex items-center justify-between bg-woodsmoke-50 border border-woodsmoke-200 rounded-2xl px-5 py-3">
                            <span className="text-[10px] font-black text-woodsmoke-400 uppercase tracking-wider">
                                Pág. {paginaAtual} de {totalPaginas} · {filtrados.length} pedidos
                            </span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPagina(1)} disabled={paginaAtual === 1}
                                    className="p-2 rounded-lg text-woodsmoke-400 hover:text-woodsmoke-800 hover:bg-woodsmoke-100 disabled:opacity-30 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" /></svg>
                                </button>
                                <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1}
                                    className="p-2 rounded-lg text-woodsmoke-400 hover:text-woodsmoke-800 hover:bg-woodsmoke-100 disabled:opacity-30 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                    const inicio = Math.max(1, Math.min(paginaAtual - 2, totalPaginas - 4));
                                    const num = inicio + i;
                                    return num <= totalPaginas ? (
                                        <button key={num} onClick={() => setPagina(num)}
                                            className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${num === paginaAtual ? 'bg-brand-700 text-white' : 'text-surface-500 hover:bg-surface-100'}`}>
                                            {num}
                                        </button>
                                    ) : null;
                                })}
                                <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas}
                                    className="p-2 rounded-lg text-woodsmoke-400 hover:text-woodsmoke-800 hover:bg-woodsmoke-100 disabled:opacity-30 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                                <button onClick={() => setPagina(totalPaginas)} disabled={paginaAtual === totalPaginas}
                                    className="p-2 rounded-lg text-woodsmoke-400 hover:text-woodsmoke-800 hover:bg-woodsmoke-100 disabled:opacity-30 transition-all">
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

// ---- Countdown prazo retirada ----
function PrazoRetirada({ dataLiberacao }: { dataLiberacao: string }) {
    const [agora, setAgora] = React.useState(Date.now());
    React.useEffect(() => {
        const t = setInterval(() => setAgora(Date.now()), 60_000);
        return () => clearInterval(t);
    }, []);

    const prazo = new Date(dataLiberacao).getTime() + LIMITE_RETIRADA_MS;
    const diffMs = prazo - agora;
    const expirado = diffMs <= 0;

    if (expirado) {
        return (
            <span className="badge-expired inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Prazo expirado
            </span>
        );
    }

    const horas = Math.floor(diffMs / 3_600_000);
    const mins = Math.floor((diffMs % 3_600_000) / 60_000);
    const urgente = diffMs < 2 * 3_600_000;
    const atencao = diffMs < 8 * 3_600_000;
    // Cores neutras corporativas por urgência
    const cor = urgente
        ? 'bg-red-50 text-red-700 border-red-200'
        : atencao
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-surface-50 text-brand-700 border-surface-300';

    return (
        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${cor}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {horas > 0 ? `${horas}h ${mins}min` : `${mins}min`} p/ retirar
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

    const idCurto = troca.id.split('-')[0].toUpperCase();
    const dataFormatada = new Date(troca.data_troca).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const labelStatus: Record<StatusEstoque, string> = {
        pedido_em_andamento: 'Pedido em andamento',
        sem_estoque: 'Sem estoque',
        liberado_retirada: 'Liberado p/ retirada',
        retirado: 'Finalizado',
    };

    function handleConfirmar() {
        const novoStatus: StatusEstoque = confirmandoRetirada ? 'retirado' : statusSelecionado;
        onAtualizarStatus(troca.id, novoStatus);
        setConfirmando(false);
        setConfirmandoRetirada(false);
    }

    return (
        <div className="bg-white border border-surface-200 rounded-2xl p-5 sm:p-6 shadow-card hover:shadow-card-md transition-shadow">
            {/* Topo: ID + Status + Data + badge expirado */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] font-black text-woodsmoke-300 shrink-0">#{idCurto}</span>
                    <StatusBadge status={troca.status} />
                    {troca.status === 'liberado_retirada' && !troca.prazo_expirado && (
                        <PrazoRetirada dataLiberacao={troca.data_troca} />
                    )}
                    {troca.prazo_expirado && (
                        <span className="badge-expired inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Prazo expirado
                        </span>
                    )}
                </div>

                <span className="text-[10px] text-woodsmoke-400 font-bold shrink-0 hidden sm:block">{dataFormatada}</span>
            </div>

            {/* Corpo: informações */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <div>
                    <p className="text-[9px] font-black text-woodsmoke-400 uppercase tracking-widest mb-1">Supervisor</p>
                    <p className="text-xs font-black text-woodsmoke-900 uppercase leading-tight">{troca.supervisor_nome}</p>
                    <p className="text-[10px] text-woodsmoke-400 font-bold">{troca.supervisor_matricula}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-woodsmoke-400 uppercase tracking-widest mb-1">Técnico</p>
                    <p className="text-xs font-black text-woodsmoke-900 uppercase leading-tight">{troca.tecnico_nome}</p>
                    <p className="text-[10px] text-woodsmoke-400 font-bold">{troca.tecnico_matricula}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-woodsmoke-400 uppercase tracking-widest mb-1">Item para Devolução</p>
                    <p className="text-xs font-bold text-woodsmoke-700 uppercase leading-tight">{troca.item_saida_nome}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-woodsmoke-400 uppercase tracking-widest mb-1">Motivo</p>
                    <p className="text-xs font-bold text-woodsmoke-600 italic">"{troca.motivo}"</p>
                </div>
            </div>

            {/* Ações */}
            <div className="pt-4 border-t border-surface-200">
                {atualizando ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-surface-300 border-t-brand-700 rounded-full animate-spin" />
                        <span className="text-xs text-surface-500 font-medium">Atualizando...</span>
                    </div>
                ) : troca.status === 'retirado' ? (
                    /* Finalizado - somente leitura */
                    <div className="flex items-center gap-2 text-brand-700 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-xs font-semibold uppercase tracking-wider">Retirada confirmada — finalizado</span>
                    </div>
                ) : confirmando ? (
                    /* Modal de confirmação inline */
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 text-surface-700 grow">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-black">
                                {confirmandoRetirada
                                    ? 'Confirmar retirada do item? Isso irá finalizar o pedido.'
                                    : <>Confirmar: <span className="italic">{labelStatus[statusSelecionado]}</span>?</>}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => { setConfirmando(false); setConfirmandoRetirada(false); }}
                                className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmar}
                                className="text-[10px] font-semibold uppercase tracking-wider px-4 py-1.5 rounded-lg bg-brand-700 text-white hover:bg-brand-800 transition-all"
                            >
                                Sim, confirmar
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Select + botões */
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative grow max-w-xs">
                            <select
                                value={statusSelecionado}
                                onChange={(e) => setStatusSelecionado(e.target.value as StatusEstoque)}
                                className="w-full appearance-none pl-3 pr-8 py-2 text-[11px] font-semibold uppercase tracking-wide border border-surface-200 rounded-xl bg-white text-surface-700 focus:outline-none focus:border-brand-400 transition-all cursor-pointer"
                            >
                                <option value="pedido_em_andamento">Pedido em andamento</option>
                                <option value="sem_estoque">Sem estoque</option>
                                <option value="liberado_retirada">Liberado p/ retirada</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <button
                            onClick={() => setConfirmando(true)}
                            disabled={statusSelecionado === troca.status}
                            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-4 py-2 rounded-xl bg-brand-700 text-white hover:bg-brand-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        >
                            <IconCheck />
                            Finalizar
                        </button>
                        {troca.status === 'liberado_retirada' && (
                            <button
                                onClick={() => { setConfirmandoRetirada(true); setConfirmando(true); }}
                                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-all shrink-0"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                Confirmar Retirada
                            </button>
                        )}
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
            label: 'Em andamento',
            className: 'bg-surface-100 text-brand-700 border-surface-300',
            dot: 'bg-brand-400 animate-pulse',
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
        retirado: {
            label: 'Finalizado',
            className: 'bg-surface-100 text-surface-600 border-surface-300',
            dot: 'bg-surface-400',
        },
    };
    const c = config[status] ?? config.pedido_em_andamento;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${c.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
            {c.label}
        </span>
    );
}
