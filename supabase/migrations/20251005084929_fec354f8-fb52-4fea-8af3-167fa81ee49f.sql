-- Criação das tabelas para o módulo de Marketing

-- Tabela de Programas de Fidelidade
CREATE TABLE public.programas_fidelidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  pontos_por_real NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  valor_ponto NUMERIC(10,2) NOT NULL DEFAULT 0.10,
  pontos_minimos_resgate INTEGER NOT NULL DEFAULT 100,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  regras JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Pontos de Clientes
CREATE TABLE public.pontos_fidelidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  programa_id UUID NOT NULL REFERENCES public.programas_fidelidade(id) ON DELETE CASCADE,
  pontos_totais INTEGER NOT NULL DEFAULT 0,
  pontos_disponiveis INTEGER NOT NULL DEFAULT 0,
  pontos_resgatados INTEGER NOT NULL DEFAULT 0,
  nivel TEXT DEFAULT 'bronze',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, programa_id)
);

-- Tabela de Histórico de Pontos
CREATE TABLE public.historico_pontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  programa_id UUID NOT NULL REFERENCES public.programas_fidelidade(id) ON DELETE CASCADE,
  pontos INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ganho', 'resgate', 'expiracao', 'ajuste')),
  descricao TEXT NOT NULL,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Campanhas de Marketing
CREATE TABLE public.campanhas_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('email', 'sms', 'whatsapp', 'notificacao')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendada', 'enviando', 'concluida', 'cancelada')),
  segmento_clientes TEXT NOT NULL CHECK (segmento_clientes IN ('todos', 'ativos', 'inativos', 'aniversariantes', 'fidelidade', 'personalizado')),
  filtros JSONB DEFAULT '{}',
  mensagem TEXT NOT NULL,
  data_agendamento TIMESTAMPTZ,
  data_envio TIMESTAMPTZ,
  total_destinatarios INTEGER DEFAULT 0,
  total_enviados INTEGER DEFAULT 0,
  total_erros INTEGER DEFAULT 0,
  metricas JSONB DEFAULT '{"aberturas": 0, "cliques": 0, "conversoes": 0}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Destinatários de Campanhas
CREATE TABLE public.destinatarios_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES public.campanhas_marketing(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'erro', 'aberto', 'clicado')),
  data_envio TIMESTAMPTZ,
  data_abertura TIMESTAMPTZ,
  data_clique TIMESTAMPTZ,
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Automações de Marketing
CREATE TABLE public.automacoes_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  gatilho TEXT NOT NULL CHECK (gatilho IN ('novo_agendamento', 'agendamento_confirmado', 'agendamento_cancelado', 'aniversario', 'ausencia_dias', 'primeira_visita', 'fidelidade_nivel')),
  condicoes JSONB DEFAULT '{}',
  acoes JSONB NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  total_execucoes INTEGER DEFAULT 0,
  ultima_execucao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Log de Automações
CREATE TABLE public.log_automacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automacao_id UUID NOT NULL REFERENCES public.automacoes_marketing(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('sucesso', 'erro', 'ignorado')),
  mensagem TEXT,
  dados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para Performance
CREATE INDEX idx_pontos_fidelidade_cliente ON public.pontos_fidelidade(cliente_id);
CREATE INDEX idx_pontos_fidelidade_programa ON public.pontos_fidelidade(programa_id);
CREATE INDEX idx_historico_pontos_cliente ON public.historico_pontos(cliente_id);
CREATE INDEX idx_historico_pontos_data ON public.historico_pontos(created_at DESC);
CREATE INDEX idx_campanhas_status ON public.campanhas_marketing(status);
CREATE INDEX idx_campanhas_data_agendamento ON public.campanhas_marketing(data_agendamento);
CREATE INDEX idx_destinatarios_campanha ON public.destinatarios_campanha(campanha_id);
CREATE INDEX idx_destinatarios_status ON public.destinatarios_campanha(status);
CREATE INDEX idx_automacoes_gatilho ON public.automacoes_marketing(gatilho) WHERE ativo = true;

-- RLS Policies
ALTER TABLE public.programas_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_pontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinatarios_campanha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automacoes_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_automacoes ENABLE ROW LEVEL SECURITY;

-- Policies para programas_fidelidade
CREATE POLICY "Users manage own loyalty programs" ON public.programas_fidelidade FOR ALL USING (auth.uid() = user_id);

-- Policies para pontos_fidelidade
CREATE POLICY "Users manage own loyalty points" ON public.pontos_fidelidade FOR ALL USING (auth.uid() = user_id);

-- Policies para historico_pontos
CREATE POLICY "Users view own points history" ON public.historico_pontos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own points history" ON public.historico_pontos FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies para campanhas_marketing
CREATE POLICY "Users manage own campaigns" ON public.campanhas_marketing FOR ALL USING (auth.uid() = user_id);

-- Policies para destinatarios_campanha
CREATE POLICY "Users manage own campaign recipients" ON public.destinatarios_campanha FOR ALL 
USING (EXISTS (SELECT 1 FROM public.campanhas_marketing WHERE id = campanha_id AND user_id = auth.uid()));

-- Policies para automacoes_marketing
CREATE POLICY "Users manage own automations" ON public.automacoes_marketing FOR ALL USING (auth.uid() = user_id);

-- Policies para log_automacoes
CREATE POLICY "Users view own automation logs" ON public.log_automacoes FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.automacoes_marketing WHERE id = automacao_id AND user_id = auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_programas_fidelidade_updated_at BEFORE UPDATE ON public.programas_fidelidade
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pontos_fidelidade_updated_at BEFORE UPDATE ON public.pontos_fidelidade
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campanhas_marketing_updated_at BEFORE UPDATE ON public.campanhas_marketing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automacoes_marketing_updated_at BEFORE UPDATE ON public.automacoes_marketing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();