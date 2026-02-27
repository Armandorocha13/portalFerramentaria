// ============================================================
// APP — Root Component com Roteamento por Perfil
// ============================================================

import { AuthProvider, useAuth } from './context/AuthContext';
import { SolicitacoesProvider } from './context/SolicitacoesContext';
import LoginPage from './pages/LoginPage';
import SupervisorPage from './pages/SupervisorPage';
import EstoquePage from './pages/EstoquePage';

function AppContent() {
    const { isAuthenticated, perfil } = useAuth();

    // Não autenticado → Login
    if (!isAuthenticated) return <LoginPage />;

    // Roteamento automático baseado no perfil
    switch (perfil) {
        case 'supervisor':
            return <SupervisorPage />;
        case 'estoque':
            return <EstoquePage />;
        default:
            return <LoginPage />;
    }
}

export default function App() {
    return (
        <AuthProvider>
            <SolicitacoesProvider>
                <AppContent />
            </SolicitacoesProvider>
        </AuthProvider>
    );
}
