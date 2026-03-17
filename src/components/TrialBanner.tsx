import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const TrialBanner = () => {
  const { usuario } = useSupabaseAuth();
  const navigate = useNavigate();

  if (usuario?.payment_status !== 'trial') {
    return null;
  }

  if (!usuario.trial_end_date) return null;

  const daysRemaining = Math.ceil(
    (new Date(usuario.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const urgent = daysRemaining <= 2;
  const clampedDays = Math.max(0, daysRemaining);

  return (
    <Alert 
      className={
        urgent
          ? 'mb-4 border border-orange-500/30 bg-orange-500/10'
          : 'mb-4 border border-yellow-500/30 bg-yellow-500/10'
      }
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <AlertDescription className="font-medium">
            🎉 Você está testando grátis! Restam {clampedDays} dias. Escolha um plano para continuar.
          </AlertDescription>
        </div>
        <Button 
          onClick={() => navigate('/planos')}
          size="sm"
          variant={urgent ? 'default' : 'outline'}
          className="gap-2"
        >
          Escolher plano
        </Button>
      </div>
    </Alert>
  );
};
