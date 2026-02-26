-- Criar tabela de categorias de produtos
CREATE TABLE IF NOT EXISTS public.categorias_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('revenda', 'uso_profissional', 'consumo')),
  cor TEXT DEFAULT '#94a3b8',
  icone TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, nome)
);

-- Adicionar coluna categoria_id na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_produtos(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_categorias_produtos_user_id ON public.categorias_produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON public.produtos(categoria_id);

-- RLS para categorias_produtos
ALTER TABLE public.categorias_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categorias"
  ON public.categorias_produtos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categorias"
  ON public.categorias_produtos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categorias"
  ON public.categorias_produtos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categorias"
  ON public.categorias_produtos FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_categorias_produtos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categorias_produtos_updated_at
  BEFORE UPDATE ON public.categorias_produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_categorias_produtos_updated_at();