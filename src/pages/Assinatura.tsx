import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Crown, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLogo } from '@/components/branding/AppLogo';
import { CheckoutForm } from '@/components/CheckoutForm';

export default function Assinatura() {
  const navigate = useNavigate();
  const { subscription, isSubscriptionLoading, checkSubscription, session } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subscription?.status === 'active') {
      navigate('/', { replace: true });
    }
  }, [subscription?.status, navigate]);

  const isActive = subscription?.status === 'active';

  const formatDate = useMemo(
    () => (value: string) => format(new Date(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    []
  );

  const resolveSubscriptionId = async () => {
    const stored = localStorage.getItem('asaasSubscriptionId');
    if (stored) return stored;

    const customerId = localStorage.getItem('asaasCustomerId');
    if (!customerId) return null;

    const resp = await fetch(`/api/subscriptions/${encodeURIComponent(customerId)}`, {
      headers: {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      }
    });
    const json: any = await resp.json().catch(() => null);
    if (!resp.ok) return null;

    const list = Array.isArray(json?.data) ? json.data : [];
    const active = list.find((s: any) => s?.status === 'ACTIVE' && typeof s?.id === 'string');
    if (active?.id) {
      localStorage.setItem('asaasSubscriptionId', active.id);
      return active.id;
    }
    return null;
  };

  const handleRefreshStatus = async () => {
    setLoading(true);
    try {
      await checkSubscription(session);
      toast.success('Status atualizado!');
    } catch (e) {
      toast.error('Erro ao verificar status');
      void e;
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!session) {
      toast.error('Você precisa estar logado');
      return;
    }

    const ok = window.confirm('Tem certeza que deseja cancelar sua assinatura?');
    if (!ok) return;

    setLoading(true);
    try {
      const subscriptionId = await resolveSubscriptionId();
      if (!subscriptionId) {
        toast.error('Não foi possível identificar sua assinatura.');
        return;
      }

      const resp = await fetch(`/api/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: 'DELETE',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        }
      });
      const json: any = await resp.json().catch(() => null);
      if (!resp.ok) {
        toast.error(json?.error || 'Falha ao cancelar assinatura');
        return;
      }

      localStorage.removeItem('asaasSubscriptionId');
      await checkSubscription(session);
      toast.success('Assinatura cancelada.');
    } catch (e) {
      toast.error('Erro ao cancelar assinatura');
      void e;
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-3">
            <AppLogo size={56} rounded="xl" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Assinatura
          </h1>
          <p className="text-muted-foreground text-lg">Pagamento recorrente via Asaas</p>
        </div>

        {isActive ? (
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-1">Plano Mensal Ativo</CardTitle>
                    <CardDescription className="text-base">Acesso completo às funcionalidades</CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                  <Check className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription?.subscription_end && (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Próxima cobrança</p>
                    <p className="font-semibold text-lg">{formatDate(subscription.subscription_end)}</p>
                  </div>
                  <Badge variant="outline" className="text-sm">R$ 49,90/mês</Badge>
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={handleRefreshStatus} variant="outline" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Verificar Status
                    </>
                  )}
                </Button>
                <Button onClick={handleCancelSubscription} disabled={loading} className="w-full">
                  Cancelar Assinatura
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 max-w-xl mx-auto">
            <CheckoutForm
              onSuccess={async () => {
                await checkSubscription(session);
                setTimeout(() => checkSubscription(session), 3000);
              }}
            />
            <Button onClick={handleRefreshStatus} variant="outline" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Já paguei, atualizar status
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
