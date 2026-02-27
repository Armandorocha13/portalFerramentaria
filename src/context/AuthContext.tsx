// ============================================================
// CONTEXT — Autenticação Unificada (Role-Based Access)
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Usuario, UserPerfil } from '../types';
import { autenticarUsuario } from '../mocks/database';

interface AuthContextData {
    usuario: Usuario | null;
    perfil: UserPerfil | null;
    isAuthenticated: boolean;
    login: (matricula: string, senha: string) => { success: boolean; error?: string };
    logout: () => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    const login = useCallback((matricula: string, senha: string) => {
        if (!matricula.trim() || !senha.trim()) {
            return { success: false, error: 'Preencha matrícula e senha.' };
        }

        const user = autenticarUsuario(matricula, senha);
        if (!user) {
            return { success: false, error: 'Matrícula ou senha inválidos.' };
        }

        setUsuario(user);
        return { success: true };
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
