# Guia Completo: Configuração de Login Social no Supabase

Este guia passo a passo ensina como configurar os provedores de autenticação **Google** e **Facebook** no seu projeto Supabase, permitindo que os usuários do seu aplicativo façam login social.

---

## 🛑 Pré-requisito: URL de Redirecionamento (Callback URI)

Antes de configurar o Google ou o Facebook, você precisará da **URL de Redirecionamento do Supabase**. Essa é a URL para a qual o Google/Facebook enviará o usuário após o login bem-sucedido.

1. Acesse o painel do **Supabase**.
2. Vá em **Authentication** > **Providers**.
3. Clique em **Google** ou **Facebook**.
4. Abaixo de "Callback URL (for OAuth)", você verá uma URL no formato:
   `https://[SUA-REF-DO-SUPABASE].supabase.co/auth/v1/callback`
5. **Copie essa URL**, pois você a usará nos próximos passos.

---

## 🟢 Configurando Login com Google

### Passo 1: Criar o Projeto no Google Cloud Console
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Faça login com sua conta do Google.
3. No topo da página, clique em **Selecione um projeto** (ou no nome do projeto atual) e depois em **Novo Projeto**.
4. Dê um nome ao projeto (ex: "Meu Salão App") e clique em **Criar**.
5. Aguarde a criação e selecione o novo projeto.

### Passo 2: Configurar a Tela de Consentimento (OAuth Consent Screen)
1. No menu lateral esquerdo (menu de hambúrguer ☰), vá em **APIs e Serviços** > **Tela de consentimento OAuth**.
2. Escolha **Externo** (se seu app for para o público em geral) e clique em **Criar**.
3. Preencha as informações obrigatórias:
   - **Nome do app:** O nome que aparecerá para o usuário.
   - **E-mail de suporte ao usuário:** Seu e-mail.
   - **Logotipo do app:** (Opcional, mas recomendado).
   - **E-mail dos dados de contato do desenvolvedor:** Seu e-mail novamente.
4. Clique em **Salvar e Continuar**.
5. Nas próximas telas (Escopos, Usuários de teste, Resumo), você pode apenas clicar em **Salvar e Continuar** até o final.
6. Volte ao painel principal da Tela de Consentimento e clique em **Publicar aplicativo** (isso remove o limite de usuários de teste).

### Passo 3: Criar as Credenciais (Client ID e Secret)
1. No menu lateral esquerdo, vá em **APIs e Serviços** > **Credenciais**.
2. No topo, clique em **+ CRIAR CREDENCIAIS** e selecione **ID do cliente OAuth**.
3. Em **Tipo de aplicativo**, escolha **Aplicativo da Web**.
4. Em **Nome**, digite algo como "Login Web Supabase".
5. Em **Origens JavaScript autorizadas**, clique em **Adicionar URI** e insira a URL do seu site em produção (ex: `https://seu-dominio.com` ou `https://seu-app.vercel.app`). Se estiver testando localmente, adicione também `http://localhost:8080`.
6. Em **URIs de redirecionamento autorizados**, clique em **Adicionar URI** e **cole a URL de Callback do Supabase** que você copiou no Pré-requisito (ex: `https://xyz.supabase.co/auth/v1/callback`).
7. Clique em **Criar**.
8. Uma janela aparecerá com o **ID do Cliente (Client ID)** e a **Chave Secreta do Cliente (Client Secret)**. Mantenha essa aba aberta ou copie esses valores.

### Passo 4: Inserir as Credenciais no Supabase
1. Volte ao painel do **Supabase**.
2. Vá em **Authentication** > **Providers** > **Google**.
3. Ative a chave **Enable Sign in with Google**.
4. Cole o **Client ID (for Web)** e o **Client Secret** que você obteve no Google Cloud Console nos respectivos campos.
5. Clique em **Save**.

---

## 🔵 Configurando Login com Facebook

### Passo 1: Criar o Aplicativo no Facebook Developers
1. Acesse [Facebook Developers](https://developers.facebook.com/) e faça login. Se não for desenvolvedor registrado, siga as instruções para se registrar.
2. Clique em **Meus Aplicativos** no canto superior direito.
3. Clique em **Criar Aplicativo**.
4. Em "O que você deseja que seu aplicativo faça?", selecione **Autenticar e solicitar dados de usuários com o Login do Facebook** e clique em **Avançar**.
5. Escolha **Não, não estou criando um jogo** e avance.
6. Dê um nome ao seu aplicativo (ex: "Meu Salão App") e adicione seu email de contato. Clique em **Criar Aplicativo**. Pode ser solicitada a sua senha do Facebook.

### Passo 2: Configurar o Login do Facebook
1. No painel do seu novo aplicativo, encontre o produto **Login do Facebook** e clique em **Configurar**.
2. No menu lateral esquerdo, sob **Login do Facebook**, clique em **Configurações**.
3. Role até encontrar a seção **URIs de redirecionamento do OAuth válidos**.
4. **Cole a URL de Callback do Supabase** que você copiou no Pré-requisito (ex: `https://xyz.supabase.co/auth/v1/callback`).
5. Clique em **Salvar alterações** no final da página.

### Passo 3: Obter o App ID e App Secret
1. No menu lateral esquerdo, vá em **Configurações da Conta** > **Básico** (ou apenas Configurações > Básico, dependendo da interface do FB).
2. Você verá o **ID do Aplicativo (App ID)** no topo.
3. Ao lado do **Chave Secreta do Aplicativo (App Secret)**, clique em **Mostrar** (pode ser necessário inserir a senha do Facebook novamente).
4. Copie ambos os valores.
5. No mesmo painel "Básico", adicione a **URL da Política de Privacidade** do seu site.
6. No topo da página do Facebook Developers, altere o botão de **Modo de Desenvolvimento (In development)** para **Ao Vivo (Live)**.

### Passo 4: Inserir as Credenciais no Supabase
1. Volte ao painel do **Supabase**.
2. Vá em **Authentication** > **Providers** > **Facebook**.
3. Ative a chave **Enable Sign in with Facebook**.
4. Cole o **App ID** no campo `Client ID` e o **App Secret** no campo `Client Secret`.
5. Clique em **Save**.

---

## 🛠️ Configurando Redirecionamentos do Aplicativo (Supabase)

Para garantir que, após o login, o Supabase consiga devolver o usuário para a página inicial do seu site ou aplicativo mobile:

1. No Supabase, vá em **Authentication** > **URL Configuration**.
2. Em **Site URL**, coloque a URL base principal do seu projeto em produção (ex: `https://seu-app.vercel.app`).
3. Em **Redirect URLs**, clique em **Add URL** e adicione todas as URLs para as quais seu aplicativo pode redirecionar.
   - Adicione `http://localhost:8080/*` (ou a porta que você usa) para testes locais.
   - Adicione `https://seu-app.vercel.app/*` para produção.
   - Se for usar Capacitor (Mobile), você precisará configurar deep links aqui também (ex: `myapp://*`).
4. Clique em **Save**.

Pronto! Seu aplicativo agora deve conseguir fazer login via Google e Facebook com sucesso. Se der algum erro, a nova versão do código que implementamos mostrará exatamente qual foi a falha na tela.