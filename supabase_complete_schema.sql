-- ==========================================
-- SCHEMA COMPLETO PARA SISTEMA DE AGENDAMENTO
-- ==========================================
-- Execute este script no SQL Editor do Supabase
-- Versão otimizada e organizada

-- ==========================================
-- 1. EXTENSÕES E CONFIGURAÇÕES
-- ==========================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. TABELAS PRINCIPAIS
-- ==========================================

-- Tabela de usuários (profissionais/proprietários)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    nome_completo TEXT NOT NULL,
    nome_personalizado_app TEXT DEFAULT 'Meu Salão',
    telefone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    nome_completo TEXT,
    email TEXT,
    telefone TEXT,
    servico_frequente TEXT,
    ultima_visita TIMESTAMPTZ,
    observacoes TEXT,
    historico_servicos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS servicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL,
    duracao INTEGER NOT NULL, -- em minutos
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
    servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
    cliente_nome TEXT NOT NULL,
    servico_nome TEXT NOT NULL,
    data TEXT NOT NULL, -- formato YYYY-MM-DD
    hora TEXT NOT NULL, -- formato HH:MM
    data_hora TIMESTAMPTZ NOT NULL, -- campo combinado para queries
    duracao INTEGER NOT NULL, -- em minutos
    valor DECIMAL(10,2) NOT NULL,
    valor_pago DECIMAL(10,2) DEFAULT 0,
    valor_devido DECIMAL(10,2) DEFAULT 0,
    forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'cartao', 'pix', 'fiado')) DEFAULT 'dinheiro',
    status_pagamento TEXT CHECK (status_pagamento IN ('pago', 'parcial', 'em_aberto')) DEFAULT 'em_aberto',
    status TEXT CHECK (status IN ('agendado', 'concluido', 'cancelado')) DEFAULT 'agendado',
    observacoes TEXT,
    origem TEXT CHECK (origem IN ('manual', 'cronograma', 'online')) DEFAULT 'manual',
    origem_cronograma BOOLEAN DEFAULT FALSE,
    cronograma_id UUID,
    confirmado BOOLEAN DEFAULT FALSE,
    data_prevista_pagamento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. TABELAS DE CRONOGRAMA E RETORNOS
-- ==========================================

-- Tabela de cronogramas (agendamentos recorrentes)
CREATE TABLE IF NOT EXISTS cronogramas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
    servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
    cliente_nome TEXT NOT NULL,
    tipo_servico TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    duracao_minutos INTEGER NOT NULL,
    recorrencia TEXT CHECK (recorrencia IN ('Semanal', 'Quinzenal', 'Mensal', 'Personalizada')) NOT NULL,
    intervalo_dias INTEGER, -- Para recorrência personalizada
    observacoes TEXT,
    status TEXT CHECK (status IN ('ativo', 'cancelado', 'concluido')) DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de retornos (datas futuras dos cronogramas)
CREATE TABLE IF NOT EXISTS retornos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
    cronograma_id UUID REFERENCES cronogramas(id) ON DELETE CASCADE NOT NULL,
    data_retorno DATE NOT NULL,
    status TEXT CHECK (status IN ('Pendente', 'Realizado', 'Cancelado')) DEFAULT 'Pendente',
    agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. TABELAS FINANCEIRAS
-- ==========================================

-- Tabela de lançamentos financeiros
CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(10,2) NOT NULL,
    data DATE NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT,
    origem_id UUID, -- ID do agendamento ou conta fixa que gerou o lançamento
    origem_tipo TEXT CHECK (origem_tipo IN ('agendamento', 'conta_fixa', 'manual')),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de contas fixas
CREATE TABLE IF NOT EXISTS contas_fixas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento INTEGER CHECK (data_vencimento >= 1 AND data_vencimento <= 31) NOT NULL,
    categoria TEXT NOT NULL,
    status TEXT CHECK (status IN ('pago', 'em_aberto')) DEFAULT 'em_aberto',
    observacoes TEXT,
    repetir BOOLEAN DEFAULT TRUE,
    frequencia TEXT CHECK (frequencia IN ('mensal', 'trimestral', 'semestral', 'anual')) DEFAULT 'mensal',
    proximo_vencimento DATE,
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de categorias financeiras
CREATE TABLE IF NOT EXISTS categorias_financeiras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('receita', 'despesa', 'investimento')) NOT NULL,
    cor TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, nome)
);

-- ==========================================
-- 5. TABELAS DE CONFIGURAÇÃO E SISTEMA
-- ==========================================

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chave TEXT NOT NULL,
    valor TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, chave)
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
    lida BOOLEAN DEFAULT FALSE,
    data_agendamento TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS auditoria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    tabela TEXT,
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- Índices para serviços
CREATE INDEX IF NOT EXISTS idx_servicos_usuario_id ON servicos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_servicos_nome ON servicos USING gin(to_tsvector('portuguese', nome));

-- Índices para agendamentos
CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario_id ON agendamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_id ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_servico_id ON agendamentos(servico_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status_pagamento ON agendamentos(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_origem ON agendamentos(origem);

-- Índices para cronogramas
CREATE INDEX IF NOT EXISTS idx_cronogramas_usuario_id ON cronogramas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cronogramas_cliente_id ON cronogramas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cronogramas_status ON cronogramas(status);

-- Índices para retornos
CREATE INDEX IF NOT EXISTS idx_retornos_usuario_id ON retornos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_retornos_cronograma_id ON retornos(cronograma_id);
CREATE INDEX IF NOT EXISTS idx_retornos_data_retorno ON retornos(data_retorno);
CREATE INDEX IF NOT EXISTS idx_retornos_status ON retornos(status);

-- Índices para financeiro
CREATE INDEX IF NOT EXISTS idx_lancamentos_usuario_id ON lancamentos_financeiros(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos_financeiros(data);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON lancamentos_financeiros(tipo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_categoria ON lancamentos_financeiros(categoria);

-- Índices para contas fixas
CREATE INDEX IF NOT EXISTS idx_contas_fixas_usuario_id ON contas_fixas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contas_fixas_proximo_vencimento ON contas_fixas(proximo_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_fixas_status ON contas_fixas(status);

-- Índices para configurações
CREATE INDEX IF NOT EXISTS idx_configuracoes_usuario_chave ON configuracoes(usuario_id, chave);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data_agendamento ON notificacoes(data_agendamento);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria(created_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_acao ON auditoria(acao);

-- ==========================================
-- 7. FUNÇÕES E TRIGGERS
-- ==========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cronogramas_updated_at BEFORE UPDATE ON cronogramas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retornos_updated_at BEFORE UPDATE ON retornos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON lancamentos_financeiros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contas_fixas_updated_at BEFORE UPDATE ON contas_fixas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para inserir configurações padrão
CREATE OR REPLACE FUNCTION inserir_configuracoes_padrao()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO configuracoes (usuario_id, chave, valor) VALUES
    (NEW.id, 'horarios_expediente', '{"inicio": "08:00", "termino": "18:00"}'),
    (NEW.id, 'dias_ativos', '{"segunda": true, "terca": true, "quarta": true, "quinta": true, "sexta": true, "sabado": true, "domingo": false}'),
    (NEW.id, 'intervalo_almoco', '{"inicio": "12:00", "termino": "13:00"}'),
    (NEW.id, 'tempo_agendamento', '30'),
    (NEW.id, 'notificacoes_email', 'true'),
    (NEW.id, 'notificacoes_whatsapp', 'false'),
    (NEW.id, 'backup_automatico', 'true'),
    (NEW.id, 'tema_interface', 'light');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para configurações padrão
CREATE TRIGGER trigger_configuracoes_padrao
    AFTER INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION inserir_configuracoes_padrao();

-- Função para atualizar valor devido em agendamentos
CREATE OR REPLACE FUNCTION atualizar_valor_devido()
RETURNS TRIGGER AS $$
BEGIN
    NEW.valor_devido = NEW.valor - NEW.valor_pago;
    
    -- Atualizar status de pagamento baseado nos valores
    IF NEW.valor_pago = 0 THEN
        NEW.status_pagamento = 'em_aberto';
    ELSIF NEW.valor_pago >= NEW.valor THEN
        NEW.status_pagamento = 'pago';
    ELSE
        NEW.status_pagamento = 'parcial';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para valor devido
CREATE TRIGGER trigger_atualizar_valor_devido
    BEFORE INSERT OR UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_valor_devido();

-- ==========================================
-- 8. VIEWS ÚTEIS
-- ==========================================

-- View para resumo financeiro por usuário
CREATE OR REPLACE VIEW resumo_financeiro AS
SELECT 
    usuario_id,
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as total_entradas,
    SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as total_saidas,
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) as saldo_liquido,
    COUNT(*) as total_lancamentos
FROM lancamentos_financeiros
GROUP BY usuario_id;

-- View para agendamentos com informações completas
CREATE OR REPLACE VIEW agendamentos_completos AS
SELECT 
    a.*,
    c.nome as cliente_nome_completo,
    c.telefone as cliente_telefone,
    c.email as cliente_email,
    s.nome as servico_nome_completo,
    s.descricao as servico_descricao
FROM agendamentos a
LEFT JOIN clientes c ON a.cliente_id = c.id
LEFT JOIN servicos s ON a.servico_id = s.id;

-- View para cronogramas com retornos pendentes
CREATE OR REPLACE VIEW cronogramas_com_retornos AS
SELECT 
    c.*,
    COUNT(r.id) as retornos_pendentes,
    MIN(r.data_retorno) as proximo_retorno
FROM cronogramas c
LEFT JOIN retornos r ON c.id = r.cronograma_id AND r.status = 'Pendente'
WHERE c.status = 'ativo'
GROUP BY c.id;

-- ==========================================
-- 9. INSERIR CATEGORIAS FINANCEIRAS PADRÃO
-- ==========================================

-- Esta função será executada quando um usuário for criado
CREATE OR REPLACE FUNCTION inserir_categorias_padrao()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO categorias_financeiras (usuario_id, nome, tipo, cor) VALUES
    (NEW.id, 'Serviços Prestados', 'receita', '#10B981'),
    (NEW.id, 'Produtos Vendidos', 'receita', '#059669'),
    (NEW.id, 'Aluguel', 'despesa', '#EF4444'),
    (NEW.id, 'Energia Elétrica', 'despesa', '#F59E0B'),
    (NEW.id, 'Água', 'despesa', '#3B82F6'),
    (NEW.id, 'Internet', 'despesa', '#8B5CF6'),
    (NEW.id, 'Material de Trabalho', 'despesa', '#EC4899'),
    (NEW.id, 'Marketing', 'despesa', '#F97316'),
    (NEW.id, 'Equipamentos', 'investimento', '#06B6D4'),
    (NEW.id, 'Capacitação', 'investimento', '#84CC16');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para categorias padrão
CREATE TRIGGER trigger_categorias_padrao
    AFTER INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION inserir_categorias_padrao();

-- ==========================================
-- 10. COMENTÁRIOS FINAIS
-- ==========================================

/*
INSTRUÇÕES DE USO:

1. Execute este script completo no SQL Editor do Supabase
2. Em seguida, execute o arquivo de políticas RLS separadamente
3. Configure as políticas de autenticação no painel do Supabase
4. Teste as conexões com o aplicativo

FUNCIONALIDADES INCLUÍDAS:
- Sistema completo de agendamentos
- Gestão de clientes e serviços
- Cronogramas e retornos automáticos
- Controle financeiro completo
- Sistema de notificações
- Auditoria de ações
- Configurações personalizáveis
- Categorização financeira
- Views para relatórios
- Triggers automáticos
- Índices otimizados

PRÓXIMOS PASSOS:
1. Configurar RLS policies (arquivo separado)
2. Configurar autenticação
3. Configurar storage para arquivos (se necessário)
4. Configurar edge functions (se necessário)
*/