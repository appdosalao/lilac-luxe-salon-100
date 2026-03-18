import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

type PlanoSelecionado = 'mensal' | 'vitalicio';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vitalicioConsent, setVitalicioConsent] = useState(false);
  const { isAuthenticated, user, usuario } = useSupabaseAuth();

  const plano = (location.state as any)?.plano as PlanoSelecionado | undefined;

  const resumo = useMemo(() => {
    if (plano === 'mensal') return 'Plano Mensal — R$ 20,00/mês';
    if (plano === 'vitalicio') return 'Plano Vitalício — R$ 350,00 (pagamento único)';
    return null;
  }, [plano]);

  if (!plano || !resumo) {
    navigate('/planos', { replace: true });
    return null;
  }

  const redirectToCakto = () => {
    if (!isAuthenticated || !user?.id || !usuario) {
      toast.error('Faça login para continuar');
      navigate('/login');
      return;
    }

    if (plano === 'vitalicio' && !vitalicioConsent) {
      toast.error('Confirme o termo do plano vitalício para continuar');
      return;
    }

    const baseUrl =
      plano === 'mensal'
        ? (import.meta.env.VITE_CAKTO_CHECKOUT_MENSAL_URL as string | undefined)
        : (import.meta.env.VITE_CAKTO_CHECKOUT_VITALICIO_URL as string | undefined);

    if (!baseUrl) {
      toast.error('Checkout não configurado');
      return;
    }

    const checkoutUrl = new URL(baseUrl);
    checkoutUrl.searchParams.set('sck', user.id);

    if (usuario.nome_completo) {
      checkoutUrl.searchParams.set('name', usuario.nome_completo);
    }

    if (usuario.email) {
      checkoutUrl.searchParams.set('email', usuario.email);
      checkoutUrl.searchParams.set('confirmEmail', usuario.email);
    }

    if (usuario.telefone) {
      const digits = usuario.telefone.replace(/\D/g, '');
      const normalized = digits.startsWith('55') ? digits : `55${digits}`;
      checkoutUrl.searchParams.set('phone', normalized);
    }

    window.location.assign(checkoutUrl.toString());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-10 px-4 max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button variant="ghost" className="gap-2" onClick={() => navigate('/planos')}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="text-sm text-muted-foreground">Checkout</div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Ativar seu plano</CardTitle>
            <CardDescription>{resumo}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuthenticated ? (
              <Alert>
                <AlertDescription className="text-sm">
                  Para continuar para o pagamento, faça login (ou crie sua conta).
                </AlertDescription>
              </Alert>
            ) : null}

            {plano === 'vitalicio' && (
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertDescription className="text-sm">
                  ℹ️ O plano vitalício não permite cancelamento ou estorno pelo app. Em caso de arrependimento,
                  entre em contato em até 7 dias: <span className="font-medium">resellr7@gmail.com</span> |{' '}
                  <span className="font-medium">(33) 99854-2100</span>
                </AlertDescription>
              </Alert>
            )}

            {plano === 'vitalicio' && (
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Checkbox
                  id="vitalicio-consent"
                  checked={vitalicioConsent}
                  onCheckedChange={(v) => setVitalicioConsent(Boolean(v))}
                />
                <label htmlFor="vitalicio-consent" className="text-sm leading-snug cursor-pointer">
                  Li e concordo que o plano vitalício não permite cancelamento pelo app
                </label>
              </div>
            )}

            <Button onClick={redirectToCakto} className="w-full h-12 text-base font-semibold">
              Ir para o pagamento
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

