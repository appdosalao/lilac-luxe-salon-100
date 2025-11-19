import { useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Componente que monitora o status do trial e redireciona
 * automaticamente quando o trial expira
 */
export const TrialStatus = () => {
  const { subscription } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se trial expirou e não tem assinatura ativa, redirecionar
    if (subscription?.is_trial_expired && subscription?.status !== 'active') {
      console.log('[TRIAL-STATUS] Trial expired, redirecting to subscription page');
      navigate('/assinatura', { replace: true });
    }
  }, [subscription, navigate]);

  return null;
};
