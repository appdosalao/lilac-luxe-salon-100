import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, usuario } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const paymentStatus = usuario?.payment_status ?? null;
  const nowIso = new Date().toISOString();

  const canAccessTrial =
    paymentStatus === 'trial' &&
    typeof usuario?.trial_end_date === 'string' &&
    usuario.trial_end_date > nowIso;

  const canAccessActive = paymentStatus === 'active' && usuario?.is_active === true;

  if (!canAccessTrial && !canAccessActive) {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
};
