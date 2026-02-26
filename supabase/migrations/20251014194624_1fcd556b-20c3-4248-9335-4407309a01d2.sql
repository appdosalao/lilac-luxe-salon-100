-- Adicionar campo para preferência de tema na tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN tema_preferencia text DEFAULT 'feminino' CHECK (tema_preferencia IN ('feminino', 'masculino'));

COMMENT ON COLUMN public.usuarios.tema_preferencia IS 'Preferência de esquema de cores do usuário';