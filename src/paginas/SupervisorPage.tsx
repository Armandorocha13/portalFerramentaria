// ============================================================
// PÁGINA DO SUPERVISOR — Formulário de Troca em 5 Etapas
// Design minimalista funcional
// ============================================================

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuth } from '../contextos/AuthContext';
import { useSolicitacoes } from '../contextos/SolicitacoesContext';
import { getTecnico, getCargaTecnico, registrarTroca, getHistoricoTrocas, verificarTrocasRecentesBatch, type ResultadoTrocaRecente } from '../bibliotecas/database-queries';
import { supabase } from '../bibliotecas/supabase';
import { calcularPrazoD1, calcularPrazo } from '../simulacoes/database';
import type { ItemCarga, FormularioTroca } from '../tipos';

const STEPS = ['Identificação', 'Validação', 'Selecione o item', 'Motivo', 'Confirmação'] as const;

const INITIAL_FORM: FormularioTroca = {
    tecnicoMatricula: '',
    tecnicoValidado: null,
    itensSelecionados: [],
    motivos: {},
};

// ---- Badge de Status ----
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; cls: string; dot: string }> = {
        pedido_em_andamento: { label: 'Em andamento', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
        sem_estoque: { label: 'Sem estoque', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
        liberado_retirada: { label: 'Liberado p/ retirada', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
        retirado: { label: 'Finalizado', cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
        pendente: { label: 'Em andamento', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
        aprovada: { label: 'Liberado p/ retirada', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
        rejeitada: { label: 'Sem estoque', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
        concluida: { label: 'Finalizado', cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
        cancelado: { label: 'Cancelado', cls: 'bg-red-50 text-red-600 border-red-100', dot: 'bg-red-400' },
    };
    const c = config[status] ?? config.pedido_em_andamento;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${c.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

// ---- Countdown prazo de retirada ----
function PrazoRetirada({ dataLiberacao }: { dataLiberacao: string }) {
    const [agora, setAgora] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setAgora(Date.now()), 60_000);
        return () => clearInterval(t);
    }, []);

    const isPosCutoff = new Date(dataLiberacao).getHours() >= 15;
    const additionalHours = isPosCutoff ? 48 : 24;
    const prazo = new Date(dataLiberacao).getTime() + additionalHours * 60 * 60 * 1000;
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
            ⏱ {horas > 0 ? `${horas}h ${mins}min` : `${mins}min`} p/ retirar
        </span>
    );
}

// ---- Contador de dias corridos ----
function TimeAgoLabel({ status, dataSolicitacao }: { status: string; dataSolicitacao: string }) {
    const calcularDias = (data: string) => {
        const agora = new Date();
        const ref = new Date(data);
        const d1 = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
        const d2 = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());
        return Math.floor(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
    };

    const dias = calcularDias(dataSolicitacao);
    const texto = status === 'retirado' ? 'Atendimento finalizado' : 'Pedido aberto';
    const tempo = dias === 0 ? 'hoje' : `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;

    return (
        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap mt-1">
            {texto} {tempo}
        </span>
    );
}

export default function SupervisorPage() {
    const { usuario, logout } = useAuth();
    const { adicionarSolicitacao } = useSolicitacoes();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormularioTroca>({ ...INITIAL_FORM });
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState('');
    const [tabAtiva, setTabAtiva] = useState<'nova' | 'historico'>('nova');

    const [cargaTecnico, setCargaTecnico] = useState<ItemCarga[]>([]);
    const [historicoSupabase, setHistoricoSupabase] = useState<any[]>([]);
    const [totalHistorico, setTotalHistorico] = useState(0);
    const [historicoPagina, setHistoricoPagina] = useState(1);
    const [notificacao, setNotificacao] = useState<{ id: string; texto: string } | null>(null);
    const [filtroItem, setFiltroItem] = useState('');

    // ---- Alterar Senha ----
    const [showSenha, setShowSenha] = useState(false);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [senhaNova, setSenhaNova] = useState('');
    const [senhaConfirm, setSenhaConfirm] = useState('');
    const [salvandoSenha, setSalvandoSenha] = useState(false);
    const [senhaErro, setSenhaErro] = useState('');
    const [senhaSucesso, setSenhaSucesso] = useState('');
    const [showCutoffAlert, setShowCutoffAlert] = useState(false);

    // ── Trava de 45 dias ──
    const [trocasRecentes, setTrocasRecentes] = useState<Map<string, ResultadoTrocaRecente>>(new Map());
    const [itemBloqueadoAlerta, setItemBloqueadoAlerta] = useState<ResultadoTrocaRecente | null>(null);

    const fetchHistorico = useCallback(async (page: number) => {
        if (!usuario?.id) return;
        setLoading(true);
        try {
            const { data, count } = await getHistoricoTrocas(usuario.id, page, 10);
            setHistoricoSupabase(data);
            setTotalHistorico(count);
            setHistoricoPagina(page);
        } catch (err) {
            console.error('Erro ao buscar histórico:', err);
        } finally {
            setLoading(false);
        }
    }, [usuario?.id]);

    useEffect(() => {
        if (tabAtiva === 'historico') {
            fetchHistorico(historicoPagina);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabAtiva, fetchHistorico]);

    // Supabase Realtime
    useEffect(() => {
        if (!usuario?.id) return;
        const labelStatus: Record<string, string> = {
            pedido_em_andamento: '🔵 Em andamento',
            sem_estoque: '🔴 Sem estoque',
            liberado_retirada: '🟢 Liberado p/ retirada',
        };
        const channel = supabase
            .channel('historico-supervisor')
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'historico_trocas',
                filter: `supervisor_id=eq.${usuario.id}`,
            }, (payload) => {
                const updated = payload.new as any;
                setHistoricoSupabase((prev) =>
                    prev.map((item) => item.id === updated.id ? { ...item, status: updated.status } : item)
                );
                setNotificacao({ id: updated.id, texto: labelStatus[updated.status] || updated.status });
                setTimeout(() => setNotificacao(null), 5000);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [usuario]);

    // ---- Step Handlers ----
    async function handleBuscarTecnico(e: FormEvent) {
        e.preventDefault();
        setErro('');
        setLoading(true);
        try {
            if (!usuario?.id) throw new Error('Sessão inválida. Logue novamente.');
            const tecnico = await getTecnico(form.tecnicoMatricula, usuario.id);
            if (!tecnico) {
                setErro('Técnico não encontrado na sua equipe. Verifique a matrícula ou o vínculo.');
                return;
            }
            if (tecnico.status !== 'ativo') {
                setErro(`Técnico ${tecnico.nome} está com status: ${tecnico.status}. Apenas técnicos ativos realizam trocas.`);
                return;
            }
            const carga = await getCargaTecnico(tecnico.matricula, tecnico.nome);
            setCargaTecnico(carga);
            // Carregar trocas recentes (< 45 dias) para badges
            const recentes = await verificarTrocasRecentesBatch(tecnico.matricula);
            setTrocasRecentes(recentes);
            setForm((prev) => ({ ...prev, tecnicoValidado: tecnico }));
            setStep(1);

            // Verificar Horário de Corte (15:00)
            const horaAtual = new Date().getHours();
            if (horaAtual >= 15) {
                setShowCutoffAlert(true);
            }
        } catch (err: any) {
            setErro(err.message || 'Erro ao consultar técnico.');
        } finally {
            setLoading(false);
        }
    }

    function handleSelecionarItemSaida(item: ItemCarga) {
        // ── Verificar trava de 45 dias ──
        const bloqueio = trocasRecentes.get(item.materialNome);
        if (bloqueio && bloqueio.bloqueado) {
            setItemBloqueadoAlerta(bloqueio);
            // Mantém selecionado apenas para exibição do alerta
            return;
        }

        setForm((prev) => {
            const jaSelecionado = prev.itensSelecionados.some((i: ItemCarga) => i.id === item.id);
            if (jaSelecionado) {
                // Remove se clicar de novo
                const novosItens = prev.itensSelecionados.filter((i: ItemCarga) => i.id !== item.id);
                const novosMotivos = { ...prev.motivos };
                delete novosMotivos[item.id];
                return { ...prev, itensSelecionados: novosItens, motivos: novosMotivos };
            } else {
                // Adiciona à lista
                return { ...prev, itensSelecionados: [...prev.itensSelecionados, item] };
            }
        });
        setItemBloqueadoAlerta(null);
    }

    function handleProsseguirParaMotivos() {
        if (form.itensSelecionados.length === 0) {
            setErro('Selecione ao menos um item para continuar.');
            return;
        }
        setErro('');
        setStep(3);
    }

    function handleValidarMotivos(e: FormEvent) {
        e.preventDefault();
        const todosComMotivo = form.itensSelecionados.every((item: ItemCarga) => form.motivos[item.id]);
        if (!todosComMotivo) {
            setErro('Por favor, informe o motivo para todos os itens selecionados.');
            return;
        }
        setErro('');
        setStep(4);
    }

    async function handleConfirmar() {
        if (!usuario || !form.tecnicoValidado || form.itensSelecionados.length === 0) return;
        setLoading(true);
        try {
            const promessas = form.itensSelecionados.map((item: ItemCarga) =>
                registrarTroca({
                    supervisor_id: usuario.id,
                    supervisor_matricula: usuario.matricula,
                    supervisor_nome: usuario.nome,
                    tecnico_matricula: form.tecnicoValidado!.matricula,
                    item_saida_id: item.id,
                    material_entrada_nome: item.materialNome, // Assume entrada = saída por padrão
                    motivo: form.motivos[item.id],
                })
            );

            await Promise.all(promessas);

            const agoraFull = new Date();
            const agoraData = agoraFull.toISOString().split('T')[0];
            const isPosCutoff = agoraFull.getHours() >= 15;
            const prazo = calcularPrazo(agoraData, isPosCutoff ? 2 : 1);

            form.itensSelecionados.forEach((item: ItemCarga) => {
                adicionarSolicitacao({
                    supervisorMatricula: usuario.matricula,
                    tecnicoMatricula: form.tecnicoValidado!.matricula,
                    tecnicoNome: form.tecnicoValidado!.nome,
                    itemSaidaId: item.id,
                    itemSaidaNome: item.materialNome,
                    itemSaidaPatrimonio: item.patrimonio,
                    materialEntradaId: item.materialId,
                    materialEntradaNome: item.materialNome,
                    motivo: form.motivos[item.id],
                    dataSolicitacao: agoraData,
                    prazoResolucao: prazo,
                    status: 'pendente',
                });
            });

            setSucesso(`${form.itensSelecionados.length} solicitações registradas com sucesso!`);
            setForm({ ...INITIAL_FORM });
            setStep(0);
            setErro('');
            setTimeout(() => setSucesso(''), 5000);
        } catch (err: any) {
            setErro(`Erro ao registrar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    function handleVoltar() {
        setErro('');
        setItemBloqueadoAlerta(null);
        if (step === 1) setForm((prev) => ({ ...prev, tecnicoValidado: null }));
        if (step === 3) setErro(''); // Limpa erro ao voltar do Step 3
        setStep((prev) => Math.max(0, prev - 1));
    }

    async function handleAlterarSenha(e: React.FormEvent) {
        e.preventDefault();
        setSenhaErro('');
        setSenhaSucesso('');
        if (senhaNova.length < 4) { setSenhaErro('A nova senha deve ter ao menos 4 caracteres.'); return; }
        if (senhaNova !== senhaConfirm) { setSenhaErro('As senhas não coincidem.'); return; }
        setSalvandoSenha(true);
        try {
            const { data: supervisorData } = await supabase
                .from('supervisores')
                .select('matricula')
                .eq('matricula', usuario?.matricula)
                .eq('senha', senhaAtual)
                .single();

            if (!supervisorData) { setSenhaErro('Senha atual incorreta.'); return; }

            const { error } = await supabase
                .from('supervisores')
                .update({ senha: senhaNova })
                .eq('matricula', usuario?.matricula);

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

    // ---- RENDER ----
    return (
        <div className="min-h-screen bg-gray-50">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="FFA" className="h-8" />
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-gray-800">Gestão de Trocas</p>
                            <p className="text-xs text-gray-400">{usuario?.nome.split(' ')[0]} · {usuario?.setor}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSenha(true)}
                            title="Alterar minha senha"
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
                            <h2 className="text-base font-semibold text-gray-800">Minha Segurança</h2>
                            <button onClick={() => { setShowSenha(false); setSenhaErro(''); setSenhaSucesso(''); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                        </div>
                        <p className="text-xs text-gray-400 mb-6">Mantenha sua conta protegida alterando sua senha periodicamente.</p>
                        <form onSubmit={handleAlterarSenha} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Senha Atual</label>
                                <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Nova Senha</label>
                                    <input type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Confirmar</label>
                                    <input type="password" value={senhaConfirm} onChange={e => setSenhaConfirm(e.target.value)} required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200" />
                                </div>
                            </div>
                            {senhaErro && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{senhaErro}</p>}
                            {senhaSucesso && <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{senhaSucesso}</p>}
                            <button type="submit" disabled={salvandoSenha}
                                className="w-full bg-gray-800 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 mt-2">
                                {salvandoSenha ? 'Salvando...' : 'Atualizar Minha Senha'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast notificação Realtime */}
            {notificacao && (
                <div className="fixed top-4 right-4 z-[100] flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg max-w-sm">
                    <span className="text-lg">🔔</span>
                    <div className="grow min-w-0">
                        <p className="text-xs text-gray-400 mb-0.5">Atualização do Estoque</p>
                        <p className="text-sm font-semibold text-gray-800">{notificacao.texto}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Pedido #{notificacao.id.split('-')[0].toUpperCase()}</p>
                    </div>
                    <button onClick={() => setNotificacao(null)} className="text-gray-300 hover:text-gray-500 text-xl leading-none">&times;</button>
                </div>
            )}

            {/* Modal Horário de Corte (Aviso D+2) */}
            {showCutoffAlert && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-amber-500 p-4 flex justify-center">
                            <span className="text-4xl text-white">⏰</span>
                        </div>
                        <div className="p-6 text-center">
                            <h2 className="text-lg font-bold text-gray-800 mb-2">Atenção ao Prazo</h2>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                Devido ao horário (após às <span className="font-bold text-amber-600">15:00</span>),
                                esta solicitação será atendida em <span className="font-bold text-gray-800">D+2</span>.
                                <br /><br />
                                <span className="text-xs italic text-gray-400">
                                    O prazo padrão D+1 é válido apenas para pedidos realizados até às 15h.
                                </span>
                            </p>
                            <button
                                onClick={() => setShowCutoffAlert(false)}
                                className="w-full bg-gray-800 text-white font-semibold py-3 rounded-xl hover:bg-gray-900 transition-all shadow-md active:scale-95"
                            >
                                Compreendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                {/* Alerta de sucesso */}
                {sucesso && (
                    <div className="mb-6 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        ✓ {sucesso}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar scroll-smooth">
                    <button
                        id="tab-nova"
                        onClick={() => setTabAtiva('nova')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap shrink-0 ${tabAtiva === 'nova'
                            ? 'border-gray-800 text-gray-800'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Nova Solicitação
                    </button>
                    <button
                        id="tab-historico"
                        onClick={() => setTabAtiva('historico')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap shrink-0 flex items-center gap-2 ${tabAtiva === 'historico'
                            ? 'border-gray-800 text-gray-800'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Acompanhamento
                        {historicoSupabase.length > 0 && (
                            <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${tabAtiva === 'historico' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>{historicoSupabase.length}</span>
                        )}
                    </button>
                </div>

                {/* ====== TAB: Nova Solicitação ====== */}
                {tabAtiva === 'nova' && (
                    <div className="max-w-2xl mx-auto">
                        {/* Stepper */}
                        <div className="flex items-center justify-between mb-8">
                            {STEPS.map((label, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${i < step
                                            ? 'bg-green-500 text-white'
                                            : i === step
                                                ? 'bg-gray-800 text-white ring-4 ring-gray-100'
                                                : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {i < step ? '✓' : i + 1}
                                        </div>
                                        <span className={`text-[9px] uppercase tracking-wide hidden lg:block whitespace-nowrap ${i <= step ? 'text-gray-700 font-semibold' : 'text-gray-300'}`}>
                                            {label}
                                        </span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`w-8 sm:w-16 h-0.5 mx-1 mb-3 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Erro */}
                        {erro && (
                            <div className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                <span className="mt-0.5 shrink-0">⚠</span>
                                <span>{erro}</span>
                            </div>
                        )}

                        {/* STEP 0: Identificação */}
                        {step === 0 && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
                                <h2 className="text-lg font-semibold text-gray-800 mb-1">Identificação do Técnico</h2>
                                <p className="text-sm text-gray-400 mb-6">Informe a matrícula do colaborador para iniciar o processo de troca.</p>
                                <form onSubmit={handleBuscarTecnico} className="space-y-4">
                                    <div>
                                        <label htmlFor="input-matricula-tecnico" className="block text-xs font-medium text-gray-500 mb-1.5">
                                            Matrícula do Técnico
                                        </label>
                                        <input
                                            id="input-matricula-tecnico"
                                            type="text"
                                            value={form.tecnicoMatricula}
                                            onChange={(e) => setForm((prev) => ({ ...prev, tecnicoMatricula: e.target.value.toUpperCase() }))}
                                            placeholder="Ex: 123456"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        id="btn-buscar-tecnico"
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 bg-gray-800 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                        Validar Técnico →
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* STEP 1: Validação */}
                        {step === 1 && form.tecnicoValidado && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
                                <h2 className="text-lg font-semibold text-gray-800 mb-1">Técnico Validado</h2>
                                <p className="text-sm text-gray-400 mb-6">Confirme se as informações do colaborador estão corretas.</p>
                                <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Nome Completo</p>
                                        <p className="text-sm font-semibold text-gray-800">{form.tecnicoValidado.nome}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Matrícula</p>
                                        <p className="text-sm font-mono font-semibold text-gray-800">{form.tecnicoValidado.matricula}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Cargo</p>
                                        <p className="text-sm text-gray-700">{form.tecnicoValidado.cargo}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Status</p>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {form.tecnicoValidado.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button id="btn-voltar-step1" onClick={handleVoltar} type="button"
                                        className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                        ← Corrigir
                                    </button>
                                    <button id="btn-confirmar-tecnico" onClick={() => setStep(2)} type="button"
                                        className="flex-1 bg-gray-800 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-900 transition-colors">
                                        Confirmar e Continuar →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Selecione o item */}
                        {step === 2 && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
                                <h2 className="text-lg font-semibold text-gray-800 mb-1">Selecione os Itens</h2>
                                <p className="text-sm text-gray-400 mb-6">
                                    Itens em carga de <span className="text-gray-700 font-semibold">{form.tecnicoValidado?.nome}</span>. Selecione um ou mais itens para devolução.
                                </p>

                                {/* ── Alerta de bloqueio 45 dias ── */}
                                {itemBloqueadoAlerta && (
                                    <div className="mb-4 flex items-start gap-3 text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-4 bounce-in">
                                        <span className="text-lg mt-0.5 shrink-0">⚠</span>
                                        <div>
                                            <p className="font-semibold text-red-800 mb-1">
                                                Item bloqueado — Regra de 45 dias
                                            </p>
                                            <p className="text-red-700">
                                                Este item foi trocado recentemente e não pode ser selecionado novamente.
                                            </p>
                                            <p className="text-red-600 mt-1 font-medium text-xs">
                                                Próxima troca permitida em {itemBloqueadoAlerta.dataLiberacao} (faltam {itemBloqueadoAlerta.diasRestantes} dia{itemBloqueadoAlerta.diasRestantes !== 1 ? 's' : ''}).
                                            </p>
                                            <button
                                                onClick={() => { setItemBloqueadoAlerta(null); }}
                                                className="mt-3 text-xs font-medium text-gray-600 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                            >
                                                Fechar Aviso
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Campo de Busca */}
                                <div className="mb-4 relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar item pelo nome ou código..."
                                        value={filtroItem}
                                        onChange={(e) => setFiltroItem(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                                    />
                                    {filtroItem && (
                                        <button
                                            onClick={() => setFiltroItem('')}
                                            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>

                                {cargaTecnico.length === 0 ? (
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg py-10 text-center">
                                        <p className="text-sm text-gray-400">Nenhum material em carga para este técnico</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                                        {cargaTecnico
                                            .filter(item =>
                                                item.materialNome.toLowerCase().includes(filtroItem.toLowerCase()) ||
                                                item.materialId.toString().includes(filtroItem)
                                            )
                                            .map((item) => {
                                                const bloqueio = trocasRecentes.get(item.materialNome);
                                                const estaBloqueado = bloqueio && bloqueio.bloqueado;
                                                const isSelected = form.itensSelecionados.some(i => i.id === item.id);

                                                return (
                                                    <button
                                                        key={item.id}
                                                        id={`btn-item-saida-${item.id}`}
                                                        onClick={() => handleSelecionarItemSaida(item)}
                                                        type="button"
                                                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${estaBloqueado
                                                            ? 'border-gray-100 bg-gray-50/50 opacity-50 cursor-not-allowed'
                                                            : isSelected
                                                                ? 'border-gray-800 bg-gray-50 ring-2 ring-gray-800/5'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-gray-800 border-gray-800' : 'border-gray-300 bg-white'}`}>
                                                                    {isSelected && <span className="text-[10px] text-white">✓</span>}
                                                                </div>
                                                                <p className={`text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{item.materialNome}</p>
                                                                {estaBloqueado && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap">
                                                                        🔒 Bloqueado
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 ml-6">
                                                                <p className="text-xs text-gray-400">Qtd: <span className="text-gray-600">{item.quantidade}</span></p>
                                                                <p className="text-xs text-gray-400">Atribuição: <span className="text-gray-600">{new Date(item.dataAtribuicao).toLocaleDateString('pt-BR')}</span></p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-lg transition-transform ${isSelected ? 'scale-110 text-gray-800' : 'text-gray-300 shrink-0 ml-2 group-hover:text-gray-400'}`}>
                                                            {isSelected ? '✓' : '＋'}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                )}
                                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                    <button id="btn-voltar-step2" onClick={handleVoltar} type="button"
                                        className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors">
                                        ← Alterar Técnico
                                    </button>
                                    <div className="flex items-center gap-4">
                                        {form.itensSelecionados.length > 0 && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                {form.itensSelecionados.length} {form.itensSelecionados.length === 1 ? 'item' : 'itens'}
                                            </span>
                                        )}
                                        <button
                                            onClick={handleProsseguirParaMotivos}
                                            disabled={form.itensSelecionados.length === 0}
                                            className="bg-gray-800 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-900 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                                        >
                                            Prosseguir →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Motivos Individuais */}
                        {step === 3 && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-800 mb-1">Motivos da Troca</h2>
                                <p className="text-sm text-gray-400 mb-8">
                                    Justifique a solicitação para cada um dos <span className="text-gray-700 font-semibold">{form.itensSelecionados.length} itens</span> selecionados.
                                </p>

                                <form onSubmit={handleValidarMotivos} className="space-y-6">
                                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                        {form.itensSelecionados.map((item) => (
                                            <div key={item.id} className="p-5 border border-gray-100 rounded-xl bg-gray-50/30 group transition-all hover:border-gray-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-sm font-bold text-gray-700">{item.materialNome}</p>
                                                    <span className="text-[10px] text-gray-400 font-mono">ID: {item.materialId}</span>
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        value={form.motivos[item.id] || ''}
                                                        onChange={(e) => setForm(f => ({
                                                            ...f,
                                                            motivos: { ...f.motivos, [item.id]: e.target.value }
                                                        }))}
                                                        className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-800 focus:ring-1 focus:ring-gray-800 outline-none transition-all text-sm text-gray-700 bg-white cursor-pointer"
                                                        required
                                                    >
                                                        <option value="">Selecione o motivo...</option>
                                                        <option value="Descarte">Descarte</option>
                                                        <option value="Desgaste">Desgaste</option>
                                                        <option value="Furto">Furto</option>
                                                        <option value="Roubo">Roubo</option>
                                                        <option value="Defeito">Defeito</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                                        <button id="btn-voltar-step3" onClick={handleVoltar} type="button"
                                            className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all active:scale-95 text-center">
                                            ← Alterar Itens
                                        </button>
                                        <button id="btn-confirmar-motivos" type="submit"
                                            className="flex-1 bg-gray-800 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-900 transition-all shadow-sm active:scale-95">
                                            Revisar Solicitação →
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* STEP 4: Confirmação Final Múltipla */}
                        {step === 4 && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">Resumo da Solicitação</h2>
                                        <p className="text-sm text-gray-400">{form.itensSelecionados.length} itens para troca</p>
                                    </div>
                                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                        Lote de Trocas
                                    </span>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Técnico Beneficiário</p>
                                        <p className="text-sm font-bold text-gray-800">{form.tecnicoValidado?.nome}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{form.tecnicoValidado?.matricula} · {form.tecnicoValidado?.cargo}</p>
                                    </div>

                                    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lista de Itens e Motivos</p>
                                        </div>
                                        <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto custom-scrollbar">
                                            {form.itensSelecionados.map(item => (
                                                <div key={item.id} className="px-5 py-4 flex justify-between items-start gap-4 hover:bg-gray-50/50 transition-colors">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{item.materialNome}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            Prazo {new Date().getHours() >= 15 ? 'D+2' : 'D+1'}: {new Date(calcularPrazo(new Date().toISOString(), new Date().getHours() >= 15 ? 2 : 1)).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                                                        {form.motivos[item.id]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                    <button id="btn-voltar-resumo" onClick={handleVoltar} type="button"
                                        className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition-all">
                                        ← Alterar Motivos
                                    </button>
                                    <button
                                        id="btn-confirmar-lote"
                                        onClick={handleConfirmar}
                                        type="button"
                                        disabled={loading}
                                        className="inline-flex items-center gap-3 bg-green-600 text-white text-sm font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <span className="text-lg">✓</span>
                                        )}
                                        Finalizar Solicitação
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ====== TAB: Histórico / Acompanhamento ====== */}
                {tabAtiva === 'historico' && (
                    <HistoricoSection
                        dados={historicoSupabase}
                        total={totalHistorico}
                        pagina={historicoPagina}
                        onPaginaChange={(p) => fetchHistorico(p)}
                        loading={loading}
                        onNovaSolicitacao={() => setTabAtiva('nova')}
                    />
                )}
            </main>
        </div>
    );
}

// ---- Seção de Histórico ----
const ITENS_POR_PAGINA = 10;

function HistoricoSection({
    dados, total, pagina, onPaginaChange, loading, onNovaSolicitacao
}: {
    dados: any[]; total: number; pagina: number; onPaginaChange: (p: number) => void; loading: boolean; onNovaSolicitacao: () => void
}) {
    const totalPaginas = Math.max(1, Math.ceil(total / ITENS_POR_PAGINA));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const paginados = dados;

    if (loading) return (
        <div className="border border-gray-200 rounded-xl p-16 text-center bg-white">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Carregando...</p>
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800">Solicitações Registradas</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{total} registros</span>
            </div>

            {dados.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <p className="text-sm text-gray-400 mb-4">Nenhuma solicitação encontrada</p>
                    <button onClick={onNovaSolicitacao}
                        className="bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors">
                        Criar Primeira Solicitação
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-100 bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Técnico</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Item Trocado</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginados.map((sol) => (
                                    <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4 font-mono text-xs text-gray-400">{sol.id.split('-')[0].toUpperCase()}</td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold text-gray-800">{sol.tecnicoNome}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{sol.tecnicoMatricula}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm text-gray-700">{sol.itemSaidaNome}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm text-gray-600">{new Date(sol.dataSolicitacao).toLocaleDateString('pt-BR')}</p>
                                            <TimeAgoLabel status={sol.status} dataSolicitacao={sol.dataSolicitacao} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1">
                                                <StatusBadge status={sol.status} />
                                                {sol.status === 'liberado_retirada' && (
                                                    <PrazoRetirada dataLiberacao={sol.dataSolicitacao} />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List */}
                    <div className="lg:hidden divide-y divide-gray-100">
                        {paginados.map((sol) => (
                            <div key={sol.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="font-mono text-[10px] text-gray-400">#{sol.id.split('-')[0].toUpperCase()}</span>
                                        <h3 className="text-sm font-semibold text-gray-800 mt-0.5">{sol.tecnicoNome}</h3>
                                        <p className="text-xs text-gray-400">{sol.tecnicoMatricula}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <StatusBadge status={sol.status} />
                                        {sol.status === 'liberado_retirada' && (
                                            <PrazoRetirada dataLiberacao={sol.dataSolicitacao} />
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Material</p>
                                    <p className="text-sm text-gray-700">{sol.itemSaidaNome}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-400">{new Date(sol.dataSolicitacao).toLocaleDateString('pt-BR')}</p>
                                    <TimeAgoLabel status={sol.status} dataSolicitacao={sol.dataSolicitacao} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginação */}
                    {totalPaginas > 1 && (
                        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
                            <span className="text-xs text-gray-400">Pág. {paginaAtual} de {totalPaginas} · {total} registros</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => onPaginaChange(1)} disabled={paginaAtual === 1}
                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" /></svg>
                                </button>
                                <button onClick={() => onPaginaChange(Math.max(1, paginaAtual - 1))} disabled={paginaAtual === 1}
                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                    const inicio = Math.max(1, Math.min(paginaAtual - 2, totalPaginas - 4));
                                    const num = inicio + i;
                                    return num <= totalPaginas ? (
                                        <button key={num} onClick={() => onPaginaChange(num)}
                                            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${num === paginaAtual ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                            {num}
                                        </button>
                                    ) : null;
                                })}
                                <button onClick={() => onPaginaChange(Math.min(totalPaginas, paginaAtual + 1))} disabled={paginaAtual === totalPaginas}
                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                                <button onClick={() => onPaginaChange(totalPaginas)} disabled={paginaAtual === totalPaginas}
                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
