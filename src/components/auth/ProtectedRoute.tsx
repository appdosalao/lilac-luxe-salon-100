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

  // Permitir acesso à página de assinatura, checkout-success e onboarding
  const publicPaths = ['/assinatura', '/onboarding', '/checkout-success'];
  if (publicPaths.includes(window.location.pathname)) {
    return <>{children}</>;
  }

  // ✅ VERIFICAR ACESSO: aceitar 'trial' OU 'active'
  const hasAccess = subscription && (
    subscription.status === 'trial' || 
    subscription.status === 'active'
  );

  console.log('[PROTECTED-ROUTE] Access check:', {
    pathname: window.location.pathname,
    hasAccess,
    subscriptionStatus: subscription?.status,
    subscribed: subscription?.subscribed
  });

  if (!hasAccess) {
    console.log('[PROTECTED-ROUTE] ❌ Access denied, redirecting to /assinatura');
    return <Navigate to="/assinatura" replace />;
  }

  return <>{children}</>;
};