# Formulário de Agendamento Online

## 📋 Visão Geral

O formulário de agendamento online permite que clientes agendem serviços diretamente pela web, sem necessidade de contato telefônico ou presencial.

## 🌐 Como Acessar

### Para Clientes (Formulário Público)
- **URL**: `/agendamento-online`
- **Acesso direto**: Navegue para esta rota no navegador
- **Layout**: Página independente, sem menu lateral (experiência focada no cliente)

### Para Profissionais (Administração)
- **Botão no Header**: Clique em "Agendamento Online" no topo da aplicação
- **Abre em nova aba**: Para não interromper o fluxo de trabalho
- **Monitoramento**: Notificações automáticas na dashboard quando há novos agendamentos

## ✨ Funcionalidades

### Campos do Formulário
- **Nome Completo** (obrigatório)
- **Telefone** (obrigatório, com máscara automática)
- **Serviço** (obrigatório, lista dinâmica)
- **Data** (obrigatório, calendário interativo)
- **Horário** (obrigatório, baseado na disponibilidade)
- **Observações** (opcional)

### Validações Inteligentes
- ✅ Datas passadas são bloqueadas automaticamente
- ✅ Horários ocupados não aparecem na lista
- ✅ Conflitos de agendamento são evitados
- ✅ Telefone com formato brasileiro validado
- ✅ Duração do serviço considerada para disponibilidade

### Fluxo Dinâmico
1. Cliente escolhe o **serviço** → Sistema carrega duração
2. Cliente escolhe a **data** → Sistema calcula horários livres
3. Cliente vê apenas **horários disponíveis** para aquele serviço/data
4. **Validação final** antes de confirmar

## 🔄 Integrações Automáticas

### Ao Confirmar Agendamento
- **Agendamento**: Criado automaticamente na tabela interna
- **Cliente**: Criado (se novo) ou atualizado (se existente)
- **Status**: Definido como "Agendado" por padrão
- **Pagamento**: Marcado como "Em Aberto"
- **Notificação**: Profissional recebe alerta na dashboard

### Sistema de Notificações
- **Dashboard**: Popup com detalhes do novo agendamento
- **Tempo Real**: Verificação automática de novos agendamentos
- **Ações Rápidas**: Botões para ver agendamentos ou marcar como visto

## 🎨 Design e UX

### Interface
- **Cores**: Paleta lilás/rosa do sistema
- **Responsivo**: Funciona perfeitamente em mobile
- **Gradientes**: Visual moderno e atrativo
- **Animações**: Transições suaves

### Experiência do Cliente
- **Simplicidade**: Processo em etapas claras
- **Feedback**: Mensagens de sucesso/erro visuais
- **Máscara**: Telefone formatado automaticamente
- **Calendário**: Interface intuitiva para seleção de datas

## 🔧 Configurações Técnicas

### Horários de Funcionamento
- **Início**: 08:00
- **Fim**: 18:00 (último horário possível depende da duração do serviço)
- **Intervalos**: 30 minutos

### Dados Mockados (Para Desenvolvimento)
- **Serviços**: Lista completa com preços e durações
- **Agendamentos**: Base para calcular conflitos
- **Clientes**: Verificação de existência por telefone

## 🚀 Próximos Passos com Supabase

Após conectar o Supabase:
1. **Tabelas**: Agendamentos, Clientes, Serviços
2. **RLS**: Políticas de segurança
3. **Real-time**: Notificações instantâneas
4. **Triggers**: Automações no banco
5. **Functions**: Envio de SMS/Email de confirmação

## 📱 Compartilhamento

### Para Clientes
- **Link direto**: Envie a URL `/agendamento-online`
- **QR Code**: Gere código QR para facilitar acesso
- **Redes Sociais**: Compartilhe link em Instagram/WhatsApp
- **Site**: Incorpore como iframe se necessário