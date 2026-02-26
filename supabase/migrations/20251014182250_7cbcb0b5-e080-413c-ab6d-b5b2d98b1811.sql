-- Adicionar data de início ao programa de fidelidade
ALTER TABLE programas_fidelidade 
ADD COLUMN data_inicio date DEFAULT CURRENT_DATE;

-- Criar tabela de classes/níveis de fidelidade personalizados
CREATE TABLE classes_fidelidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  pontos_minimos integer NOT NULL DEFAULT 0,
  cor text DEFAULT '#94a3b8',
  beneficios text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, nome)
);

-- RLS para classes_fidelidade
ALTER TABLE classes_fidelidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own fidelity classes"
ON classes_fidelidade
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Adicionar referência de classe às recompensas
ALTER TABLE recompensas
ADD COLUMN classe_id uuid REFERENCES classes_fidelidade(id) ON DELETE SET NULL;

-- Trigger para updated_at
CREATE TRIGGER update_classes_fidelidade_updated_at
BEFORE UPDATE ON classes_fidelidade
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();