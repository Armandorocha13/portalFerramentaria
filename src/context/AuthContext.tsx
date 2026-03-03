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

        try {
            const { data, error } = await supabase
                .from('supervisores')
                .select('*')
                .eq('matricula', matricula.trim().toUpperCase())
                .eq('senha', senha) // No mundo real, usaríamos hash e Auth do Supabase
                .single();

            if (error || !data) {
                return { success: false, error: 'Matrícula ou senha inválidos, ou você não é supervisor.' };
            }

            const user: Usuario = {
                id: data.id, // Store Supabase UUID
                matricula: data.matricula,
                nome: data.nome,
                senha: '', // Não expor senha no estado
                setor: data.setor || 'Geral',
                perfil: 'supervisor',
            };

            setUsuario(user);
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Erro de conexão com o banco de dados.' };
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
