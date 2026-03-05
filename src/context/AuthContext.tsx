// ============================================================
// CONTEXT — Autenticação Unificada (Role-Based Access)
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Usuario, UserPerfil } from '../types';
import { supabase } from '../lib/supabase';

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

    const login = useCallback(async (matricula: string, senha: string) => {
        if (!matricula.trim() || !senha.trim()) {
            return { success: false, error: 'Preencha matrícula e senha.' };
        }

        const mat = matricula.trim().toUpperCase();

        try {
            // 1️⃣ Verifica usuarios_estoque PRIMEIRO
            // Todos que estão nessa tabela vão para o painel do estoque,
            // independente do cargo (SUPERVISOR JR, ALMOXARIFE, etc.)
            const { data: estoque, error: errEst } = await supabase
                .from('usuarios_estoque')
                .select('*')
                .eq('matricula', mat)
                .eq('senha', senha)
                .eq('ativo', true)
                .single();

            console.log('[Login] usuarios_estoque →', { estoque, errEst });

            if (estoque) {
                setUsuario({
                    id: estoque.id,
                    matricula: estoque.matricula,
                    nome: estoque.nome,
                    senha: '',
                    setor: estoque.cargo,
                    perfil: 'estoque',
                });
                return { success: true };
            }

            // 2️⃣ Só então verifica supervisores
            const { data: supervisor, error: errSup } = await supabase
                .from('supervisores')
                .select('*')
                .eq('matricula', mat)
                .eq('senha', senha)
                .single();

            console.log('[Login] supervisores →', { supervisor, errSup });

            if (supervisor) {
                setUsuario({
                    id: supervisor.id,
                    matricula: supervisor.matricula,
                    nome: supervisor.nome,
                    senha: '',
                    setor: supervisor.setor || 'Geral',
                    perfil: 'supervisor',
                });
                return { success: true };
            }

            return { success: false, error: 'Matrícula ou senha inválidos.' };
        } catch (err: any) {
            console.error('[Login] erro inesperado →', err);
            return { success: false, error: `Erro: ${err?.message || 'Conexão falhou.'}` };
        }
    }, []);

    const logout = useCallback(() => {
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
