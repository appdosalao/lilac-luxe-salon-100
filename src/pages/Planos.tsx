import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Scissors } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePaidAccess } from '@/hooks/usePaidAccess';

export default function Planos() {
  const navigate = useNavigate();
  const { isAuthenticated, usuario } = useSupabaseAuth();
  const { isPaid } = usePaidAccess();

  const showFreeTrialCta = useMemo(() => {
    if (!isAuthenticated) return true;
    if (!usuario?.trial_start_date) return true;

    const startMs = new Date(usuario.trial_start_date).getTime();
    if (!Number.isFinite(startMs)) return true;

    return Date.now() - startMs < 24 * 60 * 60 * 1000;
  }, [isAuthenticated, usuario?.trial_start_date]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Scissors className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Acesso Vitalício</h1>
          <p className="text-muted-foreground text-lg">
            Tenha o Salão de Bolso para sempre, sem mensalidades.
          </p>
        </div>

        <div className="flex justify-center">
          <Card className="shadow-xl border-2 border-primary/40 bg-gradient-to-b from-primary/5 to-background max-w-md w-full relative overflow-hidden">
            {isPaid && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-green-600 hover:bg-green-700 text-white border-none shadow-sm">
                  Adquirido
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl">Plano Vitalício</CardTitle>
              <CardDescription>Licença permanente com pagamento único</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="text-center">
                <div className="text-5xl font-extrabold text-primary leading-none">R$ 350</div>
                <p className="text-sm font-medium mt-2 uppercase tracking-wider text-muted-foreground">pagamento único</p>
              </div>

              <div className="space-y-3 bg-white/50 dark:bg-black/20 p-5 rounded-xl border border-border/50">
                {[
                  'Acesso completo e permanente ao app',
                  'Agendamentos e clientes ilimitados',
                  'Controle financeiro avançado',
                  'Auditoria e Marketing',
                  'Todas as atualizações futuras inclusas',
                  'Sem cobranças recorrentes',
                  'Suporte prioritário',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 rounded-full p-0.5">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate('/checkout', { state: { plano: 'vitalicio' } })}
                className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                disabled={isPaid}
              >
                {isPaid ? 'Você já possui o acesso' : 'Comprar Acesso Vitalício'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <div className="text-center text-sm text-muted-foreground mt-4">
            🔒 Pagamento 100% seguro processado via Cakto.
          </div>
        </div>
      </div>
    </div>
  );
}

