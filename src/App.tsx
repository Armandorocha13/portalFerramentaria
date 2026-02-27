// ============================================================
// APP — Root Component
// ============================================================

import { AuthProvider, useAuth } from './context/AuthContext';
import { SolicitacoesProvider } from './context/SolicitacoesContext';
import LoginPage from './pages/LoginPage';
import SupervisorPage from './pages/SupervisorPage';

function AppContent() {
    const { isAuthenticated } = useAuth();

    return isAuthenticated ? <SupervisorPage /> : <LoginPage />;
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
