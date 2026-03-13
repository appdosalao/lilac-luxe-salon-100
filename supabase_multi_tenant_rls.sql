BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.generate_public_booking_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gen_random_uuid()::text;
$$;

ALTER TABLE public.configuracoes_agendamento_online
  ADD COLUMN IF NOT EXISTS public_id text;

UPDATE public.configuracoes_agendamento_online
SET public_id = public.generate_public_booking_id()
WHERE public_id IS NULL OR public_id = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_config_agendamento_online_public_id'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX idx_config_agendamento_online_public_id ON public.configuracoes_agendamento_online(public_id)';
  END IF;
END$$;

ALTER TABLE public.agendamentos_online
  ADD COLUMN IF NOT EXISTS owner_user_id uuid;

UPDATE public.agendamentos_online ao
SET owner_user_id = s.user_id
FROM public.servicos s
WHERE s.id = ao.servico_id
  AND ao.owner_user_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_agendamentos_online_owner_user_id'
  ) THEN
    EXECUTE 'CREATE INDEX idx_agendamentos_online_owner_user_id ON public.agendamentos_online(owner_user_id)';
  END IF;
END$$;

CREATE OR REPLACE FUNCTION public.set_agendamento_online_owner_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_user_id IS NULL THEN
    SELECT s.user_id INTO NEW.owner_user_id
    FROM public.servicos s
    WHERE s.id = NEW.servico_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_agendamento_online_owner_user_id ON public.agendamentos_online;
CREATE TRIGGER trg_set_agendamento_online_owner_user_id
BEFORE INSERT ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.set_agendamento_online_owner_user_id();

DO $$
DECLARE
  r record;
  p record;
  tenant_col text;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('agendamentos_online', 'usuarios')
  LOOP
    SELECT CASE
      WHEN EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = r.tablename
          AND c.column_name = 'user_id'
      ) THEN 'user_id'
      WHEN EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = r.tablename
          AND c.column_name = 'usuario_id'
      ) THEN 'usuario_id'
      ELSE NULL
    END INTO tenant_col;

    IF tenant_col IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);

      FOR p IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = r.tablename
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, r.tablename);
      END LOOP;

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() = %I)',
        r.tablename || '_select_own',
        r.tablename,
        tenant_col
      );

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = %I)',
        r.tablename || '_insert_own',
        r.tablename,
        tenant_col
      );

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = %I) WITH CHECK (auth.uid() = %I)',
        r.tablename || '_update_own',
        r.tablename,
        tenant_col,
        tenant_col
      );

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid() = %I)',
        r.tablename || '_delete_own',
        r.tablename,
        tenant_col
      );
    END IF;
  END LOOP;
END$$;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'usuarios'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuarios', p.policyname);
  END LOOP;
END$$;

CREATE POLICY usuarios_select_own
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY usuarios_update_own
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agendamentos_online'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.agendamentos_online', p.policyname);
  END LOOP;
END$$;

CREATE POLICY agendamentos_online_select_own
ON public.agendamentos_online
FOR SELECT
TO authenticated
USING (owner_user_id = auth.uid());

CREATE POLICY agendamentos_online_update_own
ON public.agendamentos_online
FOR UPDATE
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY agendamentos_online_delete_own
ON public.agendamentos_online
FOR DELETE
TO authenticated
USING (owner_user_id = auth.uid());

CREATE POLICY agendamentos_online_insert_public
ON public.agendamentos_online
FOR INSERT
TO anon
WITH CHECK (owner_user_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.buscar_horarios_com_multiplos_intervalos(
  data_selecionada date, 
  user_id_param uuid, 
  duracao_servico integer DEFAULT 30
)
RETURNS TABLE(horario time without time zone, disponivel boolean, bloqueio_motivo text)
LANGUAGE plpgsql
AS $function$
DECLARE
  config_horario RECORD;
  horario_atual time;
  horario_fim_servico time;
  dia_semana_param integer;
BEGIN
  dia_semana_param := EXTRACT(DOW FROM data_selecionada);
  
  SELECT * INTO config_horario
  FROM configuracoes_horarios
  WHERE user_id = user_id_param 
    AND dia_semana = dia_semana_param 
    AND ativo = true;
    
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  horario_atual := config_horario.horario_abertura;
  
  WHILE horario_atual + (duracao_servico || ' minutes')::interval <= config_horario.horario_fechamento LOOP
    horario_fim_servico := horario_atual + (duracao_servico || ' minutes')::interval;
    
    IF config_horario.intervalo_inicio IS NOT NULL 
       AND config_horario.intervalo_fim IS NOT NULL
       AND (
         (horario_atual >= config_horario.intervalo_inicio AND horario_atual < config_horario.intervalo_fim) OR
         (horario_fim_servico > config_horario.intervalo_inicio AND horario_fim_servico <= config_horario.intervalo_fim) OR
         (horario_atual < config_horario.intervalo_inicio AND horario_fim_servico > config_horario.intervalo_fim)
       ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Intervalo de almoço'::text;
    
    ELSIF EXISTS (
      SELECT 1 FROM intervalos_trabalho it
      WHERE it.user_id = user_id_param
        AND it.dia_semana = dia_semana_param
        AND it.ativo = true
        AND (
          (horario_atual >= it.hora_inicio AND horario_atual < it.hora_fim) OR
          (horario_fim_servico > it.hora_inicio AND horario_fim_servico <= it.hora_fim) OR
          (horario_atual < it.hora_inicio AND horario_fim_servico > it.hora_fim)
        )
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Intervalo personalizado'::text;
    
    ELSIF EXISTS (
      SELECT 1 FROM agendamentos a
      WHERE a.user_id = user_id_param
        AND a.data = data_selecionada
        AND a.status NOT IN ('cancelado', 'reagendado')
        AND (
          (horario_atual >= a.hora AND horario_atual < (a.hora + (a.duracao * interval '1 minute'))) OR
          (horario_fim_servico > a.hora AND horario_fim_servico <= (a.hora + (a.duracao * interval '1 minute'))) OR
          (horario_atual < a.hora AND horario_fim_servico > (a.hora + (a.duracao * interval '1 minute')))
        )
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Horário ocupado - agendamento regular'::text;
    
    ELSIF EXISTS (
      SELECT 1 FROM agendamentos_online ao
      WHERE ao.owner_user_id = user_id_param
        AND ao.data = data_selecionada
        AND ao.status IN ('pendente', 'confirmado')
        AND (
          (horario_atual >= ao.horario AND horario_atual < (ao.horario + (ao.duracao * interval '1 minute'))) OR
          (horario_fim_servico > ao.horario AND horario_fim_servico <= (ao.horario + (ao.duracao * interval '1 minute'))) OR
          (horario_atual < ao.horario AND horario_fim_servico > (ao.horario + (ao.duracao * interval '1 minute')))
        )
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Horário ocupado - agendamento online'::text;
    
    ELSE
      RETURN QUERY SELECT horario_atual, true, null::text;
    END IF;
    
    horario_atual := horario_atual + interval '30 minutes';
  END LOOP;
  
  RETURN;
END;
$function$;

COMMIT;
