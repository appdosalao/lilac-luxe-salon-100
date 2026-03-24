import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { usePaidAccess } from '@/hooks/usePaidAccess';

export default function Assinatura() {
  const navigate = useNavigate();
  const { usuario, refreshProfile } = useSupabaseAuth();
  const { isPaid, isLoading: isPaidLoading } = usePaidAccess();
  const [loading, setLoading] = useState(false);

  const statusLabel = useMemo(() => {
    if (isPaidLoading) return 'Verificando...';
    if (isPaid) return 'Acesso Vitalício Ativo';
    
    // Fallback para assinaturas legadas (mantido por segurança)
    const subscriptionStatus = usuario?.subscription_status ?? null;
    const trialStart = typeof usuario?.trial_start_date === 'string' ? new Date(usuario.trial_start_date).getTime() : null;
    const trialValid =
      subscriptionStatus === 'trial' &&
      typeof trialStart === 'number' &&
      Number.isFinite(trialStart) &&
      Date.now() < trialStart + 7 * 24 * 60 * 60 * 1000;

    if (subscriptionStatus === 'active') return 'Ativo';
    if (trialValid) return 'Em teste';
    return 'Inativo / Pendente';
  }, [usuario, isPaid, isPaidLoading]);

  const planLabel = useMemo(() => {
    if (isPaid) return 'Vitalício (Acesso Permanente)';
    
    // Fallback legado
    if (usuario?.plan_type === 'mensal') return 'Mensal';
    if (usuario?.plan_type === 'vitalicio') return 'Vitalício (Legado)';
    return 'Nenhum plano ativo';
  }, [usuario?.plan_type, isPaid]);

  const refresh = async () => {
    setLoading(true);
    try {
      await refreshProfile();
      // O usePaidAccess atualizará automaticamente através do token
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
        <Card className="shadow-xl border-primary/10">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Plano e Assinatura</CardTitle>
                  <CardDescription>Confira seu status de acesso ao sistema</CardDescription>
                </div>
              </div>
              <Badge variant={isPaid ? "default" : "outline"} className={isPaid ? "bg-green-600 hover:bg-green-700" : ""}>
                {statusLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
              <div className="text-sm text-muted-foreground mb-1 sm:mb-0">Plano atual</div>
              <div className="text-sm font-semibold">{planLabel}</div>
            </div>

            {!isPaid && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-primary mb-2">Acesso Vitalício Disponível</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adquira o acesso vitalício com pagamento único e garanta o Salão de Bolso para sempre, sem mensalidades.
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Button 
                onClick={() => navigate('/planos')} 
                className="w-full h-11"
                variant={isPaid ? "outline" : "default"}
                disabled={isPaid}
              >
                {isPaid ? 'Acesso Vitalício Adquirido' : 'Adquirir Acesso Vitalício'}
              </Button>
              <Button onClick={() => void refresh()} variant="outline" disabled={loading || isPaidLoading} className="w-full h-11 gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Verificando...' : 'Atualizar Status'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

