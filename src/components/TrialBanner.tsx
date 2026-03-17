import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

export const TrialBanner = () => {
  const { subscription } = useSupabaseAuth();
  const navigate = useNavigate();

  if (!subscription || subscription.status !== 'trial') {
    return null;
  }

  const daysRemaining = subscription.trial_days_remaining || 0;
  
  const getAlertVariant = () => {
    if (daysRemaining <= 2) return 'destructive';
    return 'default';
  };

  const getMessage = () => {
    return `🎉 Você está no período de teste grátis! Restam ${daysRemaining} dias. Escolha seu plano para continuar.`;
  };

  return (
    <Alert 
      variant={getAlertVariant()}
      className="mb-4 border-2 border-yellow-500/30 bg-yellow-500/10"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <Clock className="h-5 w-5" />
          <AlertDescription className="font-medium">
            {getMessage()}
          </AlertDescription>
        </div>
        <Button 
          onClick={() => navigate('/planos')}
          size="sm"
          variant={daysRemaining <= 2 ? 'default' : 'outline'}
          className="gap-2"
        >
          Escolher plano
        </Button>
      </div>
    </Alert>
  );
};
