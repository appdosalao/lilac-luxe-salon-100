import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from 'react';
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { Toaster } from "sonner";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PWAProvider } from "./components/pwa/PWAProvider";
import Layout from "./components/Layout";
import { NotificationProviderAvancado } from "./components/notificacoes/NotificationProviderAvancado";
import { BackupPrompt } from "./components/configuracoes/BackupPrompt";
import { ScissorsLoader } from '@/components/ScissorsLoader';

const queryClient = new QueryClient();

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
    <ScissorsLoader />
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SupabaseAuthProvider>
          <NotificationProviderAvancado>
            <PWAProvider>
              <div id="app-container">
                <BackupPrompt />
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
                    <Route path="/agenda" element={<Navigate to="/minha-agenda?tab=semana" replace />} />
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
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={
                      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold mb-4">404</h1>
                          <p className="text-xl text-muted-foreground mb-4">Página não encontrada</p>
                          <a href="/" className="text-primary hover:underline">
                            Voltar ao início
                          </a>
                        </div>
                      </div>
                    } />
                  </Routes>
              </div>
            </PWAProvider>
          </NotificationProviderAvancado>
        </SupabaseAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
