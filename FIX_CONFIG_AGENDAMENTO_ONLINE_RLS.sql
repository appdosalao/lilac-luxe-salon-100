BEGIN;

-- Remove políticas públicas amplas que substituem as de owner
DROP POLICY IF EXISTS "Public can view online configs" ON public.configuracoes_agendamento_online;

-- Recria políticas corretas para multi-tenant

-- 1. Dono pode ver APENAS seu próprio registro (autenticado)
DROP POLICY IF EXISTS "Users can view their own online booking configs" ON public.configuracoes_agendamento_online;
CREATE POLICY "Users can view their own online booking configs"
  ON public.configuracoes_agendamento_online
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Dono pode criar APENAS seu próprio registro (autenticado)
DROP POLICY IF EXISTS "Users can create their own online booking configs" ON public.configuracoes_agendamento_online;
CREATE POLICY "Users can create their own online booking configs"
  ON public.configuracoes_agendamento_online
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Dono pode atualizar APENAS seu próprio registro (autenticado)
DROP POLICY IF EXISTS "Users can update their own online booking configs" ON public.configuracoes_agendamento_online;
CREATE POLICY "Users can update their own online booking configs"
  ON public.configuracoes_agendamento_online
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Dono pode excluir APENAS seu próprio registro (autenticado)
DROP POLICY IF EXISTS "Users can delete their own online booking configs" ON public.configuracoes_agendamento_online;
CREATE POLICY "Users can delete their own online booking configs"
  ON public.configuracoes_agendamento_online
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Público pode ver apenas configs ATIVAS (para o formulário de agendamento online público)
DROP POLICY IF EXISTS "Public can view active booking configs for form display" ON public.configuracoes_agendamento_online;
CREATE POLICY "Public can view active booking configs for form display"
  ON public.configuracoes_agendamento_online
  FOR SELECT
  TO anon, public
  USING (ativo = true);

COMMIT;