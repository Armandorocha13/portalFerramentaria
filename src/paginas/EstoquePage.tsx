// ============================================================
// PÁGINA DO ESTOQUE — Painel de Controle da Ferramentaria
// Design minimalista funcional
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contextos/AuthContext';
import { supabase } from '../bibliotecas/supabase';
import { useDebounce } from '../ganchos/useDebounce';

type StatusEstoque = 'pedido_em_andamento' | 'sem_estoque' | 'liberado_retirada' | 'retirado' | 'cancelado';

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
    atendido_por: string | null;
    data_atendimento: string | null;
    valor?: number;
    tecnico_cargo?: string;
    tecnico_setor?: string;
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

async function atualizarStatusSupabase(
    id: string,
    status: StatusEstoque,
    prazo_expirado = false,
    atendido_por?: string
): Promise<void> {
    const updateData: Record<string, unknown> = { status, prazo_expirado };
    // Gravar quem atendeu e quando, se informado
    if (atendido_por) {
        updateData.atendido_por = atendido_por;
        updateData.data_atendimento = new Date().toISOString();
    }
    const { error } = await supabase
        .from('historico_trocas')
        .update(updateData)
        .eq('id', id);
    if (error) throw error;
}

const LABEL_STATUS: Record<StatusEstoque, string> = {
    pedido_em_andamento: 'Em andamento',
    sem_estoque: 'Sem estoque',
    liberado_retirada: 'Liberado p/ retirada',
    retirado: 'Finalizado',
    cancelado: 'Cancelado',
};

// ---- Badge de Status ----
function StatusBadge({ status }: { status: StatusEstoque }) {
    const styles: Record<StatusEstoque, string> = {
        pedido_em_andamento: 'bg-blue-50 text-blue-700 border-blue-200',
        sem_estoque: 'bg-red-50 text-red-700 border-red-200',
        liberado_retirada: 'bg-green-50 text-green-700 border-green-200',
        retirado: 'bg-gray-100 text-gray-500 border-gray-200',
        cancelado: 'bg-red-50 text-red-600 border-red-100',
    };
    const dots: Record<StatusEstoque, string> = {
        pedido_em_andamento: 'bg-blue-500',
        sem_estoque: 'bg-red-500',
        liberado_retirada: 'bg-green-500',
        retirado: 'bg-gray-400',
        cancelado: 'bg-red-400',
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

    const isPosCutoff = new Date(dataLiberacao).getHours() >= 15;
    const additionalHours = isPosCutoff ? 48 : 24;
    const limitMs = additionalHours * 60 * 60 * 1000;
    const prazo = new Date(dataLiberacao).getTime() + limitMs;
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

// ---- Contador de dias corridos ----
function TimeAgoLabel({ status, dataTroca, dataAtendimento }: { status: StatusEstoque; dataTroca: string; dataAtendimento: string | null }) {
    const calcularDias = (data: string) => {
        const agora = new Date();
        const ref = new Date(data);
        // Resetar horas para comparar apenas dias
        const d1 = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
        const d2 = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());
        return Math.floor(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
    };

    const dias = status === 'retirado' && dataAtendimento
        ? calcularDias(dataAtendimento)
        : calcularDias(dataTroca);

    const texto = status === 'retirado' ? 'Atendimento finalizado' : 'Pedido aberto';
    const tempo = dias === 0 ? 'hoje' : `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;

    return (
        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
            · {texto} {tempo}
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
    const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);

    // Sincroniza o select quando o status muda externamente (ex: polling)
    useEffect(() => {
        if (!confirmando) setStatusSelecionado(troca.status);
    }, [troca.status, confirmando]);

    const idCurto = troca.id.split('-')[0].toUpperCase();
    const dataFormatada = new Date(troca.data_troca).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    function handleConfirmar() {
        const novoStatus: StatusEstoque = confirmandoCancelamento ? 'cancelado' : confirmandoRetirada ? 'retirado' : statusSelecionado;
        onAtualizarStatus(troca.id, novoStatus);
        setConfirmando(false);
        setConfirmandoRetirada(false);
        setConfirmandoCancelamento(false);
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
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-xs text-gray-400 hidden sm:block">{dataFormatada}</span>
                    <TimeAgoLabel
                        status={troca.status}
                        dataTroca={troca.data_troca}
                        dataAtendimento={troca.data_atendimento}
                    />
                </div>
            </div>

            {/* Informações */}
            <div className={`grid sm:grid-cols-2 ${troca.atendido_por ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 mb-4`}>
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
                {troca.atendido_por && (
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Atendido por</p>
                        <p className="text-sm font-semibold text-gray-800">{troca.atendido_por}</p>
                        {troca.data_atendimento && (
                            <p className="text-xs text-gray-400">{new Date(troca.data_atendimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                    </div>
                )}
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
                ) : troca.status === 'cancelado' ? (
                    <span className="text-sm text-red-500 font-medium">✕ Pedido cancelado</span>
                ) : confirmando ? (
                    <div className="flex flex-col gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 shadow-inner">
                        <span className="text-sm text-gray-700">
                            {confirmandoCancelamento
                                ? 'Tem certeza que deseja cancelar este pedido?'
                                : confirmandoRetirada
                                    ? 'Confirmar retirada do item? Isso irá finalizar o pedido.'
                                    : <>Confirmar mudança para: <strong>{LABEL_STATUS[statusSelecionado]}</strong>?</>}
                        </span>
                        <div className="flex items-center justify-end gap-2 shrink-0">
                            <button
                                onClick={() => { setConfirmando(false); setConfirmandoRetirada(false); setConfirmandoCancelamento(false); }}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-100 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleConfirmar}
                                className="text-xs px-5 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors font-semibold"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex items-center gap-2 grow">
                            <select
                                value={statusSelecionado}
                                onChange={(e) => setStatusSelecionado(e.target.value as StatusEstoque)}
                                className="flex-1 sm:flex-none text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
                            >
                                <option value="pedido_em_andamento">Em andamento</option>
                                <option value="sem_estoque">Sem estoque</option>
                                <option value="liberado_retirada">Liberado p/ retirada</option>
                            </select>
                            <button
                                onClick={() => setConfirmando(true)}
                                disabled={statusSelecionado === troca.status}
                                className="text-xs px-4 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                            >
                                Atualizar
                            </button>
                        </div>
                        {troca.status === 'liberado_retirada' && (
                            <div className="flex items-center gap-2 lg:ml-auto">
                                <button
                                    onClick={() => { setConfirmandoCancelamento(true); setConfirmando(true); }}
                                    className="text-xs px-4 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    ✕ Cancelar Pedido
                                </button>
                                <button
                                    onClick={() => { setConfirmandoRetirada(true); setConfirmando(true); }}
                                    className="text-xs px-4 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                                >
                                    ✓ Confirmar Retirada
                                </button>
                            </div>
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
    onUpdateCarga,
    isUpdatingCarga,
}: {
    trocas: Troca[];
    tabAtiva: 'fila' | 'liberados' | 'sem_estoque' | 'finalizados' | 'cancelados';
    atualizando: string | null;
    onAtualizarStatus: (id: string, status: StatusEstoque, expirado?: boolean) => void;
    todosOsDados: Troca[];
    onUpdateCarga: () => void;
    isUpdatingCarga: boolean;
}) {
    const [busca, setBusca] = useState('');
    const debouncedBusca = useDebounce(busca, 300);
    const [filtroData, setFiltroData] = useState('');
    const [pagina, setPagina] = useState(1);
    const [exportStatus, setExportStatus] = useState('todos');
    const [exportDataDe, setExportDataDe] = useState('');
    const [exportDataAte, setExportDataAte] = useState('');

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

        let dados = exportStatus === 'todos' ? todosOsDados : todosOsDados.filter((t) => t.status === exportStatus);

        // Filtrar por período
        if (exportDataDe) {
            const de = new Date(exportDataDe + 'T00:00:00');
            dados = dados.filter((t) => new Date(t.data_troca) >= de);
        }
        if (exportDataAte) {
            const ate = new Date(exportDataAte + 'T23:59:59');
            dados = dados.filter((t) => new Date(t.data_troca) <= ate);
        }

        const linhas = dados.map((t) => {
            // Calcular SLA em horas (se atendido)
            let sla = '';
            let diasParaFinalizar = '';
            if (t.data_atendimento && t.data_troca) {
                const diffMs = new Date(t.data_atendimento).getTime() - new Date(t.data_troca).getTime();
                if (diffMs >= 0) {
                    const h = Math.floor(diffMs / 3_600_000);
                    const m = Math.floor((diffMs % 3_600_000) / 60_000);
                    sla = `${h}h ${m}min`;

                    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    diasParaFinalizar = d === 0 ? 'Mesmo dia' : `${d} dia(s)`;
                }
            }
            return {
                'ID': t.id.split('-')[0].toUpperCase(),
                'ID Completo': t.id,
                'Supervisor': t.supervisor_nome,
                'Matrícula Supervisor': t.supervisor_matricula,
                'Técnico': t.tecnico_nome,
                'Matrícula Técnico': t.tecnico_matricula,
                'Cargo Técnico': t.tecnico_cargo || '',
                'Setor Técnico': t.tecnico_setor || '',
                'Item Saída (Devolução)': t.item_saida_nome,
                'Item Entrada (Substituição)': t.item_entrada_nome,
                'Motivo': t.motivo,
                'Status': LABEL_STATUS[t.status] ?? t.status,
                'Prazo Expirado': t.prazo_expirado ? 'Sim' : 'Não',
                'Data Solicitação': new Date(t.data_troca).toLocaleDateString('pt-BR'),
                'Hora Solicitação': new Date(t.data_troca).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                'Atendido por': t.atendido_por || '',
                'Data Atendimento': t.data_atendimento ? new Date(t.data_atendimento).toLocaleDateString('pt-BR') : '',
                'Hora Atendimento': t.data_atendimento ? new Date(t.data_atendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
                'SLA (Detalhado)': sla,
                'SLA (Dias)': diasParaFinalizar,
                'Valor (R$)': t.valor || 0,
            };
        });
        const ws = XLSX.utils.json_to_sheet(linhas);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
        const sufixoPeriodo = exportDataDe || exportDataAte
            ? `_${exportDataDe || 'inicio'}_a_${exportDataAte || 'hoje'}`
            : '';
        XLSX.writeFile(wb, `pedidos_estoque_${new Date().toISOString().slice(0, 10)}${sufixoPeriodo}.xlsx`);
    }

    const emptyMsg: Record<typeof tabAtiva, string> = {
        fila: 'Nenhum pedido em andamento',
        liberados: 'Nenhum pedido liberado',
        sem_estoque: 'Sem registros de falta de estoque',
        finalizados: 'Nenhum pedido finalizado ainda',
        cancelados: 'Nenhum pedido cancelado encontrado',
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
                        placeholder="Buscar técnico, supervisor ou ID..."
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                        type="date"
                        value={filtroData}
                        onChange={(e) => setFiltroData(e.target.value)}
                        className="grow sm:grow-0 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                    {(busca || filtroData) && (
                        <button
                            onClick={() => { setBusca(''); setFiltroData(''); }}
                            className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors whitespace-nowrap"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {/* Exportação com filtro de período */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Extração de Dados</span>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 grow">
                        <div className="flex flex-col gap-1 grow sm:grow-0">
                            <span className="text-[10px] text-gray-400 ml-1">Início</span>
                            <input
                                type="date"
                                value={exportDataDe}
                                onChange={(e) => setExportDataDe(e.target.value)}
                                className="w-full sm:w-auto px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1 grow sm:grow-0">
                            <span className="text-[10px] text-gray-400 ml-1">Fim</span>
                            <input
                                type="date"
                                value={exportDataAte}
                                onChange={(e) => setExportDataAte(e.target.value)}
                                className="w-full sm:w-auto px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1 grow sm:grow-0">
                            <span className="text-[10px] text-gray-400 ml-1">Filtrar Status</span>
                            <select
                                value={exportStatus}
                                onChange={(e) => setExportStatus(e.target.value)}
                                className="w-full sm:w-auto text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-600 focus:outline-none cursor-pointer"
                            >
                                <option value="todos">Todos os status</option>
                                <option value="pedido_em_andamento">Em andamento</option>
                                <option value="liberado_retirada">Liberados</option>
                                <option value="sem_estoque">Sem estoque</option>
                                <option value="retirado">Finalizados</option>
                                <option value="cancelado">Cancelados</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 lg:pt-0 lg:ml-auto">
                        {(exportDataDe || exportDataAte) && (
                            <button
                                onClick={() => { setExportDataDe(''); setExportDataAte(''); }}
                                className="text-[10px] font-medium px-2 py-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Limpar
                            </button>
                        )}
                        <button
                            onClick={exportarXLSX}
                            disabled={todosOsDados.length === 0}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-all disabled:opacity-40"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Exportar Excel
                        </button>
                        <button
                            onClick={onUpdateCarga}
                            disabled={isUpdatingCarga}
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md transition-all shadow-sm ${isUpdatingCarga ? 'bg-amber-100 text-amber-700' : 'bg-amber-600 text-white hover:bg-amber-700'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${isUpdatingCarga ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {isUpdatingCarga ? 'Sincronizando...' : 'Atualizar Carga (Excel)'}
                        </button>
                    </div>
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

// ---- Painel SLA e Métricas ----
function SlaKpiPanel({ trocas, onCliqueExpirados, onCliqueCancelados }: { trocas: Troca[]; onCliqueExpirados?: () => void; onCliqueCancelados?: () => void }) {
    const [mostrarOperadores, setMostrarOperadores] = useState(false);

    const metricas = useMemo(() => {
        const agora = new Date();
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

        const hojeStr = agora.toISOString().split('T')[0];

        // Filtrar trocas atendidas nos últimos 30 dias
        const atendidos30d = trocas.filter(t =>
            t.data_atendimento &&
            new Date(t.data_atendimento) >= trintaDiasAtras
        );

        // 1. Tempo médio de atendimento (SLA)
        let somaMs = 0;
        let count = 0;
        for (const t of atendidos30d) {
            if (t.data_atendimento && t.data_troca) {
                const diff = new Date(t.data_atendimento).getTime() - new Date(t.data_troca).getTime();
                if (diff > 0) {
                    somaMs += diff;
                    count++;
                }
            }
        }
        const mediaMs = count > 0 ? somaMs / count : 0;
        const mediaHoras = Math.floor(mediaMs / 3_600_000);
        const mediaMin = Math.floor((mediaMs % 3_600_000) / 60_000);
        const slaFormatado = count > 0 ? `${mediaHoras}h ${mediaMin}min` : '—';

        // 2. Pedidos atendidos hoje
        const atendidosHoje = trocas.filter(t =>
            t.data_atendimento &&
            t.data_atendimento.startsWith(hojeStr)
        ).length;

        // 3. Prazos expirados no mês
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const expiradosLista = trocas.filter(t =>
            t.prazo_expirado &&
            new Date(t.data_troca) >= inicioMes
        );
        const expiradosMes = expiradosLista.length;

        // 4. Cancelados no mês
        const canceladosLista = trocas.filter(t =>
            t.status === 'cancelado' &&
            new Date(t.data_troca) >= inicioMes
        );
        const canceladosMes = canceladosLista.length;

        // 5. Atendimentos por operador (últimos 30 dias)
        const porOperador = new Map<string, number>();
        for (const t of atendidos30d) {
            if (t.atendido_por) {
                porOperador.set(t.atendido_por, (porOperador.get(t.atendido_por) || 0) + 1);
            }
        }
        const operadores = Array.from(porOperador.entries())
            .sort((a, b) => b[1] - a[1]);

        return { slaFormatado, atendidosHoje, expiradosMes, expiradosLista, canceladosMes, canceladosLista, operadores, totalOperadores: operadores.length };
    }, [trocas]);

    return (
        <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* SLA */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gray-300 transition-colors">
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">SLA Médio  </p>
                    <p className="text-lg sm:text-xl font-bold text-gray-800">{metricas.slaFormatado}</p>
                    <p className="hidden sm:block text-[10px] text-gray-400 mt-1">Tempo médio de atendimento</p>
                </div>
                {/* Atendidos hoje */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gray-300 transition-colors">
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Atendidos Hoje</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-800">{metricas.atendidosHoje}</p>
                    <p className="hidden sm:block text-[10px] text-gray-400 mt-1">Pedidos concluídos hoje</p>
                </div>
                {/* Prazos expirados */}
                <div
                    onClick={onCliqueExpirados}
                    className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 relative cursor-pointer hover:border-orange-300 transition-all group"
                >
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Prazos Expirados</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-800">{metricas.expiradosMes}</p>
                    <p className="text-[10px] text-orange-600 mt-1 group-hover:underline">No mês atual</p>
                </div>
                {/* Cancelados */}
                <div
                    onClick={onCliqueCancelados}
                    className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 relative cursor-pointer hover:border-red-300 transition-all group"
                >
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cancelados (Mês)</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-800">{metricas.canceladosMes}</p>
                    <p className="text-[10px] text-red-500 mt-1 group-hover:underline">Cancelados no mês</p>
                </div>
                {/* Por operador */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gray-300 transition-colors relative">
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Operadores</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-800">{metricas.totalOperadores}  </p>
                    <button
                        onClick={() => setMostrarOperadores(!mostrarOperadores)}
                        className="text-[10px] text-gray-500 mt-1 hover:text-gray-700 font-medium underline"
                    >
                        {mostrarOperadores ? 'Ocultar' : 'Ver ranking'}
                    </button>
                </div>
            </div>

            {/* Tabela de operadores expandível */}
            {mostrarOperadores && metricas.operadores.length > 0 && (
                <div className="mt-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-100 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Operador</th>
                                <th className="px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Atendimentos  </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {metricas.operadores.map(([nome, qtd]) => (
                                <tr key={nome} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2.5 text-sm text-gray-700">{nome}</td>
                                    <td className="px-4 py-2.5 text-sm font-semibold text-gray-800 text-right">{qtd}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
    const [tabAtiva, setTabAtiva] = useState<'fila' | 'liberados' | 'sem_estoque' | 'finalizados' | 'cancelados'>('fila');
    const [filtroExpirados, setFiltroExpirados] = useState(false);
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
    const [atualizandoCarga, setAtualizandoCarga] = useState(false);

    const fetchTrocas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getTrocasSupabase();
            const agora = Date.now();
            const expirados = data.filter((t) => {
                if (t.status !== 'liberado_retirada' || t.prazo_expirado) return false;
                const isPosCutoff = new Date(t.data_troca).getHours() >= 15;
                const limitMs = (isPosCutoff ? 48 : 24) * 60 * 60 * 1000;
                return (agora - new Date(t.data_troca).getTime() > limitMs);
            });
            if (expirados.length > 0) {
                await Promise.all(expirados.map((t) => atualizarStatusSupabase(t.id, 'liberado_retirada', true)));
                const idsExpirados = new Set(expirados.map((t) => t.id));
                setTrocas(data.map((t) =>
                    idsExpirados.has(t.id) ? { ...t, prazo_expirado: true } : t
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

    // Identificação do operador logado para gravar quem atendeu
    const operadorInfo = usuario ? `${usuario.nome} (${usuario.matricula})` : undefined;

    async function handleAtualizarStatus(id: string, novoStatus: StatusEstoque, expirado = false) {
        setAtualizando(id);
        setErro('');
        try {
            await atualizarStatusSupabase(id, novoStatus, expirado, operadorInfo);
            const agora = new Date().toISOString();
            setTrocas((prev) =>
                prev.map((t) => (t.id === id ? {
                    ...t,
                    status: novoStatus,
                    prazo_expirado: expirado,
                    atendido_por: operadorInfo || t.atendido_por,
                    data_atendimento: operadorInfo ? agora : t.data_atendimento,
                } : t))
            );
            const mensagens: Record<StatusEstoque, string> = {
                pedido_em_andamento: 'Status atualizado para Em Andamento.',
                sem_estoque: 'Pedido marcado como Sem Estoque.',
                liberado_retirada: 'Pedido liberado para retirada!',
                retirado: 'Retirada confirmada!',
                cancelado: 'Pedido cancelado com sucesso.',
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

    async function handleAtualizarCarga() {
        if (!confirm('Deseja atualizar a carga de dados agora? Isso removerá a carga atual e importará os dados do arquivo Saldo Volante.')) return;
        setAtualizandoCarga(true);
        setErro('');
        setSucesso('');
        try {
            const res = await fetch('/api/update-carga');
            const data = await res.json();
            if (res.ok) {
                setSucesso(`Carga atualizada com sucesso! ${data.count} itens importados.`);
                setTimeout(() => setSucesso(''), 5000);
            } else {
                throw new Error(data.error || 'Erro na atualização');
            }
        } catch (err: any) {
            setErro('Erro ao atualizar carga: ' + err.message);
            setTimeout(() => setErro(''), 8000);
        } finally {
            setAtualizandoCarga(false);
        }
    }

    const emAndamento = trocas.filter((t) => t.status === 'pedido_em_andamento');
    const liberados = trocas.filter((t) => t.status === 'liberado_retirada' && (!filtroExpirados || t.prazo_expirado));
    const semEstoque = trocas.filter((t) => t.status === 'sem_estoque');
    const finalizados = trocas.filter((t) => t.status === 'retirado');
    const cancelados = trocas.filter((t) => t.status === 'cancelado');

    const tabs: { key: typeof tabAtiva; label: string; count: number }[] = [
        { key: 'fila', label: 'Em Andamento', count: emAndamento.length },
        { key: 'liberados', label: 'Liberados', count: liberados.length },
        { key: 'sem_estoque', label: 'Sem Estoque', count: semEstoque.length },
        { key: 'finalizados', label: 'Finalizados', count: finalizados.length },
        { key: 'cancelados', label: 'Cancelados', count: cancelados.length },
    ];

    const trocasAtuais = tabAtiva === 'fila' ? emAndamento
        : tabAtiva === 'liberados' ? liberados
            : tabAtiva === 'sem_estoque' ? semEstoque
                : tabAtiva === 'finalizados' ? finalizados
                    : cancelados;

    return (
        <div className="min-h-screen bg-gray-50">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
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

                {/* KPI Cards — Status */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {tabs.map((tab) => {
                        const colors: Record<string, string> = {
                            fila: 'border-blue-200 text-blue-700 hover:border-blue-300',
                            liberados: 'border-green-200 text-green-700 hover:border-green-300',
                            sem_estoque: 'border-red-200 text-red-700 hover:border-red-300',
                            finalizados: 'border-gray-200 text-gray-500 hover:border-gray-300',
                            cancelados: 'border-rose-200 text-rose-600 hover:border-rose-300',
                        };
                        const activeColors: Record<string, string> = {
                            fila: 'border-blue-500 ring-2 ring-blue-50 bg-blue-50',
                            liberados: 'border-green-500 ring-2 ring-green-50 bg-green-50',
                            sem_estoque: 'border-red-500 ring-2 ring-red-50 bg-red-50',
                            finalizados: 'border-gray-800 ring-2 ring-gray-100 bg-gray-50',
                            cancelados: 'border-rose-500 ring-2 ring-rose-50 bg-rose-50',
                        };
                        return (
                            <button
                                key={tab.key}
                                onClick={() => { setTabAtiva(tab.key); setFiltroExpirados(false); }}
                                className={`text-left bg-white border rounded-xl p-4 transition-all ${tabAtiva === tab.key
                                    ? activeColors[tab.key]
                                    : `border-gray-200 ${colors[tab.key]}`
                                    }`}
                            >
                                <p className={`text-2xl font-bold mb-0.5 ${tabAtiva === tab.key ? 'text-gray-900' : 'text-gray-800'}`}>{tab.count}</p>
                                <p className={`text-xs font-bold uppercase tracking-wider ${tabAtiva === tab.key ? 'text-gray-600' : 'text-gray-400'}`}>{tab.label}</p>
                            </button>
                        );
                    })}
                </div>

                {/* KPI Cards — SLA e Métricas */}
                <SlaKpiPanel
                    trocas={trocas}
                    onCliqueExpirados={() => {
                        setTabAtiva('liberados');
                        setFiltroExpirados(true);
                    }}
                    onCliqueCancelados={() => {
                        setTabAtiva('cancelados');
                    }}
                />

                {/* Navegação de tabs */}
                <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto no-scrollbar scroll-smooth">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => {
                                setTabAtiva(tab.key);
                                setFiltroExpirados(false);
                            }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap shrink-0 ${tabAtiva === tab.key
                                ? 'border-gray-800 text-gray-800'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${tabAtiva === tab.key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Filtro ativo banner */}
                {filtroExpirados && tabAtiva === 'liberados' && (
                    <div className="mb-4 flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                        <span className="text-xs text-orange-800 font-medium">
                            Exibindo apenas pedidos com <strong>prazo de retirada expirado</strong>
                        </span>
                        <button
                            onClick={() => setFiltroExpirados(false)}
                            className="text-xs text-orange-600 hover:text-orange-800 font-bold underline"
                        >
                            Limpar filtro
                        </button>
                    </div>
                )}

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
                        onUpdateCarga={handleAtualizarCarga}
                        isUpdatingCarga={atualizandoCarga}
                    />
                )}
            </main>
        </div>
    );
}
