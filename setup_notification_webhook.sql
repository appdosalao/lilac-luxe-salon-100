-- Habilitar a extensão pg_net para fazer requisições HTTP
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Função para enviar notificação quando um agendamento online é criado
CREATE OR REPLACE FUNCTION public.handle_new_online_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
  project_url TEXT := 'https://dfwepnzwktjyhvfmpuxo.supabase.co/functions/v1/enviar-notificacao-push';
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmd2Vwbnp3a3RqeWh2Zm1wdXhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU3MTg3NCwiZXhwIjoyMDcxMTQ3ODc0fQ.ukNPT0N9hEgRaXONd-X8mVXK4o7Z8J9XRXQhhFozaX0';
  payload JSONB;
BEGIN
  -- Montar o payload para a Edge Function
  payload := jsonb_build_object(
    'userId', NEW.user_id,
    'tipo', 'novo_agendamento',
    'notification', jsonb_build_object(
      'title', 'Novo Agendamento Online!',
      'body', format('Cliente: %s agendou para %s às %s', NEW.nome_completo, to_char(NEW.data, 'DD/MM/YYYY'), NEW.horario),
      'icon', '/icons/icon-192x192.png',
      'badge', '/icons/icon-96x96.png',
      'tag', 'novo_agendamento',
      'data', jsonb_build_object(
        'agendamentoId', NEW.id,
        'url', '/agenda'
      )
    )
  );

  -- Enviar requisição POST para a Edge Function
  PERFORM net.http_post(
    url := project_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_new_online_appointment_notification ON public.agendamentos_online;

-- Criar trigger na tabela agendamentos_online
CREATE TRIGGER trigger_new_online_appointment_notification
AFTER INSERT ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_online_appointment_notification();

-- Comentário para o usuário:
-- Após rodar este script, você deve substituir 'YOUR_SERVICE_ROLE_KEY' pela chave real do seu projeto.
-- Você pode encontrar essa chave no Dashboard do Supabase em Project Settings > API > service_role (secret).
