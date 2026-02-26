-- Criar tabelas para sistema de auditoria

-- Tabela para armazenar relatórios de auditoria
CREATE TABLE public.relatorios_auditoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_execucao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_problemas INTEGER NOT NULL DEFAULT 0,
  problemas_criticos INTEGER NOT NULL DEFAULT 0,
  problemas_altos INTEGER NOT NULL DEFAULT 0,
  problemas_medios INTEGER NOT NULL DEFAULT 0,
  problemas_baixos INTEGER NOT NULL DEFAULT 0,
  estatisticas JSONB NOT NULL DEFAULT '{}',
  sugestoes_melhorias TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para armazenar problemas detectados na auditoria
CREATE TABLE public.problemas_auditoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_id UUID NOT NULL REFERENCES public.relatorios_auditoria(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('critico', 'alto', 'medio', 'baixo')),
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  campo TEXT,
  valor_atual TEXT,
  valor_esperado TEXT,
  sugestao TEXT,
  resolvido BOOLEAN NOT NULL DEFAULT false,
  data_resolucao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para logs do sistema
CREATE TABLE public.logs_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  nivel TEXT NOT NULL CHECK (nivel IN ('info', 'warning', 'error', 'debug')),
  categoria TEXT NOT NULL,
  acao TEXT NOT NULL,
  descricao TEXT NOT NULL,
  entidade_tipo TEXT,
  entidade_id TEXT,
  metadados JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_relatorios_auditoria_user_id ON public.relatorios_auditoria(user_id);
CREATE INDEX idx_relatorios_auditoria_data_execucao ON public.relatorios_auditoria(data_execucao);

CREATE INDEX idx_problemas_auditoria_relatorio_id ON public.problemas_auditoria(relatorio_id);
CREATE INDEX idx_problemas_auditoria_user_id ON public.problemas_auditoria(user_id);
CREATE INDEX idx_problemas_auditoria_categoria ON public.problemas_auditoria(categoria);
CREATE INDEX idx_problemas_auditoria_resolvido ON public.problemas_auditoria(resolvido);

CREATE INDEX idx_logs_sistema_user_id ON public.logs_sistema(user_id);
CREATE INDEX idx_logs_sistema_nivel ON public.logs_sistema(nivel);
CREATE INDEX idx_logs_sistema_categoria ON public.logs_sistema(categoria);
CREATE INDEX idx_logs_sistema_created_at ON public.logs_sistema(created_at);
CREATE INDEX idx_logs_sistema_entidade ON public.logs_sistema(entidade_tipo, entidade_id);

-- RLS Policies
ALTER TABLE public.relatorios_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problemas_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas para relatorios_auditoria
CREATE POLICY "Users can view their own audit reports" 
ON public.relatorios_auditoria 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audit reports" 
ON public.relatorios_auditoria 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audit reports" 
ON public.relatorios_auditoria 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audit reports" 
ON public.relatorios_auditoria 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para problemas_auditoria
CREATE POLICY "Users can view their own audit problems" 
ON public.problemas_auditoria 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audit problems" 
ON public.problemas_auditoria 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audit problems" 
ON public.problemas_auditoria 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audit problems" 
ON public.problemas_auditoria 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para logs_sistema
CREATE POLICY "Users can view their own system logs" 
ON public.logs_sistema 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own system logs" 
ON public.logs_sistema 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Triggers para updated_at
CREATE TRIGGER update_relatorios_auditoria_updated_at
BEFORE UPDATE ON public.relatorios_auditoria
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_problemas_auditoria_updated_at
BEFORE UPDATE ON public.problemas_auditoria
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Configurar para real-time
ALTER TABLE public.relatorios_auditoria REPLICA IDENTITY FULL;
ALTER TABLE public.problemas_auditoria REPLICA IDENTITY FULL;
ALTER TABLE public.logs_sistema REPLICA IDENTITY FULL;