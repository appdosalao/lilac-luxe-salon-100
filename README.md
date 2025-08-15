# Sistema de Agendamento Profissional - Lilac Luxe Salon

Sistema completo de agendamento para salões de beleza com formulário público para clientes.

## 🔗 Links Importantes

### **Formulário de Agendamento Público**
- **URL para Bio do Instagram/WhatsApp:** `https://96bf76d4-a482-415d-bae4-8f0e245637fa.lovableproject.com/agendamento-online`
- **URL Alternativa Curta:** `https://96bf76d4-a482-415d-bae4-8f0e245637fa.lovableproject.com/agendar`

### **Acesso Administrativo**
- **URL Admin:** `https://96bf76d4-a482-415d-bae4-8f0e245637fa.lovableproject.com/login`

## 📋 Funcionalidades do Formulário Público

### ✅ **Campos do Formulário:**
- Nome Completo
- **E-mail** (chave única de identificação)
- Telefone com DDD (formatação automática)
- Lista de Serviços disponíveis
- Data e Horário (apenas horários disponíveis)
- Observações (opcional)

### 🔧 **Funcionalidades Avançadas:**
1. **Verificação de E-mail Único:** Se o e-mail já existir, reutiliza dados do cliente
2. **Validação de Horários:** Impede agendamentos em horários ocupados
3. **Integração Automática:** Agendamentos aparecem automaticamente no sistema admin
4. **Cadastro Automático:** Novos clientes são criados automaticamente
5. **Responsivo:** Funciona perfeitamente em celular, tablet e desktop

### 🎨 **Design:**
- Visual feminino e sofisticado
- Tons lilás (#D6B2E7) 
- Campos arredondados
- Totalmente responsivo
- PWA (Progressive Web App)

## 🚀 Como Usar

### **Para Clientes:**
1. Acesse o link do formulário
2. Preencha os dados pessoais
3. Escolha o serviço desejado
4. Selecione data e horário disponível
5. Confirme o agendamento
6. Receba confirmação imediata

### **Para Administradores:**
1. Acesse o sistema admin
2. Novos agendamentos aparecem automaticamente
3. Novos clientes são cadastrados automaticamente
4. Gerencie todos os agendamentos centralizadamente

## 🔄 Integração de Dados

O sistema integra automaticamente:
- **Clientes:** Cadastro automático ou atualização de dados existentes
- **Agendamentos:** Criação automática no sistema principal
- **Serviços:** Lista sempre atualizada baseada no cadastro de serviços
- **Horários:** Verificação em tempo real de disponibilidade

## 💾 Banco de Dados

Atualmente utiliza:
- **localStorage** para dados locais (facilita desenvolvimento)
- **Pronto para Supabase:** Arquitetura preparada para migração automática

### Migração para Supabase:
1. Clique no botão "Supabase" no canto superior direito
2. Configure a integração
3. Dados serão migrados automaticamente

## 📱 PWA (Progressive Web App)

O sistema funciona como aplicativo:
- Instalar no celular/desktop
- Funciona offline (dados locais)
- Notificações push (com Supabase)
- Performance nativa

## 🎯 URLs para Divulgação

**Formulário Público:**
```
https://96bf76d4-a482-415d-bae4-8f0e245637fa.lovableproject.com/agendamento-online
```

**URL Encurtada:**
```
https://96bf76d4-a482-415d-bae4-8f0e245637fa.lovableproject.com/agendar
```

**Para usar em bio do Instagram:**
```
🌸 Agende seu horário: 
https://96bf76d4-a482-415d-bae4-8f0e245637fa.lovableproject.com/agendar
```

## Project info

**URL**: https://lovable.dev/projects/a25a4f1a-738c-4c85-8fb4-986381a12f7a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a25a4f1a-738c-4c85-8fb4-986381a12f7a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a25a4f1a-738c-4c85-8fb4-986381a12f7a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
