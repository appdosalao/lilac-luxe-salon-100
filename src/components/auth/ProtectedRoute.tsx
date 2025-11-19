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

  // Permitir acesso sempre à página de assinatura, checkout-success e onboarding
  const publicPaths = ['/assinatura', '/onboarding', '/checkout-success'];
  const currentPath = window.location.pathname;
  
  if (publicPaths.includes(currentPath)) {
    return <>{children}</>;
  }

  // ✅ VERIFICAR ACESSO: 
  // - Trial ativo (não expirado) = acesso total
  // - Assinatura ativa = acesso total
  // - Trial expirado ou sem assinatura = redirecionar para /assinatura
  const hasActiveTrial = subscription?.status === 'trial' && !subscription?.is_trial_expired;
  const hasActiveSubscription = subscription?.status === 'active';
  const hasAccess = hasActiveTrial || hasActiveSubscription;

  console.log('[PROTECTED-ROUTE] Access check:', {
    pathname: currentPath,
    hasAccess,
    subscriptionStatus: subscription?.status,
    isTrialExpired: subscription?.is_trial_expired,
    trialDaysRemaining: subscription?.trial_days_remaining,
    subscribed: subscription?.subscribed
  });

  if (!hasAccess) {
    console.log('[PROTECTED-ROUTE] ❌ Acesso negado, redirecionando para /assinatura');
    return <Navigate to="/assinatura" replace />;
  }

  return <>{children}</>;
};