// ============================================================
// PÁGINA DE LOGIN — Autenticação com Background + Liquid Glass
// ============================================================

import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [matricula, setMatricula] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErro('');
        setLoading(true);

        try {
            const result = await login(matricula.trim(), senha);
            if (!result.success) {
                setErro(result.error || 'Erro desconhecido.');
            }
        } catch (err) {
            setErro('Erro ao tentar autenticar.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{
                backgroundImage: 'url(/bg-supervisor.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {/* Overlay escuro para contraste */}
            <div className="absolute inset-0 bg-woodsmoke-950/40" />

            {/* Card Liquid Glass */}
            <div
                className="relative z-10 w-full max-w-sm rounded-2xl p-8 border border-white/20 shadow-2xl"
                style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    boxShadow:
                        '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.1)',
                }}
            >
                {/* Logo / Cabeçalho */}
                <div className="mb-8 text-center">
                    <img
                        src="/logo.png"
                        alt="FFA Infraestrutura"
                        className="h-20 mx-auto mb-3 drop-shadow-lg"
                    />
                    <p className="text-xs text-white/60 uppercase tracking-widest font-medium">
                        Portal da Ferramentaria
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="login-matricula"
                            className="block text-xs font-medium text-white/80 mb-1.5 uppercase tracking-wider"
                        >
                            Matrícula
                        </label>
                        <input
                            id="login-matricula"
                            type="text"
                            value={matricula}
                            onChange={(e) => setMatricula(e.target.value)}
                            placeholder="Ex: SUP001"
                            className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(8px)',
                            }}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="login-senha"
                            className="block text-xs font-medium text-white/80 mb-1.5 uppercase tracking-wider"
                        >
                            Senha
                        </label>
                        <input
                            id="login-senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="••••••"
                            className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(8px)',
                            }}
                        />
                    </div>

                    {/* Erro */}
                    {erro && (
                        <div
                            className="flex items-center gap-2 text-sm text-red-200 rounded-lg px-3 py-2"
                            style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                        >
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
                        className="w-full text-sm font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            background: 'rgba(220, 38, 38, 0.45)',
                            border: '1px solid rgba(255, 100, 100, 0.35)',
                            color: '#fff',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.45)';
                        }}
                    >
                        {loading ? 'Autenticando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
