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
    const paymentStatus = usuario?.payment_status ?? null;
    const nowIso = new Date().toISOString();
    const trialValid = paymentStatus === 'trial' && typeof usuario?.trial_end_date === 'string' && usuario.trial_end_date > nowIso;
    const activeValid = paymentStatus === 'active' && usuario?.is_active === true;

    if (!trialValid && !activeValid) {
      const path = window.location.pathname;
      if (path !== '/planos' && path !== '/checkout' && path !== '/login' && path !== '/cadastro') {
        navigate('/planos', { replace: true });
      }
    }
  }, [usuario, navigate]);

  return null;
};
