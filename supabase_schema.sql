-- Schema SQL para criar todas as tabelas do sistema de agendamento
-- Execute este script no SQL Editor do Supabase

-- Tabela de usuários
CREATE TABLE usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    nome_completo TEXT NOT NULL,
    nome_personalizado_app TEXT DEFAULT 'Meu Salão',
    telefone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    nome_completo TEXT,
    nomeCompleto TEXT,
    email TEXT,
    telefone TEXT,
    servico_frequente TEXT,
    servicoFrequente TEXT,
    ultima_visita TIMESTAMP WITH TIME ZONE,
    ultimaVisita TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    historicoServicos JSONB DEFAULT '[]'::jsonb,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de serviços
CREATE TABLE servicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2),
    duracao INTEGER, -- em minutos
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
    clienteNome TEXT,
    servicoNome TEXT,
    data TEXT,
    hora TEXT,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    duracao INTEGER, -- em minutos
    valor DECIMAL(10,2),
    valor_pago DECIMAL(10,2) DEFAULT 0,
    valorPago DECIMAL(10,2) DEFAULT 0,
    valor_devido DECIMAL(10,2) DEFAULT 0,
    valorDevido DECIMAL(10,2) DEFAULT 0,
    forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'cartao', 'pix', 'fiado')),
    formaPagamento TEXT CHECK (formaPagamento IN ('dinheiro', 'cartao', 'pix', 'fiado')),
    status_pagamento TEXT CHECK (status_pagamento IN ('pago', 'parcial', 'em_aberto')) DEFAULT 'em_aberto',
    statusPagamento TEXT CHECK (statusPagamento IN ('pago', 'parcial', 'em_aberto')) DEFAULT 'em_aberto',
    status TEXT CHECK (status IN ('agendado', 'concluido', 'cancelado')) DEFAULT 'agendado',
    observacoes TEXT,
    origem TEXT CHECK (origem IN ('manual', 'cronograma', 'online')) DEFAULT 'manual',
    origem_cronograma BOOLEAN DEFAULT FALSE,
    cronogramaId UUID,
    confirmado BOOLEAN DEFAULT FALSE,
    dataPrevistaPagamento TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações
CREATE TABLE configuracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    chave TEXT NOT NULL,
    valor TEXT,
    atualizada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, chave)
);

-- Tabela de contas fixas
CREATE TABLE contas_fixas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2),
    vencimento_dia INTEGER CHECK (vencimento_dia >= 1 AND vencimento_dia <= 31),
    tipo TEXT CHECK (tipo IN ('despesa', 'receita')),
    ativa BOOLEAN DEFAULT TRUE
);

-- Tabela de lançamentos financeiros
CREATE TABLE financeiro (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(10,2),
    data DATE NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE notificacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de auditoria
CREATE TABLE auditoria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    detalhes TEXT,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de profissionais
CREATE TABLE profissionais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    especialidade TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_agendamentos_usuario_id ON agendamentos(usuario_id);
CREATE INDEX idx_agendamentos_cliente_id ON agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_data_hora ON agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX idx_servicos_usuario_id ON servicos(usuario_id);
CREATE INDEX idx_financeiro_usuario_id ON financeiro(usuario_id);
CREATE INDEX idx_financeiro_data ON financeiro(data);
CREATE INDEX idx_configuracoes_usuario_chave ON configuracoes(usuario_id, chave);

-- RLS (Row Level Security) - Habilitação
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (usuários só veem seus próprios dados)
CREATE POLICY "Usuários podem ver próprios dados" ON usuarios
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Usuários podem gerenciar próprios clientes" ON clientes
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem gerenciar próprios serviços" ON servicos
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem gerenciar próprios agendamentos" ON agendamentos
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem gerenciar próprias configurações" ON configuracoes
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem gerenciar próprias contas fixas" ON contas_fixas
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem gerenciar próprio financeiro" ON financeiro
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem gerenciar próprias notificações" ON notificacoes
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver própria auditoria" ON auditoria
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem gerenciar próprios profissionais" ON profissionais
    FOR ALL USING (auth.uid() = usuario_id);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para inserir configurações padrão para novos usuários
CREATE OR REPLACE FUNCTION inserir_configuracoes_padrao()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO configuracoes (usuario_id, chave, valor) VALUES
    (NEW.id, 'horarios_expediente', '{"inicio": "08:00", "termino": "18:00"}'),
    (NEW.id, 'dias_ativos', '{"segunda": true, "terca": true, "quarta": true, "quinta": true, "sexta": true, "sabado": true, "domingo": false}'),
    (NEW.id, 'intervalo_almoco', '{"inicio": "12:00", "termino": "13:00"}'),
    (NEW.id, 'tempo_agendamento', '30'),
    (NEW.id, 'notificacoes_email', 'true'),
    (NEW.id, 'notificacoes_whatsapp', 'false');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar configurações padrão para novos usuários
CREATE TRIGGER trigger_configuracoes_padrao
    AFTER INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION inserir_configuracoes_padrao();