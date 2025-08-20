-- Melhorias na tabela configuracoes_horarios para controle total de horários
-- Adicionar campos para múltiplos intervalos e horários flexíveis

-- Criar tabela para múltiplos intervalos por dia
CREATE TABLE IF NOT EXISTS public.intervalos_trabalho (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  dia_semana integer NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS para intervalos de trabalho
ALTER TABLE public.intervalos_trabalho ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para intervalos de trabalho
CREATE POLICY "Users can create their own work intervals" 
ON public.intervalos_trabalho 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own work intervals" 
ON public.intervalos_trabalho 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own work intervals" 
ON public.intervalos_trabalho 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work intervals" 
ON public.intervalos_trabalho 
FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar colunas para horários mais flexíveis na tabela configuracoes_horarios
ALTER TABLE public.configuracoes_horarios 
ADD COLUMN IF NOT EXISTS permite_agendamento_fora_horario boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tempo_minimo_antecedencia integer DEFAULT 60, -- em minutos
ADD COLUMN IF NOT EXISTS tempo_maximo_antecedencia integer DEFAULT 4320; -- 3 dias em minutos

-- Trigger para atualizar updated_at nos intervalos de trabalho
CREATE TRIGGER update_intervalos_trabalho_updated_at
BEFORE UPDATE ON public.intervalos_trabalho
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para buscar horários disponíveis considerando múltiplos intervalos
CREATE OR REPLACE FUNCTION public.buscar_horarios_com_multiplos_intervalos(
  data_selecionada date,
  user_id_param uuid,
  duracao_servico integer DEFAULT 30
)
RETURNS TABLE(
  horario time without time zone,
  disponivel boolean,
  bloqueio_motivo text
)
LANGUAGE plpgsql
AS $function$
DECLARE
  config_horario RECORD;
  intervalo RECORD;
  agendamento RECORD;
  horario_atual time;
  horario_fim time;
  dia_semana_param integer;
BEGIN
  -- Obter dia da semana (0=domingo, 6=sábado)
  dia_semana_param := EXTRACT(DOW FROM data_selecionada);
  
  -- Buscar configuração de horário para o dia
  SELECT * INTO config_horario
  FROM configuracoes_horarios
  WHERE user_id = user_id_param 
    AND dia_semana = dia_semana_param 
    AND ativo = true;
    
  -- Se não há configuração, não há horários disponíveis
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Gerar horários de 30 em 30 minutos
  horario_atual := config_horario.horario_abertura;
  
  WHILE horario_atual + (duracao_servico || ' minutes')::interval <= config_horario.horario_fechamento LOOP
    horario_fim := horario_atual + (duracao_servico || ' minutes')::interval;
    
    -- Verificar se está em algum intervalo de almoço (da tabela original)
    IF config_horario.intervalo_inicio IS NOT NULL 
       AND config_horario.intervalo_fim IS NOT NULL
       AND (horario_atual >= config_horario.intervalo_inicio 
            AND horario_atual < config_horario.intervalo_fim) THEN
      RETURN QUERY SELECT horario_atual, false, 'Intervalo de almoço'::text;
    
    -- Verificar se está em algum intervalo personalizado
    ELSIF EXISTS (
      SELECT 1 FROM intervalos_trabalho it
      WHERE it.user_id = user_id_param
        AND it.dia_semana = dia_semana_param
        AND it.ativo = true
        AND horario_atual >= it.hora_inicio
        AND horario_atual < it.hora_fim
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Intervalo personalizado'::text;
    
    -- Verificar se já tem agendamento
    ELSIF EXISTS (
      SELECT 1 FROM agendamentos a
      WHERE a.user_id = user_id_param
        AND a.data = data_selecionada
        AND a.hora = horario_atual
        AND a.status NOT IN ('cancelado', 'reagendado')
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Horário ocupado'::text;
    
    -- Verificar agendamentos online
    ELSIF EXISTS (
      SELECT 1 FROM agendamentos_online ao
      WHERE ao.data = data_selecionada
        AND ao.horario = horario_atual
        AND ao.status IN ('pendente', 'confirmado')
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Agendamento online'::text;
    
    ELSE
      -- Horário disponível
      RETURN QUERY SELECT horario_atual, true, null::text;
    END IF;
    
    -- Avançar para próximo horário
    horario_atual := horario_atual + interval '30 minutes';
  END LOOP;
  
  RETURN;
END;
$function$;