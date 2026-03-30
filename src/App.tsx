import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from 'react';
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { Toaster } from "sonner";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PWAProvider } from "./components/pwa/PWAProvider";
import Layout from "./components/Layout";
import { NotificationProviderAvancado } from "./components/notificacoes/NotificationProviderAvancado";
import { BackupPrompt } from "./components/configuracoes/BackupPrompt";
import { ScissorsLoader } from '@/components/ScissorsLoader';
import { PersistenceGuard } from "./components/PersistenceGuard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Desativar recarregamento de dados ao focar na janela
      retry: 1,
    },
  },
});

const Dashboard = lazy(() => import('./pages/Dashboard'));
const MinhaAgenda = lazy(() => import('./pages/MinhaAgenda'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Servicos = lazy(() => import('./pages/Servicos'));
const Cronogramas = lazy(() => import('./pages/Cronogramas'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const Auditoria = lazy(() => import('./pages/Auditoria'));
const Marketing = lazy(() => import('./pages/Marketing'));
const Produtos = lazy(() => import('./pages/Produtos'));
const Assinatura = lazy(() => import('./pages/Assinatura'));
const IntegracaoCakto = lazy(() => import('./pages/IntegracaoCakto'));
const TesteFidelidade = lazy(() => import('./pages/TesteFidelidade'));

const Onboarding = lazy(() => import('./pages/Onboarding'));
const Login = lazy(() => import('./pages/Login'));
const Cadastro = lazy(() => import('./pages/Cadastro'));
const AgendamentoOnline = lazy(() => import('./pages/AgendamentoOnline'));
const Privacidade = lazy(() => import('./pages/Privacidade'));
const Termos = lazy(() => import('./pages/Termos'));
const Sobre = lazy(() => import('./pages/Sobre'));
const Planos = lazy(() => import('./pages/Planos'));
const Checkout = lazy(() => import('./pages/Checkout'));
const RetornoPagamento = lazy(() => import('./pages/RetornoPagamento'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const TesteSomPage = lazy(() => import('./pages/TesteSomPage'));
const TesteAgendamentosPage = lazy(() => import('./pages/TesteAgendamentosPage'));

const RouteFallback = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      <span className="text-xs text-muted-foreground animate-pulse">Carregando seção...</span>
    </div>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const publicRoutes = ['/agendamento-online', '/agendamento-publico', '/agendar', '/login', '/cadastro', '/privacidade', '/termos', '/sobre', '/planos', '/checkout', '/pagamento/retorno', '/payment/success'];
  const isPublicRoute = publicRoutes.some(path => location.pathname.startsWith(path));

  return (
    <div id="app-container">
      {!isPublicRoute && <BackupPrompt />}
      <Toaster position="top-right" />
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Suspense fallback={RouteFallback}><Login /></Suspense>} />
        <Route path="/cadastro" element={<Suspense fallback={RouteFallback}><Cadastro /></Suspense>} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Suspense fallback={RouteFallback}><Onboarding /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="/agendamento-online" element={<Suspense fallback={RouteFallback}><AgendamentoOnline /></Suspense>} />
        <Route path="/agendamento-publico" element={<Suspense fallback={RouteFallback}><AgendamentoOnline /></Suspense>} />
        <Route path="/agendar" element={<Suspense fallback={RouteFallback}><AgendamentoOnline /></Suspense>} />
        <Route path="/privacidade" element={<Suspense fallback={RouteFallback}><Privacidade /></Suspense>} />
        <Route path="/termos" element={<Suspense fallback={RouteFallback}><Termos /></Suspense>} />
        <Route path="/planos" element={<Suspense fallback={RouteFallback}><Planos /></Suspense>} />
        <Route path="/checkout" element={<Suspense fallback={RouteFallback}><Checkout /></Suspense>} />
        <Route path="/pagamento/retorno" element={<Suspense fallback={RouteFallback}><RetornoPagamento /></Suspense>} />
        <Route path="/payment/success" element={<Suspense fallback={RouteFallback}><PaymentSuccess /></Suspense>} />
        <Route path="/teste-som" element={<Suspense fallback={RouteFallback}><TesteSomPage /></Suspense>} />
        <Route path="/teste-agendamentos" element={<Suspense fallback={RouteFallback}><TesteAgendamentosPage /></Suspense>} />
        <Route path="/sobre" element={<Suspense fallback={RouteFallback}><Sobre /></Suspense>} />
        
        {/* Rotas protegidas com Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><Dashboard /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/minha-agenda" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><MinhaAgenda /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/agendamentos" element={<Navigate to="/minha-agenda?tab=lista" replace />} />
        <Route path="/clientes" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><Clientes /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/servicos" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><Servicos /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/cronogramas" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><Cronogramas /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/financeiro" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><Financeiro /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/configuracoes" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><Configuracoes /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/auditoria" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><Auditoria /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/marketing" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><Marketing /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/produtos" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><Produtos /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/assinatura" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><Assinatura /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/integracao-cakto" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><IntegracaoCakto /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/teste-fidelidade" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={RouteFallback}><TesteFidelidade /></Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Redirecionamentos e Catch-all */}
        <Route path="/agenda" element={<Navigate to="/minha-agenda?tab=semana" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SupabaseAuthProvider>
          <PersistenceGuard>
            <NotificationProviderAvancado>
              <PWAProvider>
                <AppContent />
              </PWAProvider>
            </NotificationProviderAvancado>
          </PersistenceGuard>
        </SupabaseAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
