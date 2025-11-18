import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Crown, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Assinatura() {
  const navigate = useNavigate();
  const { subscription, isSubscriptionLoading, checkSubscription, session, user, setSubscription } = useSupabaseAuth();
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
  const isInTrial = subscription?.status === 'trial';
  const isExpired = subscription?.status === 'expired';
  const isActive = subscription?.status === 'active';
  const isInactive = subscription?.status === 'inactive';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Sua Assinatura
          </h1>
          <p className="text-muted-foreground text-lg">
            Gerencie seu plano e aproveite todos os recursos
          </p>
        </div>

        {(isSubscribed || isInTrial) ? (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-1">
                        {isInTrial ? 'Período de Teste Grátis' : 'Plano Premium Ativo'}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {isInTrial 
                          ? 'Aproveite todos os recursos sem custo'
                          : 'Acesso completo a todas as funcionalidades'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    <Check className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isInTrial && subscription.trial_end_date && (
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100 mb-1">
                          🎉 Teste Grátis Ativo
                        </h3>
                        <p className="text-blue-700 dark:text-blue-300 mb-3">
                          Você está aproveitando 7 dias de acesso gratuito a todos os recursos premium
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            Termina em: {format(new Date(subscription.trial_end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isInTrial && subscription.subscription_end && (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Próxima renovação</p>
                      <p className="font-semibold text-lg">
                        {format(new Date(subscription.subscription_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      R$ 20,00/mês
                    </Badge>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleManageSubscription} 
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Gerenciar Pagamento e Assinatura
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Atualize forma de pagamento, veja faturas ou cancele quando quiser
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recursos Incluídos</CardTitle>
                <CardDescription>Tudo que você tem acesso com seu plano</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-1 bg-primary/10 rounded">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Agendamentos ilimitados</p>
                      <p className="text-sm text-muted-foreground">Sem limites de quantidade</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-1 bg-primary/10 rounded">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Gerenciamento de clientes</p>
                      <p className="text-sm text-muted-foreground">Cadastro completo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-1 bg-primary/10 rounded">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Controle financeiro</p>
                      <p className="text-sm text-muted-foreground">Relatórios e análises</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-1 bg-primary/10 rounded">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Programa de fidelidade</p>
                      <p className="text-sm text-muted-foreground">Recompense seus clientes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-1 bg-primary/10 rounded">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Agendamento online</p>
                      <p className="text-sm text-muted-foreground">Link personalizado</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-1 bg-primary/10 rounded">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Notificações push</p>
                      <p className="text-sm text-muted-foreground">Nunca perca um compromisso</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : isExpired ? (
          <Card className="shadow-xl border-orange-200 dark:border-orange-900">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full w-fit">
                <Crown className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-3xl mb-2">Seu teste grátis terminou</CardTitle>
              <CardDescription className="text-base">
                Assine agora para continuar aproveitando todos os recursos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  R$ 20,00
                  <span className="text-xl font-normal text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground">Cobrado mensalmente</p>
              </div>

              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold text-center">O que você vai manter:</p>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Agendamentos ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Gerenciamento de clientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Controle financeiro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Agendamento online</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSubscribe} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    Assinar Plano Premium
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Cancele quando quiser, sem multas ou taxas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold mb-2">Escolha seu Plano</h2>
              <p className="text-muted-foreground">
                Experimente grátis por 7 dias ou assine agora
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Card Trial Grátis */}
              <Card className="relative overflow-hidden border-2 border-primary shadow-xl">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-bold rounded-bl-lg">
                  RECOMENDADO
                </div>
                <CardHeader className="pt-8">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-center">🎉 7 Dias Grátis</CardTitle>
                  <CardDescription className="text-center">
                    Experimente sem compromisso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      R$ 0,00
                    </div>
                    <p className="text-sm text-muted-foreground">
                      depois R$ 20,00/mês
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      'Acesso total por 7 dias',
                      'Sem cartão de crédito',
                      'Cancele quando quiser',
                      'Todas as funcionalidades'
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={async () => {
                      if (!session?.user) {
                        toast.error('Você precisa estar logado');
                        return;
                      }
                      setLoading(true);
                      try {
                        const now = new Date().toISOString();
                        
                        // 1. Atualizar banco
                        const { error } = await supabase
                          .from('usuarios')
                          .update({
                            trial_start_date: now,
                            subscription_status: 'trial',
                            trial_used: true
                          })
                          .eq('id', session.user.id);
                        
                        if (error) {
                          toast.error('Erro ao iniciar trial');
                          setLoading(false);
                          return;
                        }
                        
                        // 2. Calcular data de fim do trial
                        const trialEndDate = new Date(now);
                        trialEndDate.setDate(trialEndDate.getDate() + 7);
                        
                        // 3. Atualizar estado local DIRETAMENTE
                        setSubscription({
                          subscribed: true,
                          status: 'trial',
                          trial_days_remaining: 7,
                          trial_end_date: trialEndDate.toISOString()
                        });
                        
                        // 4. Mostrar sucesso
                        toast.success('🎉 Trial de 7 dias iniciado com sucesso!');
                        
                        // 5. Aguardar um momento para React processar o estado
                        await new Promise(resolve => setTimeout(resolve, 300));
                        
                        // 6. Navegar para home
                        navigate('/');
                      } catch (error) {
                        console.error(error);
                        toast.error('Erro ao iniciar trial');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full h-12 text-lg font-semibold"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Começar Teste Grátis
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Card Assinar Agora */}
              <Card className="shadow-xl">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-fit">
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-center">💳 Assinar Agora</CardTitle>
                  <CardDescription className="text-center">
                    Acesso imediato e completo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      R$ 20,00
                    </div>
                    <p className="text-sm text-muted-foreground">
                      por mês
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      'Agendamentos ilimitados',
                      'Gestão financeira completa',
                      'Programa de fidelidade',
                      'Suporte prioritário'
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSubscribe}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-12 text-lg font-semibold"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Assinar Agora
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Cobrança mensal automática. Cancele quando quiser.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
