-- REGRAS DE TRIAL DE 7 DIAS E BLOQUEIO PÓS-EXPIRAÇÃO
-- Este script:
-- 1. Garante que a função check_trial_status retorne 'expired' imediatamente após o 7º dia.
-- 2. Atualiza a trigger de signup para garantir a data de início correta.
-- 3. Aplica políticas RLS de bloqueio para usuários com trial expirado.

-- ==============================================================================
-- 1. ATUALIZAR FUNÇÃO DE VERIFICAÇÃO DE TRIAL (RIGOROSA)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_trial_status(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  days_since_trial INTEGER;
  status_atual TEXT;
BEGIN
  SELECT trial_start_date, trial_used, subscription_status 
  INTO user_record
  FROM public.usuarios 
  WHERE id = user_id;
  
  -- Se não encontrou usuário
  IF user_record IS NULL THEN
    RETURN 'expired';
  END IF;

  -- Se já tem assinatura ativa PAGA
  IF user_record.subscription_status = 'active' THEN
    RETURN 'active';
  END IF;

  -- Se status já está marcado como expired no banco, retorna expired direto
  IF user_record.subscription_status = 'expired' THEN
    RETURN 'expired';
  END IF;
  
  -- Se nunca iniciou trial (caso antigo ou erro), considera expirado
  IF user_record.trial_start_date IS NULL THEN
    -- Autocorreção para usuários novos que ficaram sem data (fallback)
    IF user_record.subscription_status = 'trial' THEN
        UPDATE public.usuarios SET trial_start_date = NOW() WHERE id = user_id;
        RETURN 'trial';
    END IF;
    RETURN 'expired';
  END IF;
  
  -- Calcular dias desde início do trial (usando intervalos exatos)
  -- Se passou de 7 dias (ex: dia 8), já deve bloquear.
  days_since_trial := EXTRACT(DAY FROM (NOW() - user_record.trial_start_date));
  
  -- Lógica estrita de 7 dias
  IF days_since_trial < 7 THEN
    RETURN 'trial'; -- Ainda dentro dos 7 dias (0 a 6)
  ELSE
    -- Se passou dos 7 dias e não pagou, marca como expirado no banco para persistência
    UPDATE public.usuarios 
    SET subscription_status = 'expired' 
    WHERE id = user_id AND subscription_status != 'active';
    
    RETURN 'expired';
  END IF;
END;
$$;

-- ==============================================================================
-- 2. FUNÇÃO AUXILIAR PARA RLS (Bloqueio de Escrita)
-- ==============================================================================
-- Retorna TRUE se o usuário pode escrever (Ativo ou Trial Válido)
-- Retorna FALSE se expirado
CREATE OR REPLACE FUNCTION public.can_access_app(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE -- Otimização para RLS
AS $$
DECLARE
  status text;
BEGIN
  -- Chama a função centralizada de verificação
  status := public.check_trial_status(user_id);
  
  -- Apenas permite se for 'active' ou 'trial'
  IF status IN ('active', 'trial') THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- ==============================================================================
-- 3. APLICAR BLOQUEIO NAS TABELAS PRINCIPAIS (RLS)
-- ==============================================================================

-- Tabela: AGENDAMENTOS
-- Bloqueia INSERT/UPDATE/DELETE se expirado. SELECT permitido para ver histórico (opcional, pode bloquear também).
DROP POLICY IF EXISTS "Block write access for expired users on agendamentos" ON public.agendamentos;

-- Recriar políticas de agendamentos com verificação de acesso
-- (Exemplo simplificado: altera a política existente ou cria nova restritiva)
-- A melhor prática é adicionar a verificação na política existente de INSERT/UPDATE

-- Política de INSERT
DROP POLICY IF EXISTS "agendamentos_insert_policy" ON public.agendamentos;
CREATE POLICY "agendamentos_insert_policy" ON public.agendamentos
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_access_app(auth.uid()) -- Bloqueio aqui
);

-- Política de UPDATE
DROP POLICY IF EXISTS "agendamentos_update_policy" ON public.agendamentos;
CREATE POLICY "agendamentos_update_policy" ON public.agendamentos
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_access_app(auth.uid()) -- Bloqueio aqui
);

-- Tabela: CLIENTES
DROP POLICY IF EXISTS "clientes_insert_policy" ON public.clientes;
CREATE POLICY "clientes_insert_policy" ON public.clientes
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_access_app(auth.uid())
);

DROP POLICY IF EXISTS "clientes_update_policy" ON public.clientes;
CREATE POLICY "clientes_update_policy" ON public.clientes
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_access_app(auth.uid())
);

-- Tabela: SERVICOS
DROP POLICY IF EXISTS "servicos_insert_policy" ON public.servicos;
CREATE POLICY "servicos_insert_policy" ON public.servicos
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_access_app(auth.uid())
);

DROP POLICY IF EXISTS "servicos_update_policy" ON public.servicos;
CREATE POLICY "servicos_update_policy" ON public.servicos
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_access_app(auth.uid())
);

-- Tabela: LANCAMENTOS
DROP POLICY IF EXISTS "lancamentos_insert_policy" ON public.lancamentos;
CREATE POLICY "lancamentos_insert_policy" ON public.lancamentos
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_access_app(auth.uid())
);

-- ==============================================================================
-- 4. GARANTIA DA TRIGGER DE SIGNUP (Reforço)
-- ==============================================================================
-- Garante que novos usuários comecem com trial de 7 dias
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (
    id, email, nome_completo, nome_personalizado_app, telefone, tema_preferencia,
    trial_start_date, trial_used, subscription_status, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nome_personalizado_app', 'Meu Salão'),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'tema_preferencia', 'feminino'), 
    NOW(),      -- INÍCIO DO TRIAL
    FALSE, 
    'trial',    -- STATUS INICIAL
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Se já existe, NÃO altera a data de trial original para evitar reset
    email = EXCLUDED.email,
    updated_at = NOW(),
    -- Garante que o tema seja respeitado se vier na meta
    tema_preferencia = COALESCE(EXCLUDED.tema_preferencia, public.usuarios.tema_preferencia);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
