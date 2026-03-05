// ============================================================
// APP — Root Component com Roteamento por Perfil
// ============================================================

import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SolicitacoesProvider } from './context/SolicitacoesContext';

// Importação assíncrona para que os pedaços de JS (chunks) só sejam baixados na hora de usar
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SupervisorPage = lazy(() => import('./pages/SupervisorPage'));
const EstoquePage = lazy(() => import('./pages/EstoquePage'));

// Loader bonitão pro usuário enquanto a página tá sendo lixada via Lazy Loading
const PageLoader = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-400 font-medium animate-pulse">Carregando painel...</p>
    </div>
);

function AppContent() {
    const { isAuthenticated, perfil } = useAuth();

    let Component;

    // Não autenticado → Login
    if (!isAuthenticated) {
        Component = LoginPage;
    } else {
        switch (perfil) {
            case 'supervisor':
                Component = SupervisorPage;
                break;
            case 'estoque':
                Component = EstoquePage;
                break;
            default:
                Component = LoginPage;
        }
    }

    return (
        <Suspense fallback={<PageLoader />}>
            <Component />
        </Suspense>
    );
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
