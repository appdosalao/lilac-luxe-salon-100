import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function Assinatura() {
  const navigate = useNavigate();
  const { usuario, refreshProfile } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);

  const statusLabel = useMemo(() => {
    const subscriptionStatus = usuario?.subscription_status ?? null;
    const trialStart = typeof usuario?.trial_start_date === 'string' ? new Date(usuario.trial_start_date).getTime() : null;
    const trialValid =
      subscriptionStatus === 'trial' &&
      typeof trialStart === 'number' &&
      Number.isFinite(trialStart) &&
      Date.now() < trialStart + 7 * 24 * 60 * 60 * 1000;

    if (subscriptionStatus === 'active') return 'Ativo';
    if (trialValid) return 'Em teste';
    if (subscriptionStatus === 'trial') return 'Expirado';
    if (subscriptionStatus === 'expired') return 'Expirado';
    if (subscriptionStatus === 'inactive') return 'Inativo';
    return 'Inativo';
  }, [usuario]);

  const planLabel = useMemo(() => {
    if (usuario?.plan_type === 'mensal') return 'Mensal';
    if (usuario?.plan_type === 'vitalicio') return 'Vitalício';
    return '—';
  }, [usuario?.plan_type]);

  const refresh = async () => {
    setLoading(true);
    try {
      await refreshProfile();
      toast.success('Status atualizado!');
    } catch {
      toast.error('Erro ao verificar status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Plano e Assinatura</CardTitle>
                  <CardDescription>Confira seu status e escolha um plano</CardDescription>
                </div>
              </div>
              <Badge variant="outline">{statusLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Plano atual</div>
              <div className="text-sm font-medium">{planLabel}</div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={() => navigate('/planos')} className="w-full">
                Escolher Plano
              </Button>
              <Button onClick={() => void refresh()} variant="outline" disabled={loading} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                {loading ? 'Verificando...' : 'Verificar Status'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

