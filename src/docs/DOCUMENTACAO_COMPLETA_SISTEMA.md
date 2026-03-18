# 📚 DOCUMENTAÇÃO COMPLETA DO SISTEMA - SALÃO DE BELEZA

## 🎯 VISÃO GERAL DO SISTEMA

Este é um **Sistema Completo de Gestão para Salões de Beleza** desenvolvido com tecnologias modernas como React, TypeScript, Tailwind CSS, Supabase e PWA (Progressive Web App). O sistema permite gerenciar todas as operações de um salão de forma integrada, incluindo agendamentos, clientes, serviços, finanças, cronogramas de retorno e programa de fidelidade.

---

## 🏗️ ARQUITETURA DO SISTEMA

### **Stack Tecnológica**

#### **Frontend**
- **React 18.3.1** - Biblioteca principal para UI
- **TypeScript** - Tipagem estática e segurança de código
- **Vite** - Build tool e dev server ultrarrápido
- **Tailwind CSS** - Framework CSS utility-first
- **Shadcn/ui** - Biblioteca de componentes reutilizáveis
- **React Router v6** - Roteamento SPA
- **React Hook Form + Zod** - Gerenciamento e validação de formulários
- **TanStack Query (React Query)** - Gerenciamento de estado assíncrono
- **date-fns** - Manipulação de datas
- **Recharts** - Gráficos e visualizações
- **Sonner** - Sistema de notificações toast

#### **Backend**
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL Database
  - Authentication
  - Row Level Security (RLS)
  - Real-time Subscriptions
  - Edge Functions (Deno)
  - Storage (futuramente)

#### **PWA (Progressive Web App)**
- **Service Workers** - Cache offline e notificações push
- **Web App Manifest** - Instalação como app nativo
- **vite-plugin-pwa** - Integração PWA com Vite

---

## 📂 ESTRUTURA DE PASTAS

```
salon-management-system/
├── public/                          # Arquivos estáticos
│   ├── icons/                       # Ícones PWA (48x48 até 512x512)
│   ├── sounds/                      # Sons de notificação
│   ├── manifest.json                # Manifesto PWA
│   ├── sw.js                        # Service Worker
│   └── robots.txt                   # SEO
│
├── src/
│   ├── components/                  # Componentes React organizados por feature
│   │   ├── agenda/                  # Componentes da agenda (diária, semanal, mensal)
│   │   ├── agendamento-online/      # Formulário público de agendamento
│   │   ├── agendamentos/            # CRUD de agendamentos
│   │   ├── auditoria/               # Sistema de auditoria
│   │   ├── auth/                    # Autenticação e rotas protegidas
│   │   ├── clientes/                # CRUD de clientes
│   │   ├── configuracoes/           # Configurações do sistema
│   │   ├── cronogramas/             # Cronogramas e retornos
│   │   ├── financeiro/              # Módulo financeiro completo
│   │   ├── marketing/               # Programa de fidelidade
│   │   ├── notificacoes/            # Sistema de notificações
│   │   ├── pwa/                     # Componentes PWA
│   │   ├── servicos/                # CRUD de serviços
│   │   └── ui/                      # Componentes UI base (Shadcn)
│   │
│   ├── contexts/                    # Contextos React
│   │   └── SupabaseAuthContext.tsx  # Contexto de autenticação
│   │
│   ├── hooks/                       # Custom Hooks
│   │   ├── useAgendamentos.ts       # Lógica de agendamentos
│   │   ├── useClientes.ts           # Lógica de clientes (via useSupabaseClientes)
│   │   ├── useServicos.ts           # Lógica de serviços
│   │   ├── useCronogramas.ts        # Lógica de cronogramas
│   │   ├── useLancamentos.ts        # Lógica financeira
│   │   ├── useContasFixas.ts        # Contas fixas
│   │   ├── useNotifications.ts      # Notificações do sistema
│   │   ├── usePushSubscription.ts   # Push notifications
│   │   ├── usePWA.ts                # Funcionalidades PWA
│   │   └── useSupabase*.ts          # Hooks de integração Supabase
│   │
│   ├── integrations/supabase/       # Integração Supabase
│   │   ├── client.ts                # Cliente Supabase configurado
│   │   └── types.ts                 # Tipos gerados automaticamente
│   │
│   ├── lib/                         # Utilitários e helpers
│   │   ├── database.ts              # Camada de abstração do banco (legado)
│   │   ├── localStorage.ts          # Helpers localStorage
│   │   ├── supabaseFormatters.ts    # Formatadores de dados
│   │   └── utils.ts                 # Funções utilitárias gerais
│   │
│   ├── pages/                       # Páginas da aplicação
│   │   ├── Index.tsx                # Landing page
│   │   ├── Login.tsx                # Tela de login
│   │   ├── Cadastro.tsx             # Cadastro de usuário
│   │   ├── Dashboard.tsx            # Dashboard principal
│   │   ├── Agenda.tsx               # Visualização de agenda
│   │   ├── Agendamentos.tsx         # Gerenciamento de agendamentos
│   │   ├── AgendamentoOnline.tsx    # Formulário público
│   │   ├── Clientes.tsx             # Gerenciamento de clientes
│   │   ├── Servicos.tsx             # Gerenciamento de serviços
│   │   ├── Cronogramas.tsx          # Cronogramas de retorno
│   │   ├── Financeiro.tsx           # Módulo financeiro
│   │   ├── Marketing.tsx            # Programa de fidelidade
│   │   ├── Configuracoes.tsx        # Configurações
│   │   └── Auditoria.tsx            # Auditoria do sistema
│   │
│   ├── types/                       # Definições TypeScript
│   │   ├── agendamento.ts           # Tipos de agendamentos
│   │   ├── cliente.ts               # Tipos de clientes
│   │   ├── servico.ts               # Tipos de serviços
│   │   ├── cronograma.ts            # Tipos de cronogramas
│   │   ├── lancamento.ts            # Tipos financeiros
│   │   ├── contaFixa.ts             # Tipos de contas fixas
│   │   ├── fidelidade.ts            # Tipos do programa de fidelidade
│   │   ├── usuario.ts               # Tipos de usuários
│   │   └── notificacao.ts           # Tipos de notificações
│   │
│   ├── docs/                        # Documentação
│   │
│   ├── App.tsx                      # Componente principal
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Estilos globais e design tokens
│   └── vite-env.d.ts                # Tipos do Vite
│
├── supabase/
│   ├── functions/                   # Edge Functions (Deno)
│   │   ├── enviar-notificacao-push/ # Função para push notifications
│   │   └── auditoria-sistema/       # Função de auditoria
│   │
│   ├── migrations/                  # Migrações do banco de dados
│   └── config.toml                  # Configuração Supabase
│
├── supabase_schema.sql              # Schema principal do banco
├── supabase_rls_policies.sql        # Políticas RLS
├── tailwind.config.ts               # Configuração Tailwind
├── vite.config.ts                   # Configuração Vite
└── package.json                     # Dependências
```

---

## 🗄️ BANCO DE DADOS - ESTRUTURA COMPLETA

### **Tabelas Principais**

#### **1. usuarios**
Armazena os perfis de usuários do sistema (donos de salões).

```sql
- id (UUID) - PK, referência para auth.users
- email (TEXT) - Email do usuário
- nome_completo (TEXT) - Nome completo
- nome_personalizado_app (TEXT) - Nome do salão/app
- telefone (TEXT) - Telefone de contato
- tema_preferencia ('feminino' | 'masculino') - Tema visual
- created_at, updated_at - Timestamps
```

**RLS**: Usuários só veem e editam seu próprio perfil.

---

#### **2. clientes**
Cadastro de clientes do salão.

```sql
- id (UUID) - PK
- user_id (UUID) - FK para usuarios (dono do cliente)
- nome (TEXT) - Nome do cliente
- telefone (TEXT) - Telefone (obrigatório)
- email (TEXT) - Email opcional
- endereco (TEXT) - Endereço opcional
- data_nascimento (DATE) - Data de nascimento
- observacoes (TEXT) - Observações gerais
- historico_servicos (JSONB) - Histórico de serviços (legado)
- created_at, updated_at
```

**RLS**: Usuários só veem seus próprios clientes.

---

#### **3. servicos**
Catálogo de serviços oferecidos.

```sql
- id (UUID) - PK
- user_id (UUID) - FK para usuarios
- nome (TEXT) - Nome do serviço (ex: Corte, Escova)
- descricao (TEXT) - Descrição opcional
- valor (NUMERIC) - Preço do serviço
- duracao (INTEGER) - Duração em minutos
- observacoes (TEXT) - Observações
- created_at, updated_at
```

**RLS**: 
- Usuários autenticados gerenciam seus serviços
- **Público pode visualizar** (para agendamento online)

---

#### **4. agendamentos**
Agendamentos de serviços.

```sql
- id (UUID) - PK
- user_id (UUID) - FK para usuarios
- cliente_id (UUID) - FK para clientes
- servico_id (UUID) - FK para servicos
- data (DATE) - Data do agendamento
- hora (TIME) - Horário
- duracao (INTEGER) - Duração em minutos
- valor (NUMERIC) - Valor cobrado
- valor_pago (NUMERIC) - Valor já pago
- valor_devido (NUMERIC) - Valor restante
- forma_pagamento ('dinheiro' | 'cartao' | 'pix' | 'fiado')
- status_pagamento ('pago' | 'parcial' | 'em_aberto')
- status ('agendado' | 'concluido' | 'cancelado')
- origem ('manual' | 'cronograma' | 'online') - Como foi criado
- confirmado (BOOLEAN) - Se foi confirmado
- prioridade (TEXT) - Prioridade do agendamento
- observacoes (TEXT)
- created_at, updated_at
```

**RLS**: Usuários só veem seus agendamentos.

**Triggers**: 
- Atualiza `updated_at` automaticamente
- **Registra pontos de fidelidade** quando status vira 'concluido'

---

#### **5. agendamentos_online**
Agendamentos feitos pelo formulário público (clientes).

```sql
- id (UUID) - PK
- nome_completo (TEXT) - Nome do cliente
- email (TEXT) - Email
- telefone (TEXT) - Telefone
- servico_id (UUID) - FK para servicos
- data (DATE) - Data desejada
- horario (TIME) - Horário desejado
- duracao (INTEGER) - Duração do serviço
- valor (NUMERIC) - Valor do serviço
- status ('pendente' | 'confirmado' | 'cancelado' | 'convertido')
- agendamento_id (UUID) - FK para agendamentos (após conversão)
- observacoes (TEXT)
- origem ('formulario_online') - Origem
- ip_address (INET) - IP do solicitante
- user_agent (TEXT) - Navegador
- created_at, updated_at
```

**RLS**:
- **Público pode criar** (permite agendamento sem login)
- **Público pode visualizar** agendamentos pendentes dos próximos 30 dias
- Usuários autenticados veem tudo
- Usuários podem deletar agendamentos online

**Funcionalidade Especial**: 
- Função `converter_agendamento_online()` converte para agendamento regular
- Cria cliente automaticamente se não existir

---

#### **6. configuracoes_horarios**
Define horários de funcionamento do salão por dia da semana.

```sql
- id (UUID) - PK
- user_id (UUID) - FK para usuarios
- dia_semana (INTEGER) - 0=Domingo, 6=Sábado
- horario_abertura (TIME) - Horário de abertura
- horario_fechamento (TIME) - Horário de fechamento
- intervalo_inicio (TIME) - Início do intervalo (almoço)
- intervalo_fim (TIME) - Fim do intervalo
- ativo (BOOLEAN) - Se o dia está ativo
- tempo_minimo_antecedencia (INTEGER) - Minutos mínimos de antecedência
- tempo_maximo_antecedencia (INTEGER) - Minutos máximos de antecedência
- created_at, updated_at
```

**UNIQUE**: `(user_id, dia_semana)` - Um registro por dia por usuário.

**RLS**: 
- Usuários gerenciam seus horários
- **Público pode visualizar** (para agendamento online)

---

#### **7. intervalos_trabalho**
Intervalos personalizados além do intervalo principal.

```sql
- id (UUID) - PK
- user_id (UUID)
- dia_semana (INTEGER)
- hora_inicio (TIME)
- hora_fim (TIME)
- descricao (TEXT) - Ex: "Pausa para café"
- ativo (BOOLEAN)
- created_at, updated_at
```

**Uso**: Permite múltiplos intervalos por dia (ex: almoço + pausa).

---

#### **8. cronogramas_novos**
Cronogramas de retorno para clientes recorrentes.

```sql
- id_cronograma (UUID) - PK
- user_id (UUID)
- cliente_id (UUID)
- servico_id (UUID)
- cliente_nome (TEXT) - Nome do cliente (desnormalizado)
- tipo_servico (TEXT) - Nome do serviço (desnormalizado)
- data_inicio (DATE) - Data inicial do cronograma
- hora_inicio (TIME) - Horário padrão
- duracao_minutos (INTEGER) - Duração
- recorrencia ('Semanal' | 'Quinzenal' | 'Mensal' | 'Personalizada')
- intervalo_dias (INTEGER) - Para recorrência personalizada
- status ('ativo' | 'cancelado' | 'concluido')
- observacoes (TEXT)
- created_at, updated_at
```

**Funcionalidade**: Gera automaticamente retornos futuros baseados na recorrência.

---

#### **9. retornos_novos**
Retornos pendentes gerados pelos cronogramas.

```sql
- id_retorno (UUID) - PK
- user_id (UUID)
- id_cliente (UUID)
- id_cronograma (UUID)
- data_retorno (DATE) - Data prevista para retorno
- status ('Pendente' | 'Realizado' | 'Cancelado')
- id_agendamento_retorno (UUID) - FK para agendamentos (quando convertido)
- created_at, updated_at
```

**Lógica**: 
- Quando convertido em agendamento, status muda para 'Realizado'
- Sistema gera próximo retorno automaticamente

---

#### **10. lancamentos**
Lançamentos financeiros (entradas e saídas).

```sql
- id (UUID) - PK
- user_id (UUID)
- tipo ('entrada' | 'saida')
- valor (NUMERIC)
- data (DATE)
- descricao (TEXT)
- categoria (TEXT) - Ex: "Serviço", "Aluguel"
- origem_tipo ('agendamento' | 'conta_fixa' | 'manual')
- origem_id (UUID) - ID do agendamento ou conta fixa
- cliente_id (UUID) - Para lançamentos de serviços
- created_at, updated_at
```

**Automação**: 
- Criado automaticamente quando agendamento é concluído
- Criado automaticamente por contas fixas vencidas

---

#### **11. contas_fixas**
Contas fixas mensais/recorrentes (despesas/receitas).

```sql
- id (UUID) - PK
- user_id (UUID)
- nome (TEXT) - Ex: "Aluguel", "Luz"
- valor (NUMERIC)
- data_vencimento (INTEGER) - Dia do mês (1-31)
- categoria (TEXT)
- status ('pago' | 'em_aberto')
- frequencia ('mensal' | 'trimestral' | 'semestral' | 'anual')
- repetir (BOOLEAN) - Se deve repetir
- proximo_vencimento (DATE) - Próxima data de vencimento
- ativa (BOOLEAN) - Se está ativa
- observacoes (TEXT)
- created_at, updated_at
```

**Lógica**: Sistema automaticamente gera lançamentos quando vencimento chega.

---

#### **12. categorias_financeiras**
Categorias personalizadas para organização financeira.

```sql
- id (UUID) - PK
- user_id (UUID)
- nome (TEXT)
- tipo ('receita' | 'despesa' | 'investimento')
- cor (TEXT) - Cor HEX para UI
- created_at, updated_at
```

---

### **SISTEMA DE FIDELIDADE**

#### **13. programas_fidelidade**
Configuração do programa de fidelidade.

```sql
- id (UUID) - PK
- user_id (UUID)
- nome (TEXT) - Nome do programa
- pontos_por_real (NUMERIC) - Ex: 0.1 = 10 pontos por R$1
- expiracao_pontos_dias (INTEGER) - Dias até pontos expirarem
- ativo (BOOLEAN)
- data_inicio (DATE)
- created_at, updated_at
```

**Trigger**: Quando ativado, cadastra todos os clientes existentes no programa.

---

#### **14. classes_fidelidade**
Classes/níveis de fidelidade (Bronze, Prata, Ouro, Platina).

```sql
- id (UUID) - PK
- user_id (UUID)
- nome (TEXT) - Ex: "Platina"
- pontos_minimos (INTEGER) - Pontos mínimos para essa classe
- ordem (INTEGER) - Ordem de exibição
- cor (TEXT) - Cor da classe
- beneficios (TEXT) - Descrição dos benefícios
- ativo (BOOLEAN)
- created_at, updated_at
```

---

#### **15. niveis_fidelidade**
Nível atual de cada cliente no programa.

```sql
- id (UUID) - PK
- user_id (UUID)
- cliente_id (UUID)
- nivel (TEXT) - Nome do nível atual
- pontos_totais (INTEGER) - Total acumulado (histórico)
- pontos_disponiveis (INTEGER) - Pontos disponíveis para resgate
- total_resgates (INTEGER) - Quantidade de resgates feitos
- data_atualizacao (TIMESTAMP)
```

**Atualização**: Trigger atualiza automaticamente quando pontos mudam.

---

#### **16. pontos_fidelidade**
Histórico de ganho/gasto de pontos.

```sql
- id (UUID) - PK
- user_id (UUID)
- cliente_id (UUID)
- pontos (INTEGER) - Quantidade (positivo = ganho, negativo = gasto)
- origem ('agendamento' | 'resgate' | 'manual' | 'bonus')
- origem_id (UUID) - ID do agendamento/resgate
- descricao (TEXT)
- data_ganho (TIMESTAMP)
- data_expiracao (DATE) - Quando expira
- expirado (BOOLEAN)
- created_at
```

**Lógica**:
- Pontos ganhos automaticamente quando agendamento é concluído
- Função `aplicar_expiracao_pontos()` marca pontos expirados

---

#### **17. recompensas**
Recompensas disponíveis para resgate.

```sql
- id (UUID) - PK
- user_id (UUID)
- nome (TEXT) - Ex: "10% de desconto"
- descricao (TEXT)
- tipo ('desconto' | 'servico_gratis' | 'produto')
- pontos_necessarios (INTEGER)
- valor_desconto (NUMERIC) - Para tipo desconto
- servico_id (UUID) - Para serviço grátis
- classe_id (UUID) - Exclusivo para classe específica
- validade_dias (INTEGER) - Validade após resgate
- ativo (BOOLEAN)
- created_at, updated_at
```

---

#### **18. historico_resgates**
Resgates de recompensas realizados.

```sql
- id (UUID) - PK
- user_id (UUID)
- cliente_id (UUID)
- recompensa_id (UUID)
- pontos_gastos (INTEGER)
- data_resgate (TIMESTAMP)
- data_expiracao (DATE) - Validade do cupom
- utilizado (BOOLEAN)
- data_utilizacao (TIMESTAMP)
- agendamento_id (UUID) - Onde foi usado
```

---

#### **19. referencias_clientes**
Sistema de indicação de clientes.

```sql
- id (UUID) - PK
- user_id (UUID)
- codigo_referencia (TEXT) - Código único de indicação
- cliente_referenciador_id (UUID) - Quem indicou
- cliente_referenciado_id (UUID) - Quem foi indicado
- status ('pendente' | 'confirmado' | 'cancelado')
- pontos_ganhos (INTEGER)
- agendamento_id (UUID) - Primeiro agendamento do indicado
- created_at
```

---

### **SISTEMA DE NOTIFICAÇÕES**

#### **20. configuracoes_notificacoes**
Preferências de notificações do usuário.

```sql
- id (UUID) - PK
- user_id (UUID)
- notificacoes_push (BOOLEAN)
- notificacoes_email (BOOLEAN)
- notificacoes_som (BOOLEAN)
- som_personalizado (TEXT) - Arquivo de som
- lembrete_agendamento_minutos (INTEGER)
- lembrete_vencimento_dias (INTEGER)
- lembrete_contas_fixas_dias (INTEGER)
- notificar_cancelamentos (BOOLEAN)
- notificar_reagendamentos (BOOLEAN)
- notificar_pagamentos (BOOLEAN)
- notificar_novos_agendamentos (BOOLEAN)
- horario_inicio_notificacoes (TIME)
- horario_fim_notificacoes (TIME)
- created_at, updated_at
```

---

#### **21. notificacoes_preferencias**
Preferências detalhadas por tipo de notificação.

```sql
- id (UUID) - PK
- user_id (UUID)
- novo_agendamento (BOOLEAN)
- cancelamento_agendamento (BOOLEAN)
- lembrete_agendamento (BOOLEAN)
- confirmacao_cliente (BOOLEAN)
- lembrete_cliente (BOOLEAN)
- retorno_cronograma (BOOLEAN)
- alerta_financeiro (BOOLEAN)
- ofertas_fidelidade (BOOLEAN)
- som_notificacao (TEXT) - 'notification' | 'notification2' | 'notification3'
- vibracao (BOOLEAN)
- created_at, updated_at
```

**Trigger**: Criado automaticamente quando usuário se cadastra.

---

#### **22. push_subscriptions**
Inscrições para push notifications (Web Push API).

```sql
- id (UUID) - PK
- user_id (UUID)
- endpoint (TEXT) - URL do serviço push
- auth (TEXT) - Chave de autenticação
- p256dh (TEXT) - Chave pública
- ativo (BOOLEAN)
- created_at, updated_at
```

**Uso**: Armazena credenciais do navegador para enviar push notifications.

---

### **AUDITORIA E LOGS**

#### **23. logs_sistema**
Logs de ações do sistema.

```sql
- id (UUID) - PK
- user_id (UUID)
- categoria (TEXT) - Ex: 'agendamento', 'financeiro'
- acao (TEXT) - Ex: 'criar', 'editar', 'deletar'
- entidade_tipo (TEXT) - Ex: 'cliente', 'servico'
- entidade_id (TEXT) - ID da entidade
- nivel (TEXT) - 'info' | 'warn' | 'error'
- descricao (TEXT)
- metadados (JSONB) - Dados adicionais
- ip_address (INET)
- user_agent (TEXT)
- created_at
```

**RLS**: Usuários só veem seus próprios logs.

---

#### **24. relatorios_auditoria**
Relatórios de auditoria executados.

```sql
- id (UUID) - PK
- user_id (UUID)
- data_execucao (TIMESTAMP)
- total_problemas (INTEGER)
- problemas_criticos (INTEGER)
- problemas_altos (INTEGER)
- problemas_medios (INTEGER)
- problemas_baixos (INTEGER)
- estatisticas (JSONB)
- sugestoes_melhorias (TEXT[])
- created_at, updated_at
```

---

#### **25. problemas_auditoria**
Problemas detectados pela auditoria.

```sql
- id (UUID) - PK
- user_id (UUID)
- relatorio_id (UUID)
- categoria (TEXT) - Ex: 'financeiro', 'agendamento'
- tipo (TEXT) - Ex: 'valor_negativo', 'data_invalida'
- entidade (TEXT) - Ex: 'agendamento'
- entidade_id (TEXT)
- campo (TEXT) - Campo problemático
- valor_atual (TEXT)
- valor_esperado (TEXT)
- descricao (TEXT)
- sugestao (TEXT)
- resolvido (BOOLEAN)
- data_resolucao (TIMESTAMP)
- created_at, updated_at
```

---

#### **26. configuracoes_backup**
Configurações de backup automático.

```sql
- id (UUID) - PK
- user_id (UUID)
- backup_automatico (BOOLEAN)
- frequencia_backup ('diario' | 'semanal' | 'mensal')
- dia_backup (INTEGER) - Para semanal/mensal
- hora_backup (TIME)
- incluir_clientes (BOOLEAN)
- incluir_agendamentos (BOOLEAN)
- incluir_servicos (BOOLEAN)
- incluir_financeiro (BOOLEAN)
- incluir_cronogramas (BOOLEAN)
- ultimo_backup (TIMESTAMP)
- proximo_backup (TIMESTAMP)
- email_backup (TEXT)
- created_at, updated_at
```

---

### **VIEWS (Visualizações)**

#### **cronogramas_completos**
View que une cronogramas com dados de clientes e serviços.

#### **retornos_completos**
View que une retornos com dados completos de cronogramas.

#### **ranking_fidelidade**
View que calcula ranking de clientes por pontos.

#### **saldo_pontos**
View que calcula saldo de pontos por cliente.

#### **estatisticas_fidelidade**
View com estatísticas gerais do programa.

#### **disponibilidade_agendamentos**
View que mostra disponibilidade de horários.

#### **horarios_disponiveis_publicos**
View pública para agendamento online.

---

## 🔐 SEGURANÇA - ROW LEVEL SECURITY (RLS)

**TODAS** as tabelas possuem RLS ativado. Principais políticas:

### **Padrão para tabelas de usuário**:
```sql
-- SELECT: auth.uid() = user_id
-- INSERT: auth.uid() = user_id
-- UPDATE: auth.uid() = user_id
-- DELETE: auth.uid() = user_id
```

### **Exceções públicas**:
- **servicos**: Público pode SELECT (agendamento online)
- **configuracoes_horarios**: Público pode SELECT (horários disponíveis)
- **agendamentos_online**: Público pode INSERT e SELECT (até 30 dias futuros)

### **Triggers de Segurança**:
- `check_servico_delete_constraint`: Impede deletar serviço com agendamentos online ativos
- `handle_servico_deletion`: Cancela agendamentos online ao deletar serviço

---

## 🔄 FUNÇÕES E TRIGGERS IMPORTANTES

### **1. handle_new_user_signup()**
**Trigger**: Quando usuário se cadastra (`auth.users`)
- Cria registro em `usuarios` com metadados do signup
- Usa `security definer` para burlar RLS temporariamente

### **2. criar_preferencias_notificacao_padrao()**
**Trigger**: Quando usuário se cadastra
- Cria preferências de notificação padrão

### **3. registrar_pontos_agendamento()**
**Trigger**: Quando agendamento.status = 'concluido'
- Calcula pontos baseado no valor do serviço
- Insere em `pontos_fidelidade`
- Define data de expiração se configurado

### **4. atualizar_nivel_cliente()**
**Trigger**: Quando pontos mudam
- Recalcula pontos totais e disponíveis
- Determina novo nível usando `calcular_nivel_cliente()`
- Atualiza `niveis_fidelidade`

### **5. cadastrar_clientes_programa_fidelidade()**
**Função**: Quando programa é ativado
- Cadastra todos os clientes existentes no programa
- Cria registros em `niveis_fidelidade`

### **6. aplicar_expiracao_pontos()**
**Função**: Executada periodicamente (cron job recomendado)
- Marca pontos como expirados baseado em `data_expiracao`

### **7. converter_agendamento_online()**
**Função**: Converte agendamento online em agendamento regular
- Busca ou cria cliente
- Cria agendamento
- Atualiza status para 'convertido'
- Usa `security definer` com validação de usuário

### **8. buscar_horarios_com_multiplos_intervalos()**
**Função**: Calcula horários disponíveis
- Considera horários de trabalho
- Considera intervalos (almoço + personalizados)
- Verifica conflitos com agendamentos existentes
- Verifica agendamentos online
- Considera duração do serviço
- Retorna: `(horario, disponivel, bloqueio_motivo)`

### **9. validar_agendamento()**
**Função**: Valida se horário é permitido
- Verifica se está dentro do horário de trabalho
- Verifica se não está em intervalo

### **10. validar_horario_agendamento()**
**Trigger**: Antes de inserir agendamento
- Valida horário usando configurações
- Levanta exceção se inválido

### **11. update_updated_at_column()**
**Trigger**: Em várias tabelas
- Atualiza `updated_at` automaticamente

---

## 📱 FUNCIONALIDADES DO SISTEMA

### **1. AUTENTICAÇÃO E CADASTRO**

#### **Login** (`/login`)
- Email + Senha
- Validação com Supabase Auth
- Redirecionamento para Dashboard

#### **Cadastro** (`/cadastro`)
```typescript
interface UsuarioCadastro {
  nome_personalizado_app: string;  // Nome do salão
  nome_completo: string;
  email: string;
  telefone: string;
  tema_preferencia: 'feminino' | 'masculino';
  senha: string;
  confirmar_senha: string;
}
```
- Validação de formulário com Zod
- Cria usuário no Supabase Auth
- Trigger cria perfil automaticamente
- Trigger cria preferências de notificação

#### **Esqueci Senha** (`/esqueci-senha`)
- Recuperação por email via Supabase

---

### **2. DASHBOARD** (`/dashboard`)

**Componentes principais**:
- **Resumo Financeiro**: Entradas, saídas, lucro, valor em aberto
- **Agendamentos do Dia**: Lista de agendamentos de hoje
- **Próximos Agendamentos**: Agendamentos futuros
- **Clientes Devedores**: Clientes com saldo em aberto
- **Gráfico de Faturamento**: Últimos 7 dias
- **Avisos de Retorno**: Retornos pendentes próximos
- **Quick Actions**: Botões rápidos para criar agendamento, cliente, etc.

**Dados em tempo real**: Usa React Query com refetch automático.

---

### **3. AGENDAMENTOS** (`/agendamentos`)

#### **Listagem**
- Filtros: data, status, cliente, origem
- Busca por nome de cliente
- Ordenação
- Cards com informações completas
- Ações: Ver detalhes, Editar, Reagendar, Trocar horário, Cancelar

#### **Criação de Agendamento**
```typescript
interface NovoAgendamento {
  clienteId: string;
  servicoId: string;
  data: string;
  hora: string;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'fiado';
  valorPago?: number;
  observacoes?: string;
}
```

**Fluxo**:
1. Seleciona cliente (ou cria novo)
2. Seleciona serviço
3. Escolhe data e hora
   - Sistema verifica disponibilidade em tempo real
   - Mostra horários bloqueados
4. Define forma de pagamento
5. Adiciona observações
6. Confirma

**Validações**:
- Não permite agendamento em horário já ocupado
- Verifica horário de funcionamento
- Verifica intervalos
- Calcula automaticamente `valor_devido = valor - valor_pago`

#### **Edição**
- Permite alterar todos os campos
- Atualiza automaticamente lançamento financeiro se já concluído
- Recalcula pontos de fidelidade

#### **Reagendamento**
- Permite mudar data/hora mantendo outras informações
- Verifica disponibilidade do novo horário
- Atualiza status para 'agendado' se estava 'cancelado'

#### **Troca de Horário**
- Similar ao reagendamento, mas mantém a data
- Útil para ajustes rápidos

#### **Cancelamento**
- Muda status para 'cancelado'
- Pode adicionar motivo
- Remove lançamento financeiro se houver
- Remove pontos de fidelidade se houver

#### **Conclusão e Pagamento**
- Marca como 'concluido'
- Registra valores pagos
- Atualiza status_pagamento automaticamente
- Cria lançamento financeiro
- **Dispara registro de pontos de fidelidade**

#### **Detalhes do Agendamento**
- Mostra todas as informações
- Histórico de alterações (via logs)
- Informações do cliente
- Ações rápidas

---

### **4. AGENDAMENTO ONLINE** (`/agendamento-online`)

**Formulário Público** (sem autenticação necessária):

```typescript
interface AgendamentoOnlineData {
  nome_completo: string;
  email: string;
  telefone: string;
  servico_id: string;
  data: string;
  horario: string;
  observacoes?: string;
}
```

**Fluxo**:
1. Cliente acessa URL pública
2. Vê lista de serviços disponíveis (públicos)
3. Seleciona serviço
4. Escolhe data (até 30 dias no futuro)
5. Sistema mostra horários disponíveis em tempo real
6. Preenche dados pessoais
7. Confirma agendamento

**Backend**:
- Cria registro em `agendamentos_online` com status 'pendente'
- Busca ou cria cliente temporário
- Envia notificação para o dono do salão

**Conversão** (pelo dono do salão):
- Lista de agendamentos online pendentes
- Botão "Converter para Agendamento"
- Função `converter_agendamento_online()`:
  - Cria cliente definitivo se não existir
  - Cria agendamento regular
  - Atualiza status para 'convertido'

---

### **5. AGENDA** (`/agenda`)

**Três visualizações**:

#### **Agenda Diária**
- Timeline de 30 em 30 minutos
- Blocos visuais para cada agendamento
- Horários livres destacados
- Intervalos marcados
- Clique em horário livre abre formulário de agendamento

#### **Agenda Semanal**
- 7 colunas (dias da semana)
- Linhas de horários
- Grid com agendamentos
- Navegação entre semanas

#### **Agenda Mensal**
- Calendário do mês
- Cada dia mostra quantidade de agendamentos
- Clique no dia abre agenda diária

**Funcionalidades comuns**:
- Navegação (anterior/próximo/hoje)
- Filtros por status
- Cores por status (agendado=azul, concluido=verde, cancelado=vermelho)
- Drag & drop para reagendar (futuramente)

---

### **6. CLIENTES** (`/clientes`)

#### **Listagem**
- Busca por nome, email, telefone
- Ordenação (nome, última visita, valor gasto)
- Cards com foto (avatar), nome, telefone, última visita
- Badge de débito se houver valor em aberto

#### **Cadastro**
```typescript
interface ClienteFormData {
  nomeCompleto: string;
  email?: string;
  telefone: string;
  endereco?: string;
  dataNascimento?: string;
  servicoFrequente?: string;
  observacoes?: string;
}
```

#### **Detalhes do Cliente**
- **Informações Pessoais**: Nome, telefone, email, endereço, nascimento
- **Histórico de Serviços**: Lista de agendamentos passados
- **Valor Total Gasto**: Soma de todos os serviços
- **Última Visita**: Data do último agendamento
- **Débitos**: Valores em aberto
- **Programa de Fidelidade** (se ativo):
  - Nível atual (Bronze/Prata/Ouro/Platina)
  - Pontos disponíveis
  - Pontos totais acumulados
  - Histórico de pontos
  - Resgates realizados
  - Botão para resgatar recompensa

#### **Edição**
- Todos os campos editáveis
- Validação de telefone/email

#### **Exclusão**
- Confirma antes de deletar
- Não permite se houver agendamentos futuros
- Remove todos os dados relacionados (pontos, níveis, etc.)

---

### **7. SERVIÇOS** (`/servicos`)

#### **Listagem**
- Cards com nome, valor, duração
- Busca por nome
- Ordenação (nome, valor, duração)

#### **Cadastro**
```typescript
interface NovoServico {
  nome: string;
  descricao?: string;
  valor: number;
  duracao: number; // minutos
  observacoes?: string;
}
```

#### **Edição**
- Atualiza serviço
- **Não** atualiza agendamentos existentes (mantém valores históricos)

#### **Exclusão**
- **Bloqueada** se houver agendamentos online ativos
- **Cancela** agendamentos online automaticamente se forçar

---

### **8. CRONOGRAMAS DE RETORNO** (`/cronogramas`)

Sistema inteligente para clientes recorrentes.

#### **Criação de Cronograma**
```typescript
interface NovoCronograma {
  clienteId: string;
  servicoId: string;
  dataInicio: string;
  horaInicio: string;
  recorrencia: 'Semanal' | 'Quinzenal' | 'Mensal' | 'Personalizada';
  intervaloDias?: number; // Para personalizada
  observacoes?: string;
}
```

**Lógica**:
1. Cria cronograma em `cronogramas_novos`
2. Gera primeiro retorno em `retornos_novos`
3. Sistema gera próximos retornos automaticamente

#### **Lista de Cronogramas**
- Mostra todos os cronogramas ativos
- Badge com quantidade de retornos pendentes
- Data do próximo retorno
- Ações: Ver retornos, Editar, Cancelar

#### **Lista de Retornos**
- Agrupado por status (Pendente/Realizado/Cancelado)
- Filtros por cliente, data
- **Converter para Agendamento**: Cria agendamento e marca retorno como 'Realizado'
- **Gerar Próximo Retorno**: Sistema calcula próxima data baseado na recorrência

#### **Visualização com Agendamentos**
- Mostra cronogramas e retornos em formato de calendário
- Integrado com agenda

---

### **9. FINANCEIRO** (`/financeiro`)

Sistema completo de gestão financeira.

#### **Resumo Financeiro**
```typescript
interface ResumoFinanceiro {
  totalEntradas: number;
  totalSaidas: number;
  lucro: number;
  valorEmAberto: number;     // Clientes devedores
  contasAPagar: number;       // Contas fixas em aberto
}
```

#### **Filtros de Relatório**
- **Período**: Dia, semana, mês, ano, personalizado
- **Tipo**: Entradas, saídas, todos
- **Categoria**: Filtro por categoria
- **Cliente**: Filtro por cliente (para entradas)

#### **Gráfico Financeiro**
- Gráfico de barras: Entradas vs Saídas por dia/mês
- Gráfico de pizza: Categorias de despesas
- Gráfico de linha: Evolução do lucro

#### **Lançamentos**
**Lista**:
- Tabela com data, descrição, categoria, valor, tipo
- Cores: Verde (entrada), Vermelho (saída)
- Badge de origem (Agendamento/Conta Fixa/Manual)

**Criação Manual**:
```typescript
interface NovoLancamento {
  tipo: 'entrada' | 'saida';
  valor: number;
  data: Date;
  descricao: string;
  categoria?: string;
  clienteId?: string; // Opcional para entradas
}
```

**Automáticos**:
- Criado quando agendamento é concluído
- Criado quando conta fixa vence

#### **Contas Fixas**
```typescript
interface NovaContaFixa {
  nome: string;
  valor: number;
  dataVencimento: number; // Dia do mês (1-31)
  categoria: string;
  frequencia: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  repetir: boolean;
  ativa: boolean;
}
```

**Lógica**:
- Sistema calcula `proximo_vencimento`
- Quando chega a data, cria lançamento automaticamente
- Atualiza status para 'em_aberto'
- Notifica usuário

**Marcar como Pago**:
- Atualiza status para 'pago'
- Recalcula próximo vencimento se repetir

#### **Contas a Receber** (Devedores)
- Lista de clientes com débitos
- Agrupado por cliente
- Mostra agendamentos em aberto/parciais
- Botão para registrar pagamento

#### **Relatórios Avançados**
- Exportação para Excel/CSV
- Relatório de lucratividade por serviço
- Relatório de clientes mais rentáveis
- Relatório de despesas por categoria
- Relatório de fluxo de caixa

#### **Avisos de Vencimento**
- Notificação de contas fixas próximas do vencimento
- Notificação de débitos de clientes
- Badge no menu com quantidade de avisos

---

### **10. MARKETING - PROGRAMA DE FIDELIDADE** (`/marketing`)

Sistema completo de pontos e recompensas.

#### **Configuração do Programa**
```typescript
interface ProgramaFidelidade {
  nome: string;
  pontos_por_real: number;    // Ex: 0.1 = 10 pontos por R$1
  expiracao_pontos_dias: number; // 0 = nunca expira
  ativo: boolean;
  data_inicio: Date;
}
```

**Ativação**:
- Ativa/desativa programa
- Cadastra todos os clientes existentes automaticamente

#### **Classes de Fidelidade**
```typescript
interface ClasseFidelidade {
  nome: string;
  pontos_minimos: number;
  ordem: number;
  cor: string;
  beneficios: string;
  ativo: boolean;
}
```

**Classes Padrão**:
- Bronze: 0+ pontos
- Prata: 200+ pontos
- Ouro: 500+ pontos
- Platina: 1000+ pontos

**Personalização**:
- Criar/editar/excluir classes
- Definir cores personalizadas
- Benefícios descritivos

#### **Recompensas**
```typescript
interface Recompensa {
  nome: string;
  descricao: string;
  tipo: 'desconto' | 'servico_gratis' | 'produto';
  pontos_necessarios: number;
  valor_desconto?: number;      // Para tipo desconto
  servico_id?: string;          // Para serviço grátis
  classe_id?: string;           // Exclusivo para classe
  validade_dias: number;        // Validade após resgate
  ativo: boolean;
}
```

**Criação**:
- Define recompensas disponíveis
- Pode ser exclusiva para classe específica
- Validade configurável

#### **Resgate de Recompensa**
**Fluxo**:
1. Cliente seleciona recompensa
2. Sistema valida pontos disponíveis
3. Deduz pontos (cria registro negativo em `pontos_fidelidade`)
4. Cria registro em `historico_resgates`
5. Define data de expiração
6. Gera cupom/código

**Utilização**:
- Ao criar agendamento, pode aplicar recompensa
- Sistema valida validade
- Aplica desconto automaticamente
- Marca como utilizado

#### **Ranking de Clientes**
- Lista clientes ordenados por pontos totais
- Mostra nível, pontos disponíveis, total de resgates
- Cores das classes
- Pesquisa e filtros

#### **Estatísticas de Fidelidade**
```typescript
interface EstatisticasFidelidade {
  total_clientes_programa: number;
  clientes_ativos_30d: number;
  total_pontos_distribuidos: number;
  total_pontos_resgatados: number;
  distribuicao_por_nivel: {
    bronze: number;
    prata: number;
    ouro: number;
    platina: number;
  };
}
```

**Gráficos**:
- Distribuição de clientes por nível (pizza)
- Evolução de pontos distribuídos (linha)
- Top 10 clientes (barras)

#### **Análise de Fidelidade**
- Taxa de retenção
- Ticket médio por nível
- ROI do programa
- Clientes em risco de churn

---

### **11. CONFIGURAÇÕES** (`/configuracoes`)

#### **Horários de Funcionamento**
**Por dia da semana**:
```typescript
interface ConfiguracaoHorario {
  dia_semana: number; // 0-6
  horario_abertura: string;
  horario_fechamento: string;
  intervalo_inicio?: string;
  intervalo_fim?: string;
  ativo: boolean;
}
```

**Interface**:
- Toggle para ativar/desativar dia
- Seleção de horários com time picker
- Intervalo de almoço opcional
- Salva automaticamente

#### **Intervalos de Trabalho**
**Múltiplos intervalos por dia**:
```typescript
interface IntervaloTrabalho {
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  descricao: string;
  ativo: boolean;
}
```

**Exemplos**:
- Intervalo de almoço: 12:00-13:00
- Pausa para café: 15:00-15:15
- Intervalo para limpeza: 18:00-18:30

#### **Notificações**
**Configurações Gerais**:
- Habilitar/desabilitar push, email, som
- Som personalizado (escolher entre 3 opções)
- Horário de início/fim (não incomoda à noite)

**Lembretes**:
- Lembrete de agendamento (X minutos antes)
- Lembrete de vencimento (X dias antes)
- Lembrete de contas fixas (X dias antes)

**Eventos**:
- Novos agendamentos
- Cancelamentos
- Reagendamentos
- Pagamentos
- Retornos de cronograma
- Alertas financeiros
- Ofertas de fidelidade

**Push Notifications**:
- Botão para solicitar permissão
- Mostra status da permissão
- Botão de teste
- Lista de dispositivos inscritos

#### **Backup Automático**
```typescript
interface ConfiguracaoBackup {
  backup_automatico: boolean;
  frequencia_backup: 'diario' | 'semanal' | 'mensal';
  dia_backup?: number;        // Para semanal/mensal
  hora_backup: string;
  incluir_clientes: boolean;
  incluir_agendamentos: boolean;
  incluir_servicos: boolean;
  incluir_financeiro: boolean;
  incluir_cronogramas: boolean;
  email_backup: string;
}
```

**Funcionalidades**:
- Ativa backup automático
- Escolhe frequência
- Seleciona dados para incluir
- Email para enviar backup
- Botão "Fazer Backup Agora"
- Histórico de backups

#### **Perfil do Usuário**
- Nome completo
- Email (não editável)
- Telefone
- Nome personalizado do app/salão
- Tema de preferência (feminino/masculino)

---

### **12. AUDITORIA** (`/auditoria`)

Sistema de verificação de integridade dos dados.

#### **Executar Auditoria**
**Verificações**:
1. **Agendamentos**:
   - Valores negativos
   - Datas no passado com status 'agendado'
   - Horários fora do expediente
   - Durações inválidas
   - Cliente/serviço inexistente
   - Conflitos de horário

2. **Clientes**:
   - Telefone inválido
   - Email inválido
   - Dados duplicados

3. **Serviços**:
   - Valores negativos ou zero
   - Durações inválidas

4. **Financeiro**:
   - Valores negativos (quando não deveria)
   - Lançamentos sem origem
   - Inconsistências entre agendamento e lançamento
   - Datas futuras

5. **Cronogramas**:
   - Retornos sem cronograma
   - Datas de retorno no passado com status 'Pendente'
   - Recorrências inválidas

6. **Fidelidade**:
   - Pontos negativos inválidos
   - Saldo inconsistente
   - Resgates sem pontos suficientes

**Resultado**:
- Cria relatório em `relatorios_auditoria`
- Lista problemas em `problemas_auditoria`
- Classifica por severidade (crítico, alto, médio, baixo)
- Fornece sugestões de correção

#### **Resolver Retornos**
- Lista retornos pendentes no passado
- Botão para marcar como realizado
- Botão para cancelar
- Atualiza status automaticamente

#### **Consultas SQL**
- Interface para executar queries customizadas
- Visualização de resultados em tabela
- Exportação de resultados
- Histórico de queries

---

### **13. PWA (PROGRESSIVE WEB APP)**

#### **Instalação**
- Prompt automático para instalar
- Funciona em Chrome, Edge, Safari (iOS 16.4+)
- Ícones adaptativos para diferentes tamanhos
- Splash screen personalizada

#### **Offline**
- Service Worker cacheia assets estáticos
- Cache de páginas visitadas
- Indicador visual quando offline
- Banner de aviso

#### **Atualização**
- Detecta nova versão automaticamente
- Prompt para atualizar
- Recarrega automaticamente após aceitar

#### **Notificações Push**
**Configuração**:
- Solicita permissão ao usuário
- Gera subscription com Web Push API
- Armazena em `push_subscriptions`
- Gera chaves VAPID

**Envio**:
- Edge Function `enviar-notificacao-push`
- Respeita preferências do usuário
- Respeita horário de notificações
- Remove subscriptions inativas

**Service Worker**:
- Escuta evento `push`
- Mostra notificação com ícone, badge
- Evento `notificationclick` redireciona para app

---

## 🎨 DESIGN SYSTEM

### **Cores (index.css)**

```css
:root {
  /* Cores primárias */
  --primary: [HSL];
  --primary-foreground: [HSL];
  
  /* Cores secundárias */
  --secondary: [HSL];
  --secondary-foreground: [HSL];
  
  /* Cores de fundo */
  --background: [HSL];
  --foreground: [HSL];
  
  /* Cores de card */
  --card: [HSL];
  --card-foreground: [HSL];
  
  /* Cores de borda */
  --border: [HSL];
  --input: [HSL];
  
  /* Cores de destaque */
  --accent: [HSL];
  --accent-foreground: [HSL];
  
  /* Cores de estado */
  --destructive: [HSL];
  --muted: [HSL];
  --popover: [HSL];
  
  /* Raios de borda */
  --radius: 0.5rem;
}

.dark {
  /* Versões dark mode */
}
```

**Uso**: SEMPRE usar tokens semânticos, NUNCA cores diretas.

### **Componentes Shadcn**

Todos os componentes em `src/components/ui/` são customizáveis via:
- Variantes (size, variant, etc.)
- Design tokens do Tailwind
- CVA (Class Variance Authority)

**Exemplo**:
```tsx
<Button variant="default" size="md">
<Button variant="destructive" size="lg">
<Button variant="outline" size="sm">
```

### **Responsividade**

- Mobile-first
- Breakpoints: sm, md, lg, xl, 2xl
- Layout adaptativo (sidebar collapsible)
- Touch-friendly (botões grandes em mobile)

---

## 🔄 FLUXOS DE DADOS

### **Fluxo de Agendamento Completo**

```
1. Cliente preenche formulário online
   ↓
2. Cria registro em agendamentos_online (status: pendente)
   ↓
3. Notifica dono do salão (push + toast)
   ↓
4. Dono visualiza e converte
   ↓
5. converter_agendamento_online():
   - Cria/busca cliente
   - Cria agendamento (status: agendado)
   - Atualiza agendamento_online (status: convertido)
   ↓
6. Dia do agendamento, dono marca como concluído
   ↓
7. Trigger registrar_pontos_agendamento():
   - Calcula pontos baseado no valor
   - Insere em pontos_fidelidade
   ↓
8. Trigger atualizar_nivel_cliente():
   - Recalcula saldo de pontos
   - Atualiza nível se necessário
   ↓
9. Cria lançamento financeiro automaticamente
```

### **Fluxo de Cronograma**

```
1. Cria cronograma (data_inicio: hoje, recorrencia: semanal)
   ↓
2. Sistema gera primeiro retorno (data: hoje + 7 dias)
   ↓
3. Retorno fica "Pendente"
   ↓
4. Dono converte retorno em agendamento
   ↓
5. Retorno marcado como "Realizado"
   ↓
6. Sistema gera próximo retorno (data: último + 7 dias)
   ↓
7. Ciclo continua até cronograma ser cancelado
```

### **Fluxo de Conta Fixa**

```
1. Cria conta fixa (vencimento: dia 10, frequencia: mensal)
   ↓
2. Sistema calcula proximo_vencimento (próximo dia 10)
   ↓
3. Job diário verifica vencimentos
   ↓
4. Se hoje >= proximo_vencimento:
   - Cria lançamento (tipo: saida, origem: conta_fixa)
   - Atualiza status para 'em_aberto'
   - Notifica usuário
   ↓
5. Dono marca como pago
   ↓
6. Sistema recalcula proximo_vencimento (próximo mês dia 10)
   ↓
7. Status volta para 'pago'
```

---

## 🎯 HOOKS CUSTOMIZADOS

### **useAgendamentos**
```typescript
const {
  agendamentos,
  loading,
  criar,
  atualizar,
  deletar,
  buscarPorData,
  buscarPorCliente,
  marcarComoConcluido,
  registrarPagamento
} = useAgendamentos();
```

### **useSupabaseClientes**
```typescript
const {
  clientes,
  loading,
  criar,
  atualizar,
  deletar,
  buscar,
  buscarPorId
} = useSupabaseClientes();
```

### **useServicos**
```typescript
const {
  servicos,
  loading,
  criar,
  atualizar,
  deletar
} = useServicos();
```

### **useCronogramas**
```typescript
const {
  cronogramas,
  retornos,
  loading,
  criarCronograma,
  atualizarCronograma,
  cancelarCronograma,
  converterRetornoEmAgendamento,
  gerarProximoRetorno
} = useCronogramas();
```

### **useLancamentos**
```typescript
const {
  lancamentos,
  resumo,
  loading,
  criar,
  buscarPorPeriodo,
  buscarPorCategoria
} = useLancamentos();
```

### **useContasFixas**
```typescript
const {
  contas,
  loading,
  criar,
  atualizar,
  marcarComoPago,
  deletar
} = useContasFixas();
```

### **usePushSubscription**
```typescript
const {
  isSupported,
  permission,
  isSubscribed,
  loading,
  requestPermission,
  subscribe,
  unsubscribe,
  sendTestNotification
} = usePushSubscription();
```

### **usePWA**
```typescript
const {
  isInstallable,
  isInstalled,
  isOffline,
  hasUpdate,
  installApp,
  updateApp,
  dismissInstall
} = usePWA();
```

---

## 🚀 EDGE FUNCTIONS

### **enviar-notificacao-push**
**Endpoint**: `POST /functions/v1/enviar-notificacao-push`

**Payload**:
```json
{
  "user_id": "uuid",
  "title": "string",
  "body": "string",
  "icon": "string",
  "url": "string",
  "tag": "string"
}
```

**Lógica**:
1. Busca preferências de notificação do usuário
2. Valida se está no horário permitido
3. Busca todas as subscriptions ativas
4. Para cada subscription:
   - Envia push usando Web Push API
   - Se falhar (endpoint inválido), marca como inativa
5. Retorna quantidade de notificações enviadas

**Uso**:
- Chamada quando novo agendamento online
- Chamada quando retorno pendente
- Chamada quando conta fixa vence
- Chamada por botão de teste

---

## 📊 RELATÓRIOS E ESTATÍSTICAS

### **Dashboard**
- Agendamentos hoje
- Próximos agendamentos (próximos 7 dias)
- Resumo financeiro (mês atual)
- Clientes devedores
- Gráfico de faturamento (7 dias)
- Retornos pendentes próximos

### **Financeiro**
- Relatório de período (customizável)
- Gráfico de entradas vs saídas
- Gráfico de categorias
- Gráfico de evolução
- Tabela detalhada de lançamentos
- Relatório de lucratividade por serviço
- Relatório de clientes mais rentáveis

### **Fidelidade**
- Estatísticas gerais (clientes, pontos)
- Distribuição por nível
- Top 10 clientes
- Taxa de retenção
- ROI do programa

### **Auditoria**
- Problemas encontrados por categoria
- Distribuição de severidade
- Sugestões de melhoria
- Estatísticas de integridade

---

## 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

### **Supabase Auth**
- Email + Password
- Confirmação de email (opcional)
- Reset de senha por email
- Sessão persistente (localStorage)
- Auto refresh de token

### **Protected Routes**
```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

Redireciona para `/login` se não autenticado.

### **RLS (Row Level Security)**
Garante isolamento completo de dados entre usuários.

**Exemplo**:
```sql
CREATE POLICY "Users can view own data"
ON agendamentos
FOR SELECT
USING (auth.uid() = user_id);
```

Mesmo que hacker tente acessar dados de outro usuário via API, RLS bloqueia.

---

## 🎉 FUNCIONALIDADES ÚNICAS

### **1. Agendamento Online Público**
- Link compartilhável
- Sem necessidade de login
- Verificação de disponibilidade em tempo real
- Conversão inteligente para agendamento

### **2. Cronogramas Inteligentes**
- Geração automática de retornos
- Recorrência configurável
- Conversão em agendamento com 1 clique

### **3. Integração Financeira Completa**
- Lançamentos automáticos de agendamentos
- Contas fixas recorrentes
- Relatórios detalhados
- Avisos de vencimento

### **4. Programa de Fidelidade Gamificado**
- Classes customizáveis
- Pontos automáticos
- Recompensas flexíveis
- Ranking de clientes
- Sistema de indicação (futuro)

### **5. PWA Completo**
- Instalável como app
- Funciona offline
- Push notifications
- Atualização automática

### **6. Sistema de Auditoria**
- Verificação automática de integridade
- Sugestões de correção
- Relatórios detalhados

---

## 🚦 PERFORMANCE E OTIMIZAÇÕES

### **React Query**
- Cache automático
- Refetch em background
- Deduplicação de requests
- Stale-while-revalidate

### **Lazy Loading**
```tsx
const AgendamentoOnlineForm = React.lazy(() => 
  import('@/components/agendamento-online/AgendamentoOnlineForm')
);
```

### **Memoization**
- `useMemo` para cálculos pesados
- `useCallback` para funções
- `React.memo` para componentes

### **Bundle Splitting**
- Vite faz code splitting automático
- Chunks por rota
- Vendor chunk separado

### **Service Worker**
- Cache de assets estáticos
- Network-first para API
- Cache-first para imagens

---

## 📱 COMPATIBILIDADE

### **Navegadores**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### **PWA**
- Chrome/Edge (Android): ✅
- Safari (iOS 16.4+): ✅
- Firefox: ⚠️ (limitado)

### **Dispositivos**
- Desktop: ✅
- Tablet: ✅
- Mobile: ✅
- PWA Instalado: ✅

---

## 🔮 ROADMAP E MELHORIAS FUTURAS

### **Curto Prazo**
- [ ] Múltiplos profissionais
- [ ] Agenda por profissional
- [ ] Bloqueio de horários temporário
- [ ] Integração WhatsApp
- [ ] Envio de lembretes por SMS

### **Médio Prazo**
- [x] Pagamentos online (Cakto)
- [ ] Cupons de desconto
- [ ] Comissões por profissional
- [ ] Gestão de estoque de produtos
- [ ] Venda de produtos

### **Pagamento (Cakto)**

O app usa checkout hospedado da Cakto e webhooks para atualizar o status em `public.usuarios`.

Documento: `src/docs/CAKTO_INTEGRACAO.md`

### **Longo Prazo**
- [ ] App mobile nativo (React Native)
- [ ] IA para sugestão de horários
- [ ] Previsão de demanda
- [ ] CRM completo
- [ ] Multi-unidades (franquias)

---

## 📝 CONCLUSÃO

Este é um **sistema completo, robusto e escalável** para gestão de salões de beleza, com arquitetura moderna, código limpo, segurança avançada e experiência de usuário excepcional.

**Destaques**:
✅ Backend serverless (Supabase)
✅ Frontend moderno (React + TypeScript)
✅ PWA completo (offline + push)
✅ Segurança (RLS + Auth)
✅ Automação inteligente
✅ Design system consistente
✅ Performance otimizada
✅ Código bem documentado

**Pronto para produção e escala** 🚀
