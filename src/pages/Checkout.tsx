import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { buildCaktoCheckoutUrl } from '@/lib/caktoCheckout';

export default function Checkout() {
  const navigate = useNavigate();
  const [vitalicioConsent, setVitalicioConsent] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { isAuthenticated, session, usuario } = useSupabaseAuth();

  const resumo = useMemo(() => {
    return 'Acesso vitalício (pagamento único)';
  }, []);

  const redirectToCakto = async () => {
    const userId = session?.user?.id ?? null;
    const baseUrl = String(import.meta.env.VITE_CAKTO_CHECKOUT_VITALICIO_URL || '').trim();

    if (!isAuthenticated || !userId || !usuario) {
      toast.error('Faça login para continuar');
      navigate('/login');
      return;
    }

    if (!baseUrl) {
      toast.error('Checkout vitalício não configurado');
      return;
    }

    if (!vitalicioConsent) {
      toast.error('Confirme o termo do plano vitalício para continuar');
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
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-10 px-4 max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button variant="ghost" className="gap-2" onClick={() => navigate('/planos')}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="text-sm text-muted-foreground">Checkout Seguro</div>
        </div>

        <Card className="shadow-xl border-primary/20">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Finalizar Compra</CardTitle>
                <CardDescription className="text-base">{resumo}</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3.5 w-3.5" />
                Checkout Cakto
              </Badge>
            </div>
            <div className="rounded-xl border bg-primary/5 p-4">
              <div className="text-sm text-muted-foreground">Você está adquirindo</div>
              <div className="mt-1 text-lg font-semibold">Licença vitalícia do Salão de Bolso</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  'Acesso completo e permanente ao app',
                  'Agendamentos e clientes ilimitados',
                  'Controle financeiro e relatórios',
                  'Atualizações futuras inclusas',
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2 text-sm">
                    <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 rounded-full p-1">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" strokeWidth={3} />
                    </div>
                    <span className="text-foreground/80">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isAuthenticated ? (
              <Alert variant="destructive">
                <AlertDescription className="text-sm font-medium">
                  Para continuar para o pagamento, faça login ou crie sua conta.
                </AlertDescription>
              </Alert>
            ) : null}

            <Alert className="border-yellow-500/30 bg-yellow-500/10">
              <AlertDescription className="text-sm">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Garantia legal de arrependimento: em até 7 dias você pode solicitar suporte.
                </span>
                <div className="mt-1">
                  Contato: <span className="font-medium">resellr7@gmail.com</span> |{' '}
                  <span className="font-medium">(33) 99854-2100</span>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex items-start gap-3 rounded-lg border p-4 bg-muted/30">
              <Checkbox
                id="vitalicio-consent"
                checked={vitalicioConsent}
                onCheckedChange={(v) => setVitalicioConsent(Boolean(v))}
                className="mt-1"
              />
              <label htmlFor="vitalicio-consent" className="text-sm leading-snug cursor-pointer font-medium">
                Li e concordo que estou adquirindo uma licença vitalícia e confirmo estar ciente das políticas de pagamento/reembolso.
              </label>
            </div>

            <Button 
              onClick={redirectToCakto} 
              className="w-full h-14 text-lg font-bold"
              disabled={isRedirecting || !vitalicioConsent}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Abrindo checkout...
                </>
              ) : (
                'Ir para o pagamento seguro'
              )}
            </Button>

            <div className="text-xs text-muted-foreground">
              Ao continuar, você concorda com os{' '}
              <a className="text-primary underline underline-offset-4" href="/termos">Termos</a>
              {' '}e a{' '}
              <a className="text-primary underline underline-offset-4" href="/privacidade">Política de Privacidade</a>.
            </div>

            <div className="rounded-xl border bg-card/50 p-4">
              <div className="text-sm font-semibold">Perguntas frequentes</div>
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="faq-1">
                  <AccordionTrigger>Como o acesso é liberado?</AccordionTrigger>
                  <AccordionContent>
                    Após a confirmação do pagamento pela Cakto, seu usuário é liberado automaticamente.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2">
                  <AccordionTrigger>Posso pagar no Pix ou cartão?</AccordionTrigger>
                  <AccordionContent>
                    Os métodos exibidos dependem do checkout configurado na Cakto. Você verá as opções disponíveis ao abrir o checkout.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3">
                  <AccordionTrigger>Vou ter atualizações futuras?</AccordionTrigger>
                  <AccordionContent>
                    Sim. O acesso vitalício inclui melhorias e atualizações do sistema.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

