// ============================================================
// PÁGINA DO SUPERVISOR — Formulário de Troca em 6 Etapas
// ============================================================

import { useState, useMemo, useEffect, useCallback, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSolicitacoes } from '../context/SolicitacoesContext';
import { getTecnico, getCargaTecnico, getCatalogoMateriais, registrarTroca, getHistoricoTrocas } from '../lib/database-queries';
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
    'Item de Entrada',
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
    const { adicionarSolicitacao, buscarPorSupervisor, proximoSequencial } = useSolicitacoes();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormularioTroca>({ ...INITIAL_FORM });
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState('');
    const [tabAtiva, setTabAtiva] = useState<'nova' | 'historico'>('nova');
    const [filtroCategoria, setFiltroCategoria] = useState('');

    // Estados para carregar dados do Supabase
    const [cargaTecnico, setCargaTecnico] = useState<ItemCarga[]>([]);
    const [catalogoMateriais, setCatalogoMateriais] = useState<Material[]>([]);
    const [historicoSupabase, setHistoricoSupabase] = useState<any[]>([]);

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

    useEffect(() => {
        if (tabAtiva === 'historico') fetchHistorico();
    }, [tabAtiva, fetchHistorico]);

    const minhasSolicitacoes = useMemo(
        () => buscarPorSupervisor(usuario?.matricula || ''),
        [buscarPorSupervisor, usuario]
    );

    // ---- Lógica de cada Step ----

    // Step 0: Inserir matrícula do técnico
    async function handleBuscarTecnico(e: FormEvent) {
        e.preventDefault();
        setErro('');
        setLoading(true);

        try {
            if (!usuario?.id) throw new Error('Cessão inválida. Logue novamente.');

            const tecnico = await getTecnico(form.tecnicoMatricula, usuario.id);
            if (!tecnico) {
                setErro('Técnico não encontrado na sua equipe. Verifique a matrícula ou o vínculo.');
                return;
            }
            if (tecnico.status !== 'ativo') {
                setErro(`Técnico ${tecnico.nome} está com status: ${tecnico.status}. Apenas técnicos ativos realizam trocas.`);
                return;
            }

            // Carregar carga e catálogo assim que validar
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

    // Step 2: Selecionar item de saída
    function handleSelecionarItemSaida(item: ItemCarga) {
        setForm((prev) => ({ ...prev, itemSaidaSelecionado: item }));
        setStep(3);
    }

    // Step 3: Selecionar material de entrada
    function handleSelecionarMaterialEntrada(material: Material) {
        setForm((prev) => ({ ...prev, materialEntradaSelecionado: material }));
        setStep(4);
    }

    // Step 4: Motivo
    function handleMotivo(e: FormEvent) {
        e.preventDefault();
        if (!form.motivo.trim()) {
            setErro('Informe o motivo da troca.');
            return;
        }
        setErro('');
        setStep(5);
    }

    // Step 5: Confirmar e registrar
    async function handleConfirmar() {
        if (!usuario || !form.tecnicoValidado || !form.itemSaidaSelecionado || !form.materialEntradaSelecionado) return;
        setLoading(true);

        try {
            // 1. Registro Real no Supabase
            await registrarTroca({
                supervisor_id: usuario.id,
                tecnico_matricula: form.tecnicoValidado.matricula,
                item_saida_id: form.itemSaidaSelecionado.id,
                material_entrada_id: form.materialEntradaSelecionado.nome, // Usando nome como exemplo
                motivo: form.motivo.trim(),
            });

            // 2. Mock de adição local para histórico imediato (opcional)
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

            setSucesso(`Solicitação ${nova.id} registrada com sucesso no Supabase!`);
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

    // Resetar formulário
    function handleResetar() {
        setForm({ ...INITIAL_FORM });
        setStep(0);
        setErro('');
    }

    // Voltar step
    function handleVoltar() {
        setErro('');
        if (step === 1) {
            setForm((prev) => ({ ...prev, tecnicoValidado: null }));
        }
        if (step === 3) {
            setForm((prev) => ({ ...prev, itemSaidaSelecionado: null }));
        }
        if (step === 4) {
            setForm((prev) => ({ ...prev, materialEntradaSelecionado: null }));
        }
        setStep((prev) => Math.max(0, prev - 1));
    }

    // ---- Listagens ----
    // cargaTecnico já está vindo do state

    const todosMateriaisEntrada = catalogoMateriais;
    const categoriasUnicas = [...new Set(todosMateriaisEntrada.map((m) => m.categoria))];
    const materiaisFiltrados = filtroCategoria
        ? todosMateriaisEntrada.filter((m) => m.categoria === filtroCategoria)
        : todosMateriaisEntrada;

    // ---- RENDER ----
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-slate-200 sticky top-0 bg-white z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <img src="/logo.png" alt="FFA Infraestrutura" className="h-8 sm:h-10" />
                        <div>
                            <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Gestão de Trocas</h1>
                            <p className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[120px] sm:max-w-none">
                                {usuario?.nome.split(' ')[0]} · {usuario?.setor}
                            </p>
                        </div>
                    </div>
                    <button
                        id="btn-logout"
                        onClick={logout}
                        className="text-[11px] sm:text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded px-2.5 py-1.5 hover:border-slate-400 transition-colors bg-white font-medium"
                    >
                        Sair
                    </button>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                {/* Sucesso global */}
                {sucesso && (
                    <div className="mb-6 flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md px-4 py-3">
                        <IconCheck />
                        {sucesso}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-0 border-b border-slate-200 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <button
                        id="tab-nova"
                        onClick={() => setTabAtiva('nova')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${tabAtiva === 'nova'
                            ? 'border-black text-slate-900'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Nova Solicitação
                    </button>
                    <button
                        id="tab-historico"
                        onClick={() => setTabAtiva('historico')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${tabAtiva === 'historico'
                            ? 'border-black text-slate-900'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Acompanhamento
                        {historicoSupabase.length > 0 && (
                            <span className="ml-2 bg-black text-white text-xs rounded-full px-2 py-0.5">
                                {historicoSupabase.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* ====== TAB: Nova Solicitação ====== */}
                {tabAtiva === 'nova' && (
                    <div>
                        {/* Stepper */}
                        <div className="mb-8 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                            <div className="flex items-center min-w-max sm:min-w-0 sm:justify-between gap-1">
                                {STEPS.map((label, i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div
                                                className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${i < step
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : i === step
                                                        ? 'bg-black text-white shadow-md scale-110'
                                                        : 'bg-slate-100 text-slate-400'
                                                    }`}
                                            >
                                                {i < step ? <IconCheck /> : i + 1}
                                            </div>
                                            <span
                                                className={`text-[10px] sm:text-xs hidden md:inline whitespace-nowrap ${i <= step ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
                                                    }`}
                                            >
                                                {label}
                                            </span>
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div
                                                className={`w-4 sm:w-8 lg:w-12 h-[2px] mx-1 ${i < step ? 'bg-emerald-500' : 'bg-slate-200'
                                                    }`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Erro atual do step */}
                        {erro && (
                            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {erro}
                            </div>
                        )}

                        {/* ====== STEP 0: Identificação do Técnico ====== */}
                        {step === 0 && (
                            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-1">Identificação</h2>
                                <p className="text-sm text-slate-500 mb-6">Informe a matrícula do colaborador.</p>
                                <form onSubmit={handleBuscarTecnico} className="space-y-4">
                                    <div>
                                        <label htmlFor="input-matricula-tecnico" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                            Matrícula do Técnico
                                        </label>
                                        <input
                                            id="input-matricula-tecnico"
                                            type="text"
                                            value={form.tecnicoMatricula}
                                            onChange={(e) => setForm((prev) => ({ ...prev, tecnicoMatricula: e.target.value.toUpperCase() }))}
                                            placeholder="Ex: TEC001"
                                            className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:border-black transition-all"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        id="btn-buscar-tecnico"
                                        type="submit"
                                        disabled={loading}
                                        className="w-full sm:w-auto bg-black text-white text-sm font-bold px-8 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? 'Consultando...' : 'Validar Técnico'}
                                        <IconArrowRight />
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ====== STEP 1: Validação (dados do técnico) ====== */}
                        {step === 1 && form.tecnicoValidado && (
                            <div className="border border-slate-200 rounded-lg p-6">
                                <h2 className="text-base font-semibold text-slate-900 mb-1">Técnico Validado</h2>
                                <p className="text-sm text-slate-500 mb-5">Confirme os dados do colaborador abaixo.</p>

                                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-5">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Nome</span>
                                            <p className="font-medium text-slate-900">{form.tecnicoValidado.nome}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Matrícula</span>
                                            <p className="font-mono text-slate-900">{form.tecnicoValidado.matricula}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Cargo</span>
                                            <p className="text-slate-900">{form.tecnicoValidado.cargo}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Setor</span>
                                            <p className="text-slate-900">{form.tecnicoValidado.setor}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
                                            <p className="inline-flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-emerald-700 font-medium capitalize">{form.tecnicoValidado.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        id="btn-voltar-step1"
                                        onClick={handleVoltar}
                                        type="button"
                                        className="border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                                    >
                                        <IconArrowLeft />
                                        Voltar
                                    </button>
                                    <button
                                        id="btn-confirmar-tecnico"
                                        onClick={() => setStep(2)}
                                        type="button"
                                        className="bg-black text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                                    >
                                        Confirmar e Continuar
                                        <IconArrowRight />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ====== STEP 2: Item de Saída (carga do técnico) ====== */}
                        {step === 2 && (
                            <div className="border border-slate-200 rounded-lg p-6">
                                <h2 className="text-base font-semibold text-slate-900 mb-1">Selecionar Item de Saída</h2>
                                <p className="text-sm text-slate-500 mb-5">
                                    Itens atualmente em carga de <span className="font-medium text-slate-900">{form.tecnicoValidado?.nome}</span>.
                                    Selecione o item que será devolvido.
                                </p>

                                {cargaTecnico.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-slate-500">
                                        Este técnico não possui itens em carga.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {cargaTecnico.map((item) => (
                                            <button
                                                key={item.id}
                                                id={`btn-item-saida-${item.id}`}
                                                onClick={() => handleSelecionarItemSaida(item)}
                                                className="w-full text-left border border-slate-200 rounded-md p-3 hover:border-slate-900 hover:bg-slate-50 transition-colors group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{item.materialNome}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Qtd: {item.quantidade} · Atribuído em: {new Date(item.dataAtribuicao).toLocaleDateString('pt-BR')}
                                                            {item.patrimonio && ` · Patrimônio: ${item.patrimonio}`}
                                                        </p>
                                                    </div>
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <IconArrowRight />
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-5">
                                    <button
                                        id="btn-voltar-step2"
                                        onClick={handleVoltar}
                                        type="button"
                                        className="border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                                    >
                                        <IconArrowLeft />
                                        Voltar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ====== STEP 3: Item de Entrada (catálogo) ====== */}
                        {step === 3 && (
                            <div className="border border-slate-200 rounded-lg p-6">
                                <h2 className="text-base font-semibold text-slate-900 mb-1">Selecionar Item de Entrada</h2>
                                <p className="text-sm text-slate-500 mb-5">
                                    Escolha o novo material que substituirá <span className="font-medium text-slate-900">{form.itemSaidaSelecionado?.materialNome}</span>.
                                </p>

                                {/* Filtro por categoria */}
                                <div className="mb-4 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setFiltroCategoria('')}
                                        className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${!filtroCategoria
                                            ? 'bg-black text-white border-black'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                            }`}
                                    >
                                        Todos
                                    </button>
                                    {categoriasUnicas.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setFiltroCategoria(cat)}
                                            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${filtroCategoria === cat
                                                ? 'bg-black text-white border-black'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {materiaisFiltrados.map((material) => (
                                        <button
                                            key={material.id}
                                            id={`btn-material-entrada-${material.id}`}
                                            onClick={() => handleSelecionarMaterialEntrada(material)}
                                            className="w-full text-left border border-slate-200 rounded-md p-3 hover:border-slate-900 hover:bg-slate-50 transition-colors group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{material.nome}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {material.codigo} · {material.categoria} · {material.unidade}
                                                    </p>
                                                </div>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <IconArrowRight />
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-5">
                                    <button
                                        id="btn-voltar-step3"
                                        onClick={handleVoltar}
                                        type="button"
                                        className="border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                                    >
                                        <IconArrowLeft />
                                        Voltar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ====== STEP 4: Motivo ====== */}
                        {step === 4 && (
                            <div className="border border-slate-200 rounded-lg p-6">
                                <h2 className="text-base font-semibold text-slate-900 mb-1">Motivo da Troca</h2>
                                <p className="text-sm text-slate-500 mb-5">Descreva o motivo pelo qual a troca está sendo solicitada.</p>

                                <form onSubmit={handleMotivo}>
                                    <textarea
                                        id="input-motivo"
                                        value={form.motivo}
                                        onChange={(e) => setForm((prev) => ({ ...prev, motivo: e.target.value }))}
                                        placeholder="Ex: Item apresentando defeito de fabricação no mecanismo de travamento..."
                                        rows={4}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors resize-none"
                                        autoFocus
                                    />
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            id="btn-voltar-step4"
                                            onClick={handleVoltar}
                                            type="button"
                                            className="border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                                        >
                                            <IconArrowLeft />
                                            Voltar
                                        </button>
                                        <button
                                            id="btn-continuar-motivo"
                                            type="submit"
                                            className="bg-black text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                                        >
                                            Revisar
                                            <IconArrowRight />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ====== STEP 5: Confirmação ====== */}
                        {step === 5 && (
                            <div className="border border-slate-200 rounded-lg p-6">
                                <h2 className="text-base font-semibold text-slate-900 mb-1">Confirmar Solicitação</h2>
                                <p className="text-sm text-slate-500 mb-5">Revise os dados abaixo antes de registrar a troca.</p>

                                <div className="space-y-4 mb-6">
                                    {/* ID Preview */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider">ID da Solicitação</span>
                                        <span className="font-mono text-sm font-semibold text-slate-900">
                                            SOL-{String(proximoSequencial).padStart(5, '0')}
                                        </span>
                                    </div>

                                    {/* Grid de resumo */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <SummaryCard label="Técnico" value={form.tecnicoValidado?.nome || ''} sub={form.tecnicoValidado?.matricula || ''} />
                                        <SummaryCard label="Setor" value={form.tecnicoValidado?.setor || ''} sub={form.tecnicoValidado?.cargo || ''} />
                                        <SummaryCard
                                            label="Item de Saída (devolver)"
                                            value={form.itemSaidaSelecionado?.materialNome || ''}
                                            sub={form.itemSaidaSelecionado?.patrimonio ? `Patrimônio: ${form.itemSaidaSelecionado.patrimonio}` : 'Sem patrimônio'}
                                        />
                                        <SummaryCard
                                            label="Item de Entrada (receber)"
                                            value={form.materialEntradaSelecionado?.nome || ''}
                                            sub={`${form.materialEntradaSelecionado?.codigo} · ${form.materialEntradaSelecionado?.categoria}`}
                                        />
                                    </div>

                                    {/* Motivo */}
                                    <div className="border border-slate-200 rounded-md p-3">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Motivo</span>
                                        <p className="text-sm text-slate-900">{form.motivo}</p>
                                    </div>

                                    {/* Prazo */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider">Prazo de Resolução (D+1)</span>
                                        <span className="text-sm font-medium text-slate-900">
                                            {new Date(calcularPrazoD1(new Date().toISOString().split('T')[0])).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        id="btn-voltar-step5"
                                        onClick={handleVoltar}
                                        type="button"
                                        className="border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                                    >
                                        <IconArrowLeft />
                                        Voltar
                                    </button>
                                    <button
                                        id="btn-cancelar"
                                        onClick={handleResetar}
                                        type="button"
                                        className="border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-md hover:bg-red-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        id="btn-confirmar-troca"
                                        onClick={handleConfirmar}
                                        type="button"
                                        disabled={loading}
                                        className="bg-black text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {loading ? 'Registrando...' : (
                                            <>
                                                <IconCheck />
                                                Registrar Solicitação
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ====== TAB: Histórico / Acompanhamento ====== */}
                {tabAtiva === 'historico' && (
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 mb-4">Solicitações Registradas</h2>

                        {minhasSolicitacoes.length === 0 ? (
                            <div className="border border-slate-200 rounded-lg p-10 text-center">
                                <p className="text-sm text-slate-500">Nenhuma solicitação registrada ainda.</p>
                                <button
                                    onClick={() => setTabAtiva('nova')}
                                    className="mt-3 text-sm text-black font-medium underline underline-offset-2 hover:no-underline"
                                >
                                    Criar nova solicitação
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                {/* Desktop View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                                                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Técnico</th>
                                                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saída</th>
                                                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entrada</th>
                                                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                                                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prazo</th>
                                                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historicoSupabase.map((sol) => (
                                                <tr key={sol.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-4 font-mono text-xs font-bold text-slate-900">{sol.id.split('-')[0]}</td>
                                                    <td className="px-4 py-4">
                                                        <p className="text-slate-900 font-bold">{sol.tecnicoNome}</p>
                                                        <p className="text-[11px] text-slate-500 font-medium">{sol.tecnicoMatricula}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-700 font-medium">{sol.itemSaidaNome}</td>
                                                    <td className="px-4 py-4 text-slate-700 font-medium">{sol.materialEntradaNome}</td>
                                                    <td className="px-4 py-4 text-slate-500 font-medium">{new Date(sol.dataSolicitacao).toLocaleDateString('pt-BR')}</td>
                                                    <td className="px-4 py-4 text-slate-500 font-medium">{new Date(sol.prazoResolucao).toLocaleDateString('pt-BR')}</td>
                                                    <td className="px-4 py-4">
                                                        <StatusBadge status={sol.status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile/Tablet View */}
                                <div className="lg:hidden divide-y divide-slate-100">
                                    {historicoSupabase.map((sol) => (
                                        <div key={sol.id} className="p-4 space-y-3 bg-white">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{sol.id.split('-')[0]}</span>
                                                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{sol.tecnicoNome}</h3>
                                                </div>
                                                <StatusBadge status={sol.status} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                                                <div>
                                                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Devolve (Saída)</p>
                                                    <p className="text-xs font-medium text-slate-800 leading-tight">{sol.itemSaidaNome}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Recebe (Entrada)</p>
                                                    <p className="text-xs font-medium text-slate-800 leading-tight">{sol.materialEntradaNome}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                                                <span>Data: {new Date(sol.dataSolicitacao).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                    ))}
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

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div className="border border-slate-200 rounded-md p-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">{label}</span>
            <p className="text-sm font-medium text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pendente: 'bg-amber-50 text-amber-700 border-amber-200',
        aprovada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejeitada: 'bg-red-50 text-red-700 border-red-200',
        concluida: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return (
        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border capitalize ${styles[status] || styles.pendente}`}>
            {status}
        </span>
    );
}
