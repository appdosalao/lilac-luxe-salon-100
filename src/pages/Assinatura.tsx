import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { usePaidAccess } from '@/hooks/usePaidAccess';

export default function Assinatura() {
  const navigate = useNavigate();
  const { usuario, refreshProfile } = useSupabaseAuth();
  const { isPaid, isLoading: isPaidLoading, refetch } = usePaidAccess();
  const [loading, setLoading] = useState(false);

  const trialStart = typeof usuario?.trial_start_date === 'string' ? new Date(usuario.trial_start_date) : null;
  const trialStartMs = trialStart ? trialStart.getTime() : null;
  const nowMs = Date.now();
  const trialValid =
    usuario?.subscription_status === 'trial' &&
    typeof trialStartMs === 'number' &&
    Number.isFinite(trialStartMs) &&
    nowMs < trialStartMs + 7 * 24 * 60 * 60 * 1000;
  const trialEndMs = typeof trialStartMs === 'number' && Number.isFinite(trialStartMs) ? trialStartMs + 7 * 24 * 60 * 60 * 1000 : null;
  const trialRemainingDays =
    typeof trialEndMs === 'number' && Number.isFinite(trialEndMs)
      ? Math.max(0, Math.ceil((trialEndMs - nowMs) / (1000 * 60 * 60 * 24)))
      : null;

  const formatDate = (value: string | Date | null | undefined) => {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(d.getTime())) return '—';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
  };

  const statusLabel = useMemo(() => {
    if (isPaidLoading) return 'Verificando...';
    if (isPaid) return 'Acesso Vitalício Ativo';
    if (trialValid) return `Teste grátis ativo — ${trialRemainingDays ?? 0} dia(s) restante(s)`;
    if (usuario?.subscription_status === 'trial') return 'Teste grátis expirado — acesso pendente';
    return 'Acesso pendente';
  }, [isPaid, isPaidLoading, trialValid, trialRemainingDays, usuario?.subscription_status]);

  const planLabel = useMemo(() => {
    return isPaid ? 'Vitalício (Acesso Permanente)' : 'Teste grátis (7 dias)';
  }, [isPaid]);

  const refresh = async () => {
    setLoading(true);
    try {
      await refreshProfile();
      await refetch?.();
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="text-sm text-muted-foreground">Plano atual</div>
                <div className="text-sm font-semibold">{planLabel}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="text-sm text-muted-foreground">Liberação</div>
                <div className="text-sm font-semibold">{isPaid ? formatDate(usuario?.paid_at) : trialValid ? formatDate(new Date(trialEndMs ?? 0)) : 'Após pagamento aprovado'}</div>
              </div>
            </div>

            {trialValid ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="text-sm font-semibold text-primary">Seu teste grátis está ativo</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Início: {formatDate(usuario?.trial_start_date)} · Expira: {trialEndMs ? formatDate(new Date(trialEndMs)) : '—'}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Aproveite o app durante o teste. Após expirar, será necessário liberar o acesso vitalício para continuar.
                </div>
              </div>
            ) : null}

            {!isPaid && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-primary mb-2">Acesso Vitalício Disponível</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Pagamento único para usar sempre. Ideal para quem quer profissionalizar a gestão do salão e ganhar tempo no dia a dia.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    'Agenda com visão diária/semana',
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
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Button 
                onClick={() => navigate('/checkout')} 
                className="w-full h-11"
                variant={isPaid ? "outline" : "default"}
                disabled={isPaid}
              >
                {isPaid ? 'Acesso Vitalício Adquirido' : 'Comprar Acesso Vitalício'}
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

