// ============================================================
// PÁGINA DE LOGIN — Autenticação do Supervisor
// ============================================================

import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [matricula, setMatricula] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErro('');
        setLoading(true);

        // Simula delay de rede
        setTimeout(() => {
            const result = login(matricula.trim(), senha);
            if (!result.success) {
                setErro(result.error || 'Erro desconhecido.');
            }
            setLoading(false);
        }, 600);
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo / Cabeçalho */}
                <div className="mb-10 text-center">
                    <img
                        src="/logo.png"
                        alt="FFA Infraestrutura"
                        className="h-20 mx-auto mb-4"
                    />

                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="login-matricula" className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
                            Matrícula
                        </label>
                        <input
                            id="login-matricula"
                            type="text"
                            value={matricula}
                            onChange={(e) => setMatricula(e.target.value)}
                            placeholder="Ex: SUP001"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label htmlFor="login-senha" className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
                            Senha
                        </label>
                        <input
                            id="login-senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="••••••"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                        />
                    </div>

                    {/* Erro */}
                    {erro && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {erro}
                        </div>
                    )}

                    <button
                        id="login-submit"
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white text-sm font-medium py-2.5 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Autenticando...' : 'Entrar'}
                    </button>
                </form>


            </div>
        </div>
    );
}
