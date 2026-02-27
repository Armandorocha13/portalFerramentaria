// ============================================================
// CONTEXT — Autenticação do Supervisor
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Supervisor } from '../types';
import { autenticarSupervisor } from '../mocks/database';

interface AuthContextData {
    supervisor: Supervisor | null;
    isAuthenticated: boolean;
    login: (matricula: string, senha: string) => { success: boolean; error?: string };
    logout: () => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [supervisor, setSupervisor] = useState<Supervisor | null>(null);

    const login = useCallback((matricula: string, senha: string) => {
        if (!matricula.trim() || !senha.trim()) {
            return { success: false, error: 'Preencha matrícula e senha.' };
        }

        const sup = autenticarSupervisor(matricula, senha);
        if (!sup) {
            return { success: false, error: 'Matrícula ou senha inválidos.' };
        }

        setSupervisor(sup);
        return { success: true };
    }, []);

    const logout = useCallback(() => {
        setSupervisor(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                supervisor,
                isAuthenticated: !!supervisor,
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
