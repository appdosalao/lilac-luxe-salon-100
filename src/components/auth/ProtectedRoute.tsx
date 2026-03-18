import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { ScissorsLoader } from '@/components/ScissorsLoader';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, usuario } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ScissorsLoader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const subscriptionStatus = usuario?.subscription_status ?? null;

  const trialStart = typeof usuario?.trial_start_date === 'string' ? new Date(usuario.trial_start_date).getTime() : null;
  const trialValid =
    subscriptionStatus === 'trial' &&
    typeof trialStart === 'number' &&
    Number.isFinite(trialStart) &&
    Date.now() < trialStart + 7 * 24 * 60 * 60 * 1000;

  const canAccessTrial = trialValid;
  const canAccessActive = subscriptionStatus === 'active';

  if (!canAccessTrial && !canAccessActive) {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
};
