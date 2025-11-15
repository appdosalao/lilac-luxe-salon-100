import { useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Assinatura() {
  const { subscription, isSubscriptionLoading, checkSubscription, session } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!session) {
      toast.error('Você precisa estar logado para assinar');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        toast.error('Erro ao criar sessão de checkout');
        console.error(error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        // Verificar assinatura após alguns segundos
        setTimeout(() => checkSubscription(), 3000);
      }
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) {
      toast.error('Você precisa estar logado');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        toast.error('Erro ao abrir portal de gerenciamento');
        console.error(error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir portal:', error);
      toast.error('Erro ao abrir portal de gerenciamento');
    } finally {
      setLoading(false);
    }
  };

  if (isSubscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isSubscribed = subscription?.subscribed;
  const inTrial = subscription?.trial_end && new Date(subscription.trial_end) > new Date();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Assinatura</h1>

      {isSubscribed ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Assinatura Ativa
            </CardTitle>
            <CardDescription>
              Você tem acesso completo ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inTrial && subscription.trial_end && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Período de teste grátis
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Seu teste grátis termina em {format(new Date(subscription.trial_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}

            {subscription.subscription_end && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Próxima renovação:{' '}
                  <span className="font-medium text-foreground">
                    {format(new Date(subscription.subscription_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </p>
              </div>
            )}

            <Button 
              onClick={handleManageSubscription} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Gerenciar Assinatura'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Plano Mensal</CardTitle>
            <CardDescription>
              Acesso completo ao sistema de agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-4xl font-bold">
              R$ 20,00
              <span className="text-lg font-normal text-muted-foreground">/mês</span>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="font-semibold text-green-900 dark:text-green-100">
                🎉 7 dias grátis para testar!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Cancele quando quiser, sem compromisso
              </p>
            </div>

            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Agendamentos ilimitados</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Gerenciamento de clientes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Controle financeiro completo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Programa de fidelidade</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Agendamento online</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Notificações push</span>
              </li>
            </ul>

            <Button 
              onClick={handleSubscribe} 
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Começar Teste Grátis'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Você não será cobrado durante o período de teste. Cancele quando quiser.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
