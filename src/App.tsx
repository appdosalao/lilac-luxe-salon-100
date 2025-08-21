import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agendamentos from "./pages/Agendamentos";
import Clientes from "./pages/Clientes";
import Servicos from "./pages/Servicos";
import Cronogramas from "./pages/Cronogramas";
import Financeiro from "./pages/Financeiro";
import Configuracoes from './pages/Configuracoes-Simple';
import AgendamentoOnline from "./pages/AgendamentoOnline";
import Auditoria from "./pages/Auditoria";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SupabaseAuthProvider>
          <div id="app-container">
                <Toaster />
                <Routes>
                  {/* Rotas públicas */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/cadastro" element={<Cadastro />} />
                  <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                  <Route path="/agendamento-online" element={<AgendamentoOnline />} />
                  <Route path="/agendamento-publico" element={<AgendamentoOnline />} />
                  <Route path="/agendar" element={<AgendamentoOnline />} />
                  
                  {/* Rotas protegidas com Layout */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/agendamentos" element={
                    <ProtectedRoute>
                      <Layout>
                        <Agendamentos />
                      </Layout>
                    </ProtectedRoute>
                  } />
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
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              {/* </PWAProvider> */}
              {/* Temporarily removed NotificationProviderAvancado */}
            </div>
        </SupabaseAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
