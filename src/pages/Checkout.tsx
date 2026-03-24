import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { buildCaktoCheckoutUrl } from '@/lib/caktoCheckout';

export default function Checkout() {
  const navigate = useNavigate();
  const [vitalicioConsent, setVitalicioConsent] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { isAuthenticated, session, usuario } = useSupabaseAuth();

  const resumo = useMemo(() => {
    return 'Plano Vitalício — pagamento único via Cakto';
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
          <CardHeader>
            <CardTitle className="text-2xl">Finalizar Compra</CardTitle>
            <CardDescription className="text-lg font-medium text-foreground">{resumo}</CardDescription>
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
                ℹ️ O plano vitalício não possui cobranças futuras. Em caso de arrependimento,
                entre em contato em até 7 dias: <span className="font-medium">resellr7@gmail.com</span> |{' '}
                <span className="font-medium">(33) 99854-2100</span>
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
                Li e concordo que estou adquirindo uma licença vitalícia e confirmo estar ciente das políticas de reembolso em até 7 dias.
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
                  Gerando checkout...
                </>
              ) : (
                'Ir para o pagamento seguro'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

