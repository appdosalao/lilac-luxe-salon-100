-- Atualizar o status da usuária para 'trial' e garantir que a data de início seja recente
-- para que ela tenha acesso aos 7 dias gratuitos.
UPDATE public.usuarios
SET 
  subscription_status = 'trial',
  trial_start_date = NOW(),
  trial_used = false
WHERE email = 'izabellaroberta42@gmail.com';

-- Verificar se a atualização funcionou
SELECT email, subscription_status, trial_start_date 
FROM public.usuarios 
WHERE email = 'izabellaroberta42@gmail.com';
