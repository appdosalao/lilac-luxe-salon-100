import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { Toaster } from "sonner";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PWAProvider } from "./components/pwa/PWAProvider";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agendamentos from "./pages/Agendamentos";
import Clientes from "./pages/Clientes";
import Servicos from "./pages/Servicos";
import Cronogramas from "./pages/Cronogramas";
import Financeiro from "./pages/Financeiro";
import Agenda from "./pages/Agenda";
import MinhaAgenda from "./pages/MinhaAgenda";
import Configuracoes from './pages/Configuracoes';
import AgendamentoOnline from "./pages/AgendamentoOnline";
import Auditoria from "./pages/Auditoria";
import Marketing from "./pages/Marketing";
import Produtos from "./pages/Produtos";
import Assinatura from "./pages/Assinatura";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Privacidade from "./pages/Privacidade";
import Termos from "./pages/Termos";
import Sobre from "./pages/Sobre";
import Planos from "./pages/Planos";
import Checkout from "./pages/Checkout";
import IntegracaoCakto from "./pages/IntegracaoCakto";
import { NotificationProviderAvancado } from "./components/notificacoes/NotificationProviderAvancado";
import { BackupPrompt } from "./components/configuracoes/BackupPrompt";
import TesteFidelidade from "./pages/TesteFidelidade";
import TesteSomPage from "./pages/TesteSomPage";
import TesteAgendamentosPage from "./pages/TesteAgendamentosPage";

const queryClient = new QueryClient();

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
                    <Route path="/login" element={<Login />} />
                    <Route path="/cadastro" element={<Cadastro />} />
                    <Route path="/onboarding" element={
                      <ProtectedRoute>
                        <Onboarding />
                      </ProtectedRoute>
                    } />
                    <Route path="/agendamento-online" element={<AgendamentoOnline />} />
                    <Route path="/agendamento-publico" element={<AgendamentoOnline />} />
                    <Route path="/agendar" element={<AgendamentoOnline />} />
                    <Route path="/privacidade" element={<Privacidade />} />
                    <Route path="/termos" element={<Termos />} />
                    <Route path="/planos" element={<Planos />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/teste-som" element={<TesteSomPage />} />
                    <Route path="/teste-agendamentos" element={<TesteAgendamentosPage />} />
                    <Route path="/sobre" element={<Sobre />} />
                    
                    {/* Rotas protegidas com Layout */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout>
                          <Dashboard />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/minha-agenda" element={
                      <ProtectedRoute>
                        <Layout>
                          <MinhaAgenda />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/agendamentos" element={<Navigate to="/minha-agenda?tab=lista" replace />} />
                    <Route path="/clientes" element={
                      <ProtectedRoute>
                        <Layout>
                          <Clientes />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/servicos" element={
                      <ProtectedRoute>
                        <Layout>
                          <Servicos />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/cronogramas" element={
                      <ProtectedRoute>
                        <Layout>
                          <Cronogramas />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/financeiro" element={
                      <ProtectedRoute>
                        <Layout>
                          <Financeiro />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/agenda" element={<Navigate to="/minha-agenda?tab=semana" replace />} />
                    <Route path="/configuracoes" element={
                      <ProtectedRoute>
                        <Layout>
                          <Configuracoes />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/auditoria" element={
                      <ProtectedRoute>
                        <Layout>
                          <Auditoria />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/marketing" element={
                      <ProtectedRoute>
                        <Layout>
                          <Marketing />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/produtos" element={
                      <ProtectedRoute>
                        <Layout>
                          <Produtos />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/assinatura" element={
                      <ProtectedRoute>
                        <Layout>
                          <Assinatura />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/integracao-cakto" element={
                      <ProtectedRoute>
                        <Layout>
                          <IntegracaoCakto />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/teste-fidelidade" element={
                      <ProtectedRoute>
                        <Layout>
                          <TesteFidelidade />
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
