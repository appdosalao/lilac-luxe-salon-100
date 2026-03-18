import { useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Componente que monitora o status do trial e redireciona
 * automaticamente quando o trial expira
 */
export const TrialStatus = () => {
  const { usuario } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const subscriptionStatus = usuario?.subscription_status ?? null;
    const trialStart = typeof usuario?.trial_start_date === 'string' ? new Date(usuario.trial_start_date).getTime() : null;

    const trialValid =
      subscriptionStatus === 'trial' &&
      typeof trialStart === 'number' &&
      Number.isFinite(trialStart) &&
      Date.now() < trialStart + 7 * 24 * 60 * 60 * 1000;

    const activeValid = subscriptionStatus === 'active';

    if (!trialValid && !activeValid) {
      const path = window.location.pathname;
      if (path !== '/planos' && path !== '/checkout' && path !== '/login' && path !== '/cadastro') {
        navigate('/planos', { replace: true });
      }
    }
  }, [usuario, navigate]);

  return null;
};
