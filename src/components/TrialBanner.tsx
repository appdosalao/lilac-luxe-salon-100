import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, CreditCard } from 'lucide-react';

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
    if (daysRemaining === 1) {
      return '⚠️ Último dia do teste grátis!';
    }
    if (daysRemaining === 0) {
      return '⏰ Seu teste grátis termina hoje!';
    }
    return `🎉 Você tem ${daysRemaining} dias restantes de teste grátis`;
  };

  return (
    <Alert 
      variant={getAlertVariant()}
      className="mb-4 border-2"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <Clock className="h-5 w-5" />
          <AlertDescription className="font-medium">
            {getMessage()}
          </AlertDescription>
        </div>
        <Button 
          onClick={() => navigate('/configuracoes?tab=assinatura')}
          size="sm"
          variant={daysRemaining <= 2 ? 'default' : 'outline'}
          className="gap-2"
        >
          <CreditCard className="h-4 w-4" />
          Assinar Agora - R$ 20/mês
        </Button>
      </div>
    </Alert>
  );
};
