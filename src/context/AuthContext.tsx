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
            const { data: estoque } = await supabase
                .from('usuarios_estoque')
                .select('id, matricula, nome, cargo, ativo')
                .eq('matricula', mat)
                .eq('senha', senha)
                .eq('ativo', true)
                .single();

            if (estoque) {
                tentativas.current = 0;
                bloqueadoAte.current = null;
                setUsuario({
                    id: estoque.id,
                    matricula: estoque.matricula,
                    nome: estoque.nome,
                    senha: '',
                    setor: estoque.cargo,
                    perfil: 'estoque',
                });
                agendarExpiracaoSessao();
                return { success: true };
            }

            // 2️⃣ Verifica supervisores
            const { data: supervisor } = await supabase
                .from('supervisores')
                .select('id, matricula, nome, setor')
                .eq('matricula', mat)
                .eq('senha', senha)
                .single();

            if (supervisor) {
                tentativas.current = 0;
                bloqueadoAte.current = null;
                setUsuario({
                    id: supervisor.id,
                    matricula: supervisor.matricula,
                    nome: supervisor.nome,
                    senha: '',
                    setor: supervisor.setor || 'Geral',
                    perfil: 'supervisor',
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
