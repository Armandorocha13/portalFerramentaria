// ============================================================
// PÁGINA DO SUPERVISOR — Formulário de Troca em 5 Etapas
// ============================================================

import { useState, useMemo, useEffect, useCallback, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSolicitacoes } from '../context/SolicitacoesContext';
import { getTecnico, getCargaTecnico, getCatalogoMateriais, registrarTroca, getHistoricoTrocas } from '../lib/database-queries';
import { supabase } from '../lib/supabase';
import { calcularPrazoD1 } from '../mocks/database';
import type { ItemCarga, Material, FormularioTroca } from '../types';

// ---- Ícones SVG inline ----
function IconCheck() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

function IconArrowRight() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}

function IconArrowLeft() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    );
}

const STEPS = [
    'Identificação',
    'Validação',
    'Item de Saída',
    'Motivo',
    'Confirmação',
] as const;

const INITIAL_FORM: FormularioTroca = {
    tecnicoMatricula: '',
    tecnicoValidado: null,
    itemSaidaSelecionado: null,
    materialEntradaSelecionado: null,
    motivo: '',
};

export default function SupervisorPage() {
    const { usuario, logout } = useAuth();
    const { adicionarSolicitacao, buscarPorSupervisor } = useSolicitacoes();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormularioTroca>({ ...INITIAL_FORM });
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState('');
    const [tabAtiva, setTabAtiva] = useState<'nova' | 'historico'>('nova');

    const [cargaTecnico, setCargaTecnico] = useState<ItemCarga[]>([]);
    const [catalogoMateriais, setCatalogoMateriais] = useState<Material[]>([]);
    const [historicoSupabase, setHistoricoSupabase] = useState<any[]>([]);

    const [notificacao, setNotificacao] = useState<{ id: string; texto: string } | null>(null);

    const fetchHistorico = useCallback(async () => {
        if (!usuario?.id) return;
        setLoading(true);
        try {
            const data = await getHistoricoTrocas(usuario.id);
            setHistoricoSupabase(data);
        } finally {
            setLoading(false);
        }
    }, [usuario]);

    // Carrega histórico quando a aba abre
    useEffect(() => {
        if (tabAtiva === 'historico') fetchHistorico();
    }, [tabAtiva, fetchHistorico]);

    // Supabase Realtime: escuta atualizações de status em tempo real
    useEffect(() => {
        if (!usuario?.id) return;

        const labelStatus: Record<string, string> = {
            pedido_em_andamento: '🔵 Pedido em andamento',
            sem_estoque: '🔴 Sem estoque',
            liberado_retirada: '🟢 Liberado p/ retirada',
        };

        const channel = supabase
            .channel('historico-supervisor')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'historico_trocas',
                    filter: `supervisor_id=eq.${usuario.id}`,
                },
                (payload) => {
                    const updated = payload.new as any;
                    // Atualiza o item na lista sem refetch
                    setHistoricoSupabase((prev) =>
                        prev.map((item) =>
                            item.id === updated.id
                                ? { ...item, status: updated.status }
                                : item
                        )
                    );
                    // Toast de notificação
                    const texto = labelStatus[updated.status] || updated.status;
                    setNotificacao({ id: updated.id, texto });
                    setTimeout(() => setNotificacao(null), 5000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [usuario]);

    const minhasSolicitacoes = useMemo(
        () => buscarPorSupervisor(usuario?.matricula || ''),
        [buscarPorSupervisor, usuario]
    );

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
            const [carga, materiais] = await Promise.all([
                getCargaTecnico(tecnico.matricula),
                getCatalogoMateriais()
            ]);
            setCargaTecnico(carga);
            setCatalogoMateriais(materiais);
            setForm((prev) => ({ ...prev, tecnicoValidado: tecnico }));
            setStep(1);
        } catch (err: any) {
            setErro(err.message || 'Erro ao consultar técnico.');
        } finally {
            setLoading(false);
        }
    }

    function handleSelecionarItemSaida(item: ItemCarga) {
        setForm((prev) => ({
            ...prev,
            itemSaidaSelecionado: item,
            materialEntradaSelecionado: {
                id: item.materialId,
                nome: item.materialNome,
                categoria: 'Geral',
                codigo: item.materialId,
            }
        }));
        setStep(3);
    }

    function handleMotivo(e: FormEvent) {
        e.preventDefault();
        if (!form.motivo.trim()) {
            setErro('Informe o motivo da troca.');
            return;
        }
        setErro('');
        setStep(4);
    }

    async function handleConfirmar() {
        if (!usuario || !form.tecnicoValidado || !form.itemSaidaSelecionado || !form.materialEntradaSelecionado) return;
        setLoading(true);
        try {
            await registrarTroca({
                supervisor_id: usuario.id,
                supervisor_matricula: usuario.matricula,
                supervisor_nome: usuario.nome,
                tecnico_matricula: form.tecnicoValidado.matricula,
                item_saida_id: form.itemSaidaSelecionado.id,
                material_entrada_nome: form.materialEntradaSelecionado.nome,
                motivo: form.motivo.trim(),
            });

            const agora = new Date().toISOString().split('T')[0];
            const prazo = calcularPrazoD1(agora);

            const nova = adicionarSolicitacao({
                supervisorMatricula: usuario.matricula,
                tecnicoMatricula: form.tecnicoValidado.matricula,
                tecnicoNome: form.tecnicoValidado.nome,
                itemSaidaId: form.itemSaidaSelecionado.id,
                itemSaidaNome: form.itemSaidaSelecionado.materialNome,
                itemSaidaPatrimonio: form.itemSaidaSelecionado.patrimonio,
                materialEntradaId: form.materialEntradaSelecionado.id,
                materialEntradaNome: form.materialEntradaSelecionado.nome,
                motivo: form.motivo.trim(),
                dataSolicitacao: agora,
                prazoResolucao: prazo,
                status: 'pendente',
            });

            setSucesso(`Solicitação ${nova.id} registrada com sucesso!`);
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

    function handleResetar() {
        setForm({ ...INITIAL_FORM });
        setStep(0);
        setErro('');
    }

    function handleVoltar() {
        setErro('');
        if (step === 1) setForm((prev) => ({ ...prev, tecnicoValidado: null }));
        if (step === 3) setForm((prev) => ({ ...prev, itemSaidaSelecionado: null, materialEntradaSelecionado: null }));
        setStep((prev) => Math.max(0, prev - 1));
    }

    // ---- RENDER ----
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="border-b border-slate-200 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <img src="/logo.png" alt="FFA Infraestrutura" className="h-8 sm:h-10" />
                        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
                        <div>
                            <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight uppercase tracking-tight">Gestão de Trocas</h1>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
                                {usuario?.nome.split(' ')[0]} · {usuario?.setor}
                            </p>
                        </div>
                    </div>
                    <button
                        id="btn-logout"
                        onClick={logout}
                        className="text-[10px] sm:text-xs text-slate-500 hover:text-black font-bold uppercase tracking-widest border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-all bg-white"
                    >
                        Sair
                    </button>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                {/* Sucesso global */}
                {sucesso && (
                    <div className="mb-6 flex items-center gap-3 text-sm bg-emerald-500 text-white rounded-xl px-4 py-4 shadow-lg shadow-emerald-200 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="bg-white/20 p-1.5 rounded-full"><IconCheck /></div>
                        <span className="font-bold">{sucesso}</span>
                    </div>
                )}

                {/* Toast Realtime — atualização de status pelo estoque */}
                {notificacao && (
                    <div className="fixed top-5 right-5 z-[100] flex items-start gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-2xl shadow-slate-300/50 max-w-sm animate-in slide-in-from-right-4 duration-300">
                        <span className="text-lg leading-none mt-0.5">🔔</span>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Atualização do Estoque</p>
                            <p className="text-sm font-black text-slate-900">{notificacao.texto}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pedido #{notificacao.id.split('-')[0].toUpperCase()}</p>
                        </div>
                        <button onClick={() => setNotificacao(null)} className="ml-auto text-slate-300 hover:text-slate-600 transition-colors text-lg leading-none">&times;</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl mb-8 w-fit mx-auto">
                    <button
                        id="tab-nova"
                        onClick={() => setTabAtiva('nova')}
                        className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${tabAtiva === 'nova' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Nova Solicitação
                    </button>
                    <button
                        id="tab-historico"
                        onClick={() => setTabAtiva('historico')}
                        className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${tabAtiva === 'historico' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Acompanhamento
                        {historicoSupabase.length > 0 && (
                            <span className="bg-black text-white text-[10px] rounded-full px-2 py-0.5">{historicoSupabase.length}</span>
                        )}
                    </button>
                </div>

                {/* ====== TAB: Nova Solicitação ====== */}
                {tabAtiva === 'nova' && (
                    <div className="max-w-3xl mx-auto">

                        {/* Stepper */}
                        <div className="mb-10 py-2">
                            <div className="flex items-center justify-center w-full">
                                {STEPS.map((label, i) => (
                                    <div key={i} className="flex items-center flex-shrink-0">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black transition-all shrink-0 ${i < step
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                                                : i === step
                                                    ? 'bg-black text-white shadow-xl shadow-black/20 scale-110'
                                                    : 'bg-white text-slate-300 border border-slate-200'}`}
                                            >
                                                {i < step ? <IconCheck /> : i + 1}
                                            </div>
                                            <span className={`text-[9px] uppercase tracking-widest hidden lg:inline whitespace-nowrap ${i <= step ? 'text-slate-900 font-black' : 'text-slate-300 font-bold'}`}>
                                                {label}
                                            </span>
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className={`flex-1 min-w-[12px] max-w-[60px] h-[2px] mx-1.5 sm:mx-2 rounded-full shrink-0 ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Erro */}
                        {erro && (
                            <div className="mb-6 flex items-center gap-3 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {erro}
                            </div>
                        )}

                        {/* ====== STEP 0: Identificação ====== */}
                        {step === 0 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xl shadow-slate-200/50">
                                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Identificação</h2>
                                <p className="text-sm text-slate-500 mb-8 font-medium">Informe a matrícula do colaborador para iniciar o processo de troca.</p>
                                <form onSubmit={handleBuscarTecnico} className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="input-matricula-tecnico" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                            Matrícula do Técnico
                                        </label>
                                        <input
                                            id="input-matricula-tecnico"
                                            type="text"
                                            value={form.tecnicoMatricula}
                                            onChange={(e) => setForm((prev) => ({ ...prev, tecnicoMatricula: e.target.value.toUpperCase() }))}
                                            placeholder="EX: 123456"
                                            className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl text-base font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        id="btn-buscar-tecnico"
                                        type="submit"
                                        disabled={loading}
                                        className="w-full sm:w-auto bg-black text-white text-xs font-black uppercase tracking-widest px-10 py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-lg shadow-black/10"
                                    >
                                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Validar Técnico'}
                                        <IconArrowRight />
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ====== STEP 1: Validação ====== */}
                        {step === 1 && form.tecnicoValidado && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xl shadow-slate-200/50">
                                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Técnico Validado</h2>
                                <p className="text-sm text-slate-500 mb-8 font-medium">Confirme se as informações do colaborador estão corretas.</p>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 grid sm:grid-cols-2 gap-y-6 gap-x-8">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome Completo</span>
                                        <p className="font-bold text-slate-900">{form.tecnicoValidado.nome}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Matrícula</span>
                                        <p className="font-mono font-bold text-slate-900">{form.tecnicoValidado.matricula}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cargo</span>
                                        <p className="font-bold text-slate-700">{form.tecnicoValidado.cargo}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                                        <p className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase border border-emerald-100">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            {form.tecnicoValidado.status}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button id="btn-voltar-step1" onClick={handleVoltar} type="button" className="px-6 py-4 border-2 border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                        <IconArrowLeft /> Corrigir
                                    </button>
                                    <button id="btn-confirmar-tecnico" onClick={() => setStep(2)} type="button" className="flex-1 bg-black text-white text-xs font-black uppercase tracking-widest px-10 py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/10">
                                        Confirmar e Continuar <IconArrowRight />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ====== STEP 2: Item de Saída ====== */}
                        {step === 2 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xl shadow-slate-200/50">
                                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Item de Saída</h2>
                                <p className="text-sm text-slate-500 mb-8 font-medium">
                                    Itens em carga de <span className="text-black font-black uppercase">{form.tecnicoValidado?.nome}</span>. Selecione o que será devolvido.
                                </p>
                                {cargaTecnico.length === 0 ? (
                                    <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
                                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Nenhum material em carga</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {cargaTecnico.map((item) => (
                                            <button
                                                key={item.id}
                                                id={`btn-item-saida-${item.id}`}
                                                onClick={() => handleSelecionarItemSaida(item)}
                                                type="button"
                                                className="w-full text-left p-5 rounded-2xl border-2 border-slate-50 hover:border-black hover:bg-slate-50 transition-all group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.materialNome}</h3>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Qtd: <span className="text-slate-900">{item.quantidade}</span></p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Data: <span className="text-slate-900">{new Date(item.dataAtribuicao).toLocaleDateString('pt-BR')}</span></p>
                                                            {item.patrimonio && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patr: <span className="text-slate-900">{item.patrimonio}</span></p>}
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition-all">
                                                        <IconArrowRight />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <button id="btn-voltar-step2" onClick={handleVoltar} type="button" className="text-slate-400 hover:text-black transition-colors text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <IconArrowLeft /> Alterar Colaborador
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ====== STEP 3: Motivo ====== */}
                        {step === 3 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xl shadow-slate-200/50">
                                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Motivo da Troca</h2>
                                <p className="text-sm text-slate-500 mb-8 font-medium">
                                    Substituição de: <span className="text-black font-black uppercase">{form.itemSaidaSelecionado?.materialNome}</span>
                                </p>
                                <form onSubmit={handleMotivo} className="space-y-8">
                                    <div className="space-y-3">
                                        <label htmlFor="select-motivo" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                            Motivo da Solicitação
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="select-motivo"
                                                value={form.motivo}
                                                onChange={(e) => setForm((prev) => ({ ...prev, motivo: e.target.value }))}
                                                className="w-full appearance-none px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all text-slate-700 font-bold bg-white cursor-pointer"
                                                autoFocus
                                            >
                                                <option value="">Selecione o motivo...</option>
                                                <option value="Descarte">Descarte</option>
                                                <option value="Desgaste">Desgaste</option>
                                                <option value="Furto">Furto</option>
                                                <option value="Roubo">Roubo</option>
                                                <option value="Defeito">Defeito</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                        <button id="btn-voltar-step3" onClick={handleVoltar} type="button" className="px-6 py-4 border-2 border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                            <IconArrowLeft /> Trocar Item
                                        </button>
                                        <button id="btn-confirmar-motivo" type="submit" className="flex-1 bg-black text-white text-xs font-black uppercase tracking-widest px-10 py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/10">
                                            Revisar e Finalizar <IconArrowRight />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ====== STEP 4: Confirmação ====== */}
                        {step === 4 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full opacity-50" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Resumo Final</h2>
                                        <span className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.1em] shadow-sm"> Troca</span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-8 mb-10">
                                        <div className="space-y-6">
                                            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
                                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Informações do Técnico</h4>
                                                <p className="text-sm font-black text-slate-900 uppercase">{form.tecnicoValidado?.nome}</p>
                                                <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                                                    {form.tecnicoValidado?.matricula} · {form.tecnicoValidado?.cargo}
                                                </p>
                                            </div>
                                            <div className="bg-black text-white rounded-2xl p-6 shadow-xl shadow-black/20">
                                                <h4 className="text-[9px] font-black opacity-50 uppercase tracking-[0.2em] mb-4">Item para Devolução</h4>
                                                <p className="text-sm font-black uppercase leading-tight">{form.itemSaidaSelecionado?.materialNome}</p>
                                                <div className="mt-4 flex items-center gap-3 text-[10px] font-bold opacity-80 border-t border-white/10 pt-4">
                                                    <span className="bg-white/10 px-2 py-1 rounded">D+1</span>
                                                    <span>Previsão: {new Date(calcularPrazoD1(new Date().toISOString())).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 h-full min-h-[160px] flex flex-col">
                                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Motivo Informado</h4>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic grow">
                                                    "{form.motivo}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-100 gap-6">
                                        <button id="btn-voltar-resumo" onClick={handleVoltar} type="button" className="text-slate-400 hover:text-black transition-colors text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                            <IconArrowLeft /> Corrigir Dados
                                        </button>
                                        <button
                                            id="btn-confirmar-troca"
                                            onClick={handleConfirmar}
                                            type="button"
                                            disabled={loading}
                                            className="flex-1 sm:flex-none bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-12 py-4 rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-200"
                                        >
                                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><IconCheck /> Registrar Troca</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ====== TAB: Histórico / Acompanhamento ====== */}
                {tabAtiva === 'historico' && (
                    <HistoricoSection
                        dados={historicoSupabase}
                        loading={loading}
                        onNovaSolicitacao={() => setTabAtiva('nova')}
                    />
                )}
            </main>
        </div>
    );
}

// ---- HistoricoSection: apenas paginação ----
const ITENS_POR_PAGINA = 10;

function HistoricoSection({ dados, loading, onNovaSolicitacao }: { dados: any[]; loading: boolean; onNovaSolicitacao: () => void }) {
    const [pagina, setPagina] = useState(1);
    const totalPaginas = Math.max(1, Math.ceil(dados.length / ITENS_POR_PAGINA));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const paginados = dados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

    if (loading) return (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-400 font-black uppercase tracking-widest">Carregando...</p>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Solicitações Registradas</h2>
                <span className="bg-slate-200/50 text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                    Total: {dados.length}
                </span>
            </div>

            {dados.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm mb-4">Nenhuma solicitação encontrada</p>
                    <button onClick={onNovaSolicitacao} className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-black/10">
                        Criar Primeira Solicitação
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40">
                    {/* Desktop Table */}
                    <div className="hidden lg:block">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Colaborador</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Supervisor</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Item Trocado</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {paginados.map((sol) => (
                                    <tr key={sol.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-5 font-mono text-[10px] font-black text-slate-400">{sol.id.split('-')[0].toUpperCase()}</td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{sol.tecnicoNome}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{sol.tecnicoMatricula}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-black text-slate-700 uppercase">{sol.supervisorNome ?? '—'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">{sol.supervisorMatricula ?? ''}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-xs font-black text-slate-700 uppercase">{sol.itemSaidaNome}</p>
                                            <p className="text-[9px] text-emerald-500 font-black uppercase mt-1">✓ Reposição</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-xs font-bold text-slate-900">{new Date(sol.dataSolicitacao).toLocaleDateString('pt-BR')}</p>
                                        </td>
                                        <td className="px-6 py-5"><StatusBadge status={sol.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {paginados.map((sol) => (
                            <div key={sol.id} className="p-5 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="font-mono text-[10px] font-black text-slate-300">#{sol.id.split('-')[0].toUpperCase()}</span>
                                        <h3 className="text-sm font-black text-slate-900 uppercase mt-1">{sol.tecnicoNome}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold">{sol.tecnicoMatricula}</p>
                                    </div>
                                    <StatusBadge status={sol.status} />
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Material</p>
                                    <p className="text-xs font-black text-slate-800 uppercase">{sol.itemSaidaNome}</p>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400">{new Date(sol.dataSolicitacao).toLocaleDateString('pt-BR')}</p>
                            </div>
                        ))}
                    </div>

                    {/* Paginação */}
                    {totalPaginas > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                Pág. {paginaAtual} de {totalPaginas} · {dados.length} registros
                            </span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPagina(1)} disabled={paginaAtual === 1} className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" /></svg>
                                </button>
                                <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                    const inicio = Math.max(1, Math.min(paginaAtual - 2, totalPaginas - 4));
                                    const num = inicio + i;
                                    return num <= totalPaginas ? (
                                        <button key={num} onClick={() => setPagina(num)}
                                            className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${num === paginaAtual ? 'bg-black text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                            {num}
                                        </button>
                                    ) : null;
                                })}
                                <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                                <button onClick={() => setPagina(totalPaginas)} disabled={paginaAtual === totalPaginas} className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-all">
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

// ---- Componentes auxiliares ----

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string; dot: string }> = {
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
        // legados
        pendente: {
            label: 'Pedido em andamento',
            className: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500 animate-pulse',
        },
        aprovada: {
            label: 'Liberado p/ retirada',
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
        },
        rejeitada: {
            label: 'Sem estoque',
            className: 'bg-red-50 text-red-700 border-red-200',
            dot: 'bg-red-500',
        },
        concluida: {
            label: 'Pedido em andamento',
            className: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500 animate-pulse',
        },
    };

    const c = config[status] ?? config.pedido_em_andamento;

    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap ${c.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
            {c.label}
        </span>
    );
}
