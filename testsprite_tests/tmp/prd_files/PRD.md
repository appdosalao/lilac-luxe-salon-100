# 📄 Product Requirements Document (PRD) - Salão de Bolso

## 1. 🎯 Visão Geral do Produto
O **Salão de Bolso** é uma plataforma SaaS (Software as a Service) multi-tenant projetada para simplificar a gestão de salões de beleza e profissionais autônomos. A aplicação funciona como um PWA (Progressive Web App), permitindo que proprietários de salões gerenciem agendamentos, finanças, clientes e programas de fidelidade de qualquer dispositivo, enquanto oferece uma interface pública para que clientes realizem agendamentos online sem necessidade de login.

---

## 2. 👥 Público-Alvo
- **Proprietários de Salões de Beleza e Clínicas de Estética**: Que buscam uma ferramenta completa de gestão.
- **Profissionais Autônomos (Cabeleireiros, Manicures, etc.)**: Que precisam de uma agenda organizada e controle financeiro.
- **Clientes Finais**: Que desejam agendar serviços de forma rápida e prática pela internet.

---

## 3. 🛠️ Stack Tecnológica
- **Frontend**: React 18.3.1, TypeScript, Vite, Tailwind CSS.
- **UI Components**: Shadcn/UI, Lucide React (ícones), Sonner (notificações).
- **Gerenciamento de Estado**: TanStack Query (React Query), React Hook Form + Zod.
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions).
- **PWA**: vite-plugin-pwa com Service Workers customizados.
- **Pagamentos**: Integração com Cakto para assinaturas e checkout.
- **Deploy**: Vercel.

---

## 4. ✨ Funcionalidades Principais

### **4.1. Gestão de Agenda**
- **Visualizações**: Diária (timeline), Semanal (grid) e Mensal (calendário).
- **Bloqueios**: Definição de horários de funcionamento e intervalos personalizados.
- **Ações**: Criação, edição, reagendamento, cancelamento e conclusão de atendimentos.

### **4.2. Agendamento Online (Público)**
- URL exclusiva para cada salão.
- Seleção de serviço e verificação de disponibilidade em tempo real.
- Captura de dados do cliente e criação automática de registros.
- Notificações automáticas para o administrador sobre novos agendamentos online.

### **4.3. CRM & Clientes**
- Cadastro completo de clientes com histórico de serviços e observações.
- Programa de Fidelidade: Acúmulo de pontos por serviço e resgate de recompensas.
- Sistema de Indicação: Pontuação para clientes que indicam novos usuários.

### **4.4. Gestão Financeira**
- Controle de Entradas (serviços, vendas) e Saídas (contas fixas, compras).
- Relatórios de faturamento, lucro e valores em aberto.
- Dashboard com indicadores chave de performance (KPIs).

### **4.5. Marketing & Retenção**
- Cronogramas de Retorno: Lembretes automáticos para serviços recorrentes (ex: manutenção de unhas).
- Notificações Push e Sonoras: Alertas em tempo real sobre eventos do sistema.

### **4.6. Auditoria & Segurança**
- Logs de atividades para todas as ações críticas.
- Sistema de auditoria automática para detectar inconsistências financeiras ou de agenda.
- Isolamento total de dados entre salões (Multi-tenancy via RLS do Supabase).

---

## 5. 💰 Modelo de Negócio (Monetização)
- **Planos de Assinatura**: Mensal e Vitalício.
- **Trial**: Período de teste gratuito para novos usuários.
- **Bloqueio de Acesso**: Restrição de funcionalidades para assinaturas expiradas ou inadimplentes.
- **Checkout**: Integrado via Cakto para processamento de pagamentos.

---

## 6. 🚀 Arquitetura e Segurança
- **Multi-tenancy**: Cada registro no banco de dados é vinculado a um `user_id`, protegido por políticas de RLS (Row Level Security).
- **Dual Client Supabase**: 
  - `authenticated`: Para operações administrativas seguras.
  - `anonymous`: Para leitura de serviços e horários na página de agendamento público.
- **PWA & Offline**: Cache de recursos críticos para funcionamento básico sem conexão e instalação na tela inicial.

---

## 7. 🗺️ Roadmap de Evolução
- [ ] Integração direta com WhatsApp para lembretes de agendamento.
- [ ] Módulo de estoque com alertas de reposição.
- [ ] Relatórios avançados com IA para previsão de faturamento.
- [ ] Suporte a múltiplos profissionais por salão (Staff Management).

---
*Gerado automaticamente em 12/04/2026*
