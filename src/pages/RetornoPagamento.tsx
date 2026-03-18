import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

type Status = 'checking' | 'active' | 'pending' | 'unauthenticated';

export default function RetornoPagamento() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isAuthenticated, user, usuario, refreshProfile } = useSupabaseAuth();
  const [status, setStatus] = useState<Status>('checking');

  const hint = useMemo(() => {
    const raw = (params.get('status') || params.get('s') || '').toLowerCase();
    if (!raw) return null;
    if (raw.includes('paid') || raw.includes('approved') || raw.includes('success')) return 'success';
    if (raw.includes('pending') || raw.includes('waiting')) return 'pending';
    if (raw.includes('cancel') || raw.includes('fail')) return 'fail';
    return raw;
  }, [params]);

  const check = async () => {
    if (!isAuthenticated) {
      setStatus('unauthenticated');
      return;
    }

    await refreshProfile();

    const subscriptionStatusFromState = usuario?.subscription_status ?? null;
    if (subscriptionStatusFromState === 'active') {
      setStatus('active');
      return;
    }

    if (user?.id) {
      const { data } = await supabase
        .from('usuarios')
        .select('subscription_status')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.subscription_status === 'active') {
        setStatus('active');
        return;
      }
    }

    setStatus('pending');
  };

  useEffect(() => {
    void check();
  }, [isAuthenticated]);

  useEffect(() => {
    if (status !== 'pending') return;
    const interval = window.setInterval(() => {
      void check();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [status, isAuthenticated]);

  useEffect(() => {
    if (status !== 'active') return;
    const t = window.setTimeout(() => navigate('/', { replace: true }), 900);
    return () => window.clearTimeout(t);
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Retorno do Pagamento</CardTitle>
            <CardDescription>
              Quando a Cakto confirmar o pagamento, seu acesso será liberado automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hint ? (
              <Alert>
                <AlertDescription className="text-sm">Status informado pela Cakto: {hint}</AlertDescription>
              </Alert>
            ) : null}

            {status === 'unauthenticated' ? (
              <Alert>
                <AlertDescription className="text-sm">
                  Faça login para vincular o pagamento à sua conta.
                </AlertDescription>
              </Alert>
            ) : null}

            {status === 'checking' ? (
              <div className="text-sm text-muted-foreground">Verificando seu acesso...</div>
            ) : null}

            {status === 'pending' ? (
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertDescription className="text-sm">
                  Pagamento ainda não confirmado. Se você pagou via Pix/boleto, pode levar alguns instantes.
                  Esta página atualiza automaticamente.
                </AlertDescription>
              </Alert>
            ) : null}

            {status === 'active' ? (
              <Alert className="border-green-600/30 bg-green-600/10">
                <AlertDescription className="text-sm">Pagamento confirmado! Redirecionando para o app...</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant={status === 'unauthenticated' ? 'default' : 'outline'}
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Login
              </Button>
              <Button onClick={() => void check()} className="w-full">
                Atualizar status
              </Button>
            </div>

            <Button variant="ghost" onClick={() => navigate('/planos')} className="w-full">
              Escolher plano
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

