# 🚀 Guia Completo: Como Conectar seu Projeto da Vercel com Supabase

## 📋 Pré-requisitos
- Projeto já hospedado na Vercel
- Conta no Supabase (gratuita)
- Acesso aos painéis administrativos de ambas as plataformas

---

## 🎯 Passo 1: Criando o Projeto no Supabase

### 1.1 Acesse o Supabase
1. Vá para [supabase.com](https://supabase.com)
2. Clique em **"Start your project"** ou **"Sign In"** se já tiver conta
3. Faça login com GitHub, Google ou email

### 1.2 Criar Novo Projeto
1. No painel do Supabase, clique em **"New Project"**
2. Escolha sua organização (ou crie uma nova)
3. Preencha os dados:
   - **Name**: Nome do seu projeto (ex: "salao-agendamentos")
   - **Database Password**: Crie uma senha forte (ANOTE esta senha!)
   - **Region**: Escolha a região mais próxima (Brazil East para o Brasil)
4. Clique em **"Create new project"**
5. ⏳ Aguarde alguns minutos para o projeto ser criado

---

## 🔑 Passo 2: Obtendo as Credenciais do Supabase

### 2.1 Acessar Configurações da API
1. No seu projeto do Supabase, clique em **⚙️ Settings** (no menu lateral esquerdo)
2. Clique em **"API"** no submenu

### 2.2 Copiar as Credenciais Importantes
Você verá uma tela com várias informações. Copie e salve em local seguro:

**🔗 Project URL:**
```
https://xxxxxxxxxxx.supabase.co
```

**🔑 Anon/Public Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODM0NTY3OCwiZXhwIjoyMDEzOTIxNjc4fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **IMPORTANTE**: A `anon key` é segura para usar no frontend. A `service_role key` NUNCA deve ser exposta publicamente!

---

## 🌐 Passo 3: Configurando Variáveis de Ambiente na Vercel

### 3.1 Acessar seu Projeto na Vercel
1. Vá para [vercel.com](https://vercel.com)
2. Faça login e selecione seu projeto
3. Clique no nome do seu projeto para entrar no painel

### 3.2 Adicionar Variáveis de Ambiente
1. Clique em **"Settings"** (aba no topo)
2. No menu lateral esquerdo, clique em **"Environment Variables"**
3. Clique em **"Add New"** ou botão **"+"**

### 3.3 Adicionar a URL do Supabase
1. **Name**: Digite `VITE_SUPABASE_URL`
2. **Value**: Cole o Project URL que você copiou (ex: `https://xxxxxxxxxxx.supabase.co`)
3. **Environments**: Marque todas as opções (Production, Preview, Development)
4. Clique **"Save"**

### 3.4 Adicionar a Chave Anon do Supabase
1. Clique em **"Add New"** novamente
2. **Name**: Digite `VITE_SUPABASE_ANON_KEY`
3. **Value**: Cole a anon/public key que você copiou
4. **Environments**: Marque todas as opções (Production, Preview, Development)
5. Clique **"Save"**

---

## 🔄 Passo 4: Redesployment do Projeto

### 4.1 Forçar Novo Deploy
1. Ainda na Vercel, vá para a aba **"Deployments"**
2. Encontre o deploy mais recente (o primeiro da lista)
3. Clique nos **três pontinhos (⋯)** à direita
4. Selecione **"Redeploy"**
5. Clique **"Redeploy"** novamente para confirmar

### 4.2 Aguardar Deploy
- ⏳ Aguarde o deploy finalizar (geralmente 1-3 minutos)
- ✅ Você verá um status "Ready" quando terminar

---

## 🗄️ Passo 5: Criando as Tabelas no Banco de Dados

### 5.1 Acessar o SQL Editor
1. Volte ao Supabase
2. No menu lateral esquerdo, clique em **"SQL Editor"**
3. Clique em **"New query"**

### 5.2 Executar Script de Criação das Tabelas
1. Copie todo o conteúdo do arquivo `supabase_schema.sql`
2. Cole no editor SQL
3. Clique em **"Run"** (botão verde no canto inferior direito)
4. ✅ Você deve ver "Success. No rows returned" ou similar

### 5.3 Executar Script das Políticas de Segurança
1. Clique em **"New query"** novamente
2. Copie todo o conteúdo do arquivo `supabase_rls_policies.sql`
3. Cole no editor SQL
4. Clique em **"Run"**
5. ✅ Você deve ver "Success. No rows returned" ou similar

---

## ✅ Passo 6: Verificando se Tudo Funcionou

### 6.1 Verificar Tabelas Criadas
1. No Supabase, clique em **"Table Editor"** (menu lateral)
2. Você deve ver todas as tabelas criadas:
   - usuarios
   - clientes
   - servicos
   - agendamentos
   - configuracoes
   - contas_fixas
   - financeiro
   - notificacoes
   - auditoria
   - profissionais

### 6.2 Testar a Conexão
1. Acesse seu site na Vercel
2. Tente fazer login ou cadastro
3. Se aparecer algum erro, verifique o console do navegador (F12 → Console)

---

## 🔧 Solução de Problemas Comuns

### ❌ Erro: "Invalid API key"
**Causa**: Chave API incorreta ou não configurada
**Solução**: 
1. Verifique se copiou a chave corretamente
2. Confirme que usou `VITE_SUPABASE_ANON_KEY` (não a service_role)
3. Redesploy na Vercel

### ❌ Erro: "Failed to fetch"
**Causa**: URL incorreta ou problemas de CORS
**Solução**:
1. Verifique se a URL está correta (sem barra no final)
2. Confirme que usou `VITE_SUPABASE_URL`
3. Redesploy na Vercel

### ❌ Erro: "Row Level Security"
**Causa**: Políticas RLS não aplicadas corretamente
**Solução**:
1. Execute novamente o script `supabase_rls_policies.sql`
2. Verifique se todas as políticas foram criadas no painel de **Authentication** → **Policies**

---

## 📱 Testando Funcionalidades

### Teste 1: Cadastro de Usuário
1. Acesse seu site
2. Vá para a página de cadastro
3. Preencha os dados e clique em "Cadastrar"
4. ✅ Deve aparecer mensagem de sucesso

### Teste 2: Login
1. Faça login com os dados cadastrados
2. ✅ Deve redirecionar para o dashboard

### Teste 3: Criação de Dados
1. Logado, tente criar um cliente
2. Tente criar um serviço
3. Tente criar um agendamento
4. ✅ Todos devem funcionar sem erros

---

## 🎉 Pronto! Seu Projeto Está Conectado

Agora seu projeto React na Vercel está totalmente conectado com o banco de dados Supabase. Você pode:

- ✅ Fazer login e cadastro de usuários
- ✅ Salvar dados no banco de dados
- ✅ Ter autenticação segura
- ✅ Usar todas as funcionalidades do sistema

---

## 📞 Suporte

Se encontrar algum problema:
1. Verifique se seguiu todos os passos
2. Confira o console do navegador para erros
3. Verifique as variáveis de ambiente na Vercel
4. Confirme que as tabelas foram criadas no Supabase

**Lembre-se**: Qualquer mudança nas variáveis de ambiente exige um novo deploy na Vercel!