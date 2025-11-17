import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, subscription, isSubscriptionLoading } = useSupabaseAuth();

  if (isLoading || isSubscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Permitir acesso à página de assinatura e onboarding
  if (window.location.pathname === '/assinatura' || window.location.pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Verificar se tem acesso (trial ativo OU assinatura ativa)
  const hasAccess = subscription && (
    subscription.status === 'trial' || 
    subscription.status === 'active'
  );

  if (!hasAccess) {
    return <Navigate to="/assinatura" replace />;
  }

  return <>{children}</>;
};