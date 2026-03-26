import React, { useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Headphones, Loader2, Lock, LogOut, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { buildCaktoCheckoutUrl } from '@/lib/caktoCheckout';

export const PaywallScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session, usuario, logout } = useSupabaseAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleBuyAccess = async () => {
    const userId = session?.user?.id ?? null;
    const baseUrl = String(import.meta.env.VITE_CAKTO_CHECKOUT_VITALICIO_URL || '').trim();

    if (!userId) {
      toast.error('Você precisa estar logado para comprar o acesso.');
      return;
    }

    if (!baseUrl) {
      toast.error('Checkout vitalício não configurado.');
      return;
    }

    setIsRedirecting(true);
    try {
      const redirectUrl = `${window.location.origin}/payment/success`;
      const checkoutUrl = buildCaktoCheckoutUrl({
        baseUrl,
        sck: userId,
        name: usuario?.nome_completo ?? null,
        email: usuario?.email ?? null,
        phone: usuario?.telefone ?? null,
        redirectUrl,
      });
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      toast.error('Erro na conexão com o servidor.');
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container mx-auto py-10 px-4 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card/80 backdrop-blur p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Acesso Vitalício ao Salão de Bolso</h1>
                    <Badge variant="outline" className="gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      Sem mensalidades
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    Tenha o controle do seu salão em um só lugar: agenda, clientes, serviços e financeiro com uma experiência rápida e profissional.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[{
                      icon: Lock,
                      title: 'Pagamento seguro',
                      desc: 'Checkout hospedado pela Cakto.'
                    }, {
                      icon: ShieldCheck,
                      title: 'Acesso permanente',
                      desc: 'Você compra uma vez e usa sempre.'
                    }, {
                      icon: Headphones,
                      title: 'Suporte prioritário',
                      desc: 'Ajuda rápida quando precisar.'
                    }, {
                      icon: CreditCard,
                      title: 'Métodos flexíveis',
                      desc: 'Pix/cartão conforme disponível.'
                    }].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="rounded-xl border bg-background/60 p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold">{item.title}</div>
                              <div className="text-xs text-muted-foreground">{item.desc}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card/80 backdrop-blur p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Tudo que você libera no app</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  'Agenda com visão diária/semana',
                  'Agendamentos e clientes ilimitados',
                  'Serviços e preços organizados',
                  'Controle financeiro com relatórios',
                  'Marketing e auditoria no sistema',
                  'Acesso pelo celular e computador',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3 rounded-xl border bg-background/60 p-4">
                    <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 rounded-full p-1">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" strokeWidth={3} />
                    </div>
                    <div className="text-sm font-medium">{benefit}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-card/80 backdrop-blur p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Perguntas frequentes</h2>
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="faq-1">
                  <AccordionTrigger>O acesso é realmente vitalício?</AccordionTrigger>
                  <AccordionContent>
                    Sim. É uma licença com pagamento único. Após aprovado, seu usuário fica com acesso liberado.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2">
                  <AccordionTrigger>Como o pagamento é feito?</AccordionTrigger>
                  <AccordionContent>
                    Você é redirecionado para o checkout da Cakto. Lá você escolhe o método disponível (ex.: Pix/cartão) e finaliza com segurança.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3">
                  <AccordionTrigger>Preciso instalar algo?</AccordionTrigger>
                  <AccordionContent>
                    Não. Você pode usar direto no navegador e também instalar como aplicativo (PWA) no celular.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-4">
                  <AccordionTrigger>E se eu precisar de ajuda?</AccordionTrigger>
                  <AccordionContent>
                    Você terá suporte prioritário e orientações para configurar tudo do jeito certo.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="lg:sticky lg:top-6">
            <Card className="shadow-2xl border-primary/20">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Desbloquear acesso agora</CardTitle>
                <CardDescription>
                  Pagamento único para usar sempre.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-primary/5 p-4">
                  <div className="text-sm text-muted-foreground">Valor do acesso</div>
                  <div className="text-2xl font-extrabold text-primary">Consulte no checkout</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Checkout Cakto</span>
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Acesso permanente</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                  size="lg"
                  onClick={handleBuyAccess}
                  disabled={isRedirecting}
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Abrindo checkout...
                    </>
                  ) : (
                    'Comprar Acesso Vitalício'
                  )}
                </Button>

                <div className="text-xs text-muted-foreground">
                  Ao continuar, você concorda com os{' '}
                  <a className="text-primary underline underline-offset-4" href="/termos">Termos</a>
                  {' '}e a{' '}
                  <a className="text-primary underline underline-offset-4" href="/privacidade">Política de Privacidade</a>.
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  disabled={isSigningOut}
                  onClick={async () => {
                    setIsSigningOut(true);
                    try {
                      await logout();
                      navigate('/login', { replace: true });
                    } catch {
                      toast.error('Não foi possível sair da conta. Tente novamente.');
                    } finally {
                      setIsSigningOut(false);
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isSigningOut ? 'Saindo...' : 'Sair da conta'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
