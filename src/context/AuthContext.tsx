// ============================================================
// CONTEXT — Autenticação Unificada (Role-Based Access)
// Sprint 7: Rate limiting, expiração de sessão, sem dados sensíveis
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { Usuario, UserPerfil } from '../types';
import { supabase } from '../lib/supabase';

// ---- Configurações de segurança ----
const MAX_TENTATIVAS = 5;           // Tentativas antes de bloquear
const BLOQUEIO_MS = 5 * 60 * 1000; // Bloqueio por 5 minutos
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // Sessão expira em 8 horas

interface AuthContextData {
    usuario: Usuario | null;
    perfil: UserPerfil | null;
    isAuthenticated: boolean;
    login: (matricula: string, senha: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    // ---- Rate limiting (em memória, por IP não é possível no front — protege brute force básico) ----
    const tentativas = useRef(0);
    const bloqueadoAte = useRef<number | null>(null);

    // ---- Expiração de sessão ----
    const sessionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    function agendarExpiracaoSessao() {
        if (sessionTimer.current) clearTimeout(sessionTimer.current);
        sessionTimer.current = setTimeout(() => {
            setUsuario(null);
        }, SESSION_TIMEOUT_MS);
    }

    function cancelarExpiracaoSessao() {
        if (sessionTimer.current) {
            clearTimeout(sessionTimer.current);
            sessionTimer.current = null;
        }
    }

    // Limpa o timer ao desmontar
    useEffect(() => {
        return () => cancelarExpiracaoSessao();
    }, []);

    // ---- Login ----
    const login = useCallback(async (matricula: string, senha: string) => {
        // Verificar bloqueio por tentativas excessivas
        if (bloqueadoAte.current && Date.now() < bloqueadoAte.current) {
            const restante = Math.ceil((bloqueadoAte.current - Date.now()) / 60000);
            return {
                success: false,
                error: `Muitas tentativas. Aguarde ${restante} minuto${restante > 1 ? 's' : ''} para tentar novamente.`,
            };
        }

        // Resetar bloqueio expirado
        if (bloqueadoAte.current && Date.now() >= bloqueadoAte.current) {
            bloqueadoAte.current = null;
            tentativas.current = 0;
        }

        if (!matricula.trim() || !senha.trim()) {
            return { success: false, error: 'Preencha matrícula e senha.' };
        }

        const mat = matricula.trim().toUpperCase();

        try {
            // 1️⃣ Verifica usuarios_estoque PRIMEIRO
            const { data: estoque } = await supabase.rpc('login_estoque', {
                p_matricula: mat,
                p_senha: senha
            });

            if (estoque && estoque.length > 0) {
                const user = estoque[0];
                tentativas.current = 0;
                bloqueadoAte.current = null;
                setUsuario({
                    id: user.id || '',
                    matricula: user.matricula || '',
                    nome: user.nome || '',
                    senha: '',
                    setor: user.cargo || '',
                    perfil: 'estoque' as const,
                });
                agendarExpiracaoSessao();
                return { success: true };
            }

            // 2️⃣ Verifica supervisores
            const { data: supervisor } = await supabase.rpc('login_supervisor', {
                p_matricula: mat,
                p_senha: senha
            });

            if (supervisor && supervisor.length > 0) {
                const user = supervisor[0];
                tentativas.current = 0;
                bloqueadoAte.current = null;
                setUsuario({
                    id: user.id || '',
                    matricula: user.matricula || '',
                    nome: user.nome || '',
                    senha: '',
                    setor: user.setor || 'Geral',
                    perfil: 'supervisor' as const,
                });
                agendarExpiracaoSessao();
                return { success: true };
            }

            // Incrementar tentativas falhas
            tentativas.current += 1;
            if (tentativas.current >= MAX_TENTATIVAS) {
                bloqueadoAte.current = Date.now() + BLOQUEIO_MS;
                tentativas.current = 0;
                return {
                    success: false,
                    error: 'Acesso bloqueado por 5 minutos após múltiplas tentativas incorretas.',
                };
            }

            const restantes = MAX_TENTATIVAS - tentativas.current;
            return {
                success: false,
                error: `Matrícula ou senha inválidos. ${restantes} tentativa${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}.`,
            };

        } catch (err: any) {
            return { success: false, error: err?.message || 'Erro de conexão. Tente novamente.' };
        }
    }, []);

    const logout = useCallback(() => {
        cancelarExpiracaoSessao();
        tentativas.current = 0;
        bloqueadoAte.current = null;
        setUsuario(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                usuario,
                perfil: usuario?.perfil ?? null,
                isAuthenticated: !!usuario,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextData {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
    }
    return context;
}
