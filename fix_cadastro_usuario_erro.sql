-- ==============================================================================
-- CORREÇÃO DE ERRO DE CADASTRO: "Database error saving new user"
--
-- O erro ocorre porque a função (trigger) que salva os dados do novo usuário
-- tenta salvar a preferência de tema (tema_preferencia), mas a tabela 'usuarios'
-- não possui essa coluna criada.
--
-- Execute este script no SQL Editor do Supabase para corrigir instantaneamente.
-- ==============================================================================

BEGIN;

-- 1. Adiciona a coluna que estava faltando na tabela usuarios
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS tema_preferencia TEXT DEFAULT 'feminino';

-- 2. Atualiza a trigger function caso ela tenha desincronizado
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insere perfil básico usando metadados do signup
  INSERT INTO public.usuarios (
    id,
    email,
    nome_completo,
    nome_personalizado_app,
    telefone,
    tema_preferencia
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''),
    COALESCE(NEW.raw_user_meta_data->>'nome_personalizado_app', 'Meu Salão'),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'tema_preferencia', 'feminino')
  );
  RETURN NEW;
END;
$$;

COMMIT;
