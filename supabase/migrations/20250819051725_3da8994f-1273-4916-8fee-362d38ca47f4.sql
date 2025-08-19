-- Criar tabela para configurações de horários de funcionamento
CREATE TABLE public.configuracoes_horarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=domingo, 1=segunda, ..., 6=sábado
    ativo BOOLEAN NOT NULL DEFAULT true,
    horario_abertura TIME NOT NULL,
    horario_fechamento TIME NOT NULL,
    intervalo_inicio TIME,
    intervalo_fim TIME,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, dia_semana)
);

-- Criar tabela para configurações de notificações
CREATE TABLE public.configuracoes_notificacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    notificacoes_push BOOLEAN NOT NULL DEFAULT true,
    notificacoes_email BOOLEAN NOT NULL DEFAULT true,
    notificacoes_som BOOLEAN NOT NULL DEFAULT true,
    som_personalizado TEXT,
    lembrete_agendamento_minutos INTEGER NOT NULL DEFAULT 30,
    lembrete_vencimento_dias INTEGER NOT NULL DEFAULT 3,
    lembrete_contas_fixas_dias INTEGER NOT NULL DEFAULT 5,
    notificar_cancelamentos BOOLEAN NOT NULL DEFAULT true,
    notificar_reagendamentos BOOLEAN NOT NULL DEFAULT true,
    notificar_pagamentos BOOLEAN NOT NULL DEFAULT true,
    notificar_novos_agendamentos BOOLEAN NOT NULL DEFAULT true,
    horario_inicio_notificacoes TIME NOT NULL DEFAULT '08:00:00',
    horario_fim_notificacoes TIME NOT NULL DEFAULT '20:00:00',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Criar tabela para configurações de backup
CREATE TABLE public.configuracoes_backup (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    backup_automatico BOOLEAN NOT NULL DEFAULT false,
    frequencia_backup TEXT NOT NULL DEFAULT 'semanal' CHECK (frequencia_backup IN ('diario', 'semanal', 'mensal')),
    dia_backup INTEGER CHECK (dia_backup >= 1 AND dia_backup <= 31),
    hora_backup TIME NOT NULL DEFAULT '02:00:00',
    email_backup TEXT,
    incluir_clientes BOOLEAN NOT NULL DEFAULT true,
    incluir_agendamentos BOOLEAN NOT NULL DEFAULT true,
    incluir_servicos BOOLEAN NOT NULL DEFAULT true,
    incluir_financeiro BOOLEAN NOT NULL DEFAULT true,
    incluir_cronogramas BOOLEAN NOT NULL DEFAULT true,
    ultimo_backup TIMESTAMP WITH TIME ZONE,
    proximo_backup TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Habilitar Row Level Security
ALTER TABLE public.configuracoes_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_backup ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para configuracoes_horarios
CREATE POLICY "Users can view their own schedule configs" 
ON public.configuracoes_horarios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedule configs" 
ON public.configuracoes_horarios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule configs" 
ON public.configuracoes_horarios 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule configs" 
ON public.configuracoes_horarios 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar políticas RLS para configuracoes_notificacoes
CREATE POLICY "Users can view their own notification configs" 
ON public.configuracoes_notificacoes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification configs" 
ON public.configuracoes_notificacoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification configs" 
ON public.configuracoes_notificacoes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification configs" 
ON public.configuracoes_notificacoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar políticas RLS para configuracoes_backup
CREATE POLICY "Users can view their own backup configs" 
ON public.configuracoes_backup 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backup configs" 
ON public.configuracoes_backup 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup configs" 
ON public.configuracoes_backup 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backup configs" 
ON public.configuracoes_backup 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar triggers para updated_at
CREATE TRIGGER update_configuracoes_horarios_updated_at
    BEFORE UPDATE ON public.configuracoes_horarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_notificacoes_updated_at
    BEFORE UPDATE ON public.configuracoes_notificacoes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_backup_updated_at
    BEFORE UPDATE ON public.configuracoes_backup
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_configuracoes_horarios_user_id ON public.configuracoes_horarios(user_id);
CREATE INDEX idx_configuracoes_horarios_dia_semana ON public.configuracoes_horarios(dia_semana);
CREATE INDEX idx_configuracoes_notificacoes_user_id ON public.configuracoes_notificacoes(user_id);
CREATE INDEX idx_configuracoes_backup_user_id ON public.configuracoes_backup(user_id);

-- Habilitar real-time updates
ALTER TABLE public.configuracoes_horarios REPLICA IDENTITY FULL;
ALTER TABLE public.configuracoes_notificacoes REPLICA IDENTITY FULL;
ALTER TABLE public.configuracoes_backup REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes_horarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes_notificacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes_backup;