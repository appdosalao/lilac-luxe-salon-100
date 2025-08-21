-- Sincronizar usuários autenticados com tabela de perfis públicos
INSERT INTO public.usuarios (id, email, nome_completo, nome_personalizado_app, telefone)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nome_completo', SPLIT_PART(au.email, '@', 1)) as nome_completo,
  COALESCE(au.raw_user_meta_data->>'nome_personalizado_app', 'Meu Salão') as nome_personalizado_app,
  COALESCE(au.raw_user_meta_data->>'telefone', '') as telefone
FROM auth.users au
LEFT JOIN public.usuarios u ON au.id = u.id
WHERE u.id IS NULL AND au.id IS NOT NULL;

-- Associar clientes de agendamentos online aos usuários corretos
UPDATE public.clientes 
SET user_id = (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = clientes.email 
  LIMIT 1
)
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
AND email IN (
  SELECT DISTINCT email 
  FROM auth.users
);

-- Criar configuração de horário padrão para usuários sem configuração
INSERT INTO configuracoes_horarios (user_id, dia_semana, horario_abertura, horario_fechamento, intervalo_inicio, intervalo_fim, ativo)
SELECT 
  u.id,
  generate_series(1, 6) as dia_semana, -- Segunda a sábado
  '08:00:00'::time as horario_abertura,
  '18:00:00'::time as horario_fechamento, 
  '12:00:00'::time as intervalo_inicio,
  '13:00:00'::time as intervalo_fim,
  true as ativo
FROM public.usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM configuracoes_horarios ch 
  WHERE ch.user_id = u.id
);

-- Atualizar agendamentos online órfãos para associá-los aos usuários corretos
UPDATE agendamentos_online 
SET status = 'pendente'
WHERE status = 'pendente' 
AND email IN (SELECT email FROM auth.users);