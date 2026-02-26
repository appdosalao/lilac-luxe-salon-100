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
    // MAS APENAS se não estiver já na página de assinatura
    if (subscription?.is_trial_expired && subscription?.status !== 'active') {
      const currentPath = window.location.pathname + window.location.search;
      if (!currentPath.startsWith('/configuracoes')) {
        navigate('/configuracoes?tab=assinatura', { replace: true });
      }
    }
  }, [subscription, navigate]);

  return null;
};
