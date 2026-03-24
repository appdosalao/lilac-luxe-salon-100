import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { ScissorsLoader } from '@/components/ScissorsLoader';
import { Button } from '@/components/ui/button';
import { usePaidAccess } from '@/hooks/usePaidAccess';
import { PaywallScreen } from '@/components/PaywallScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useSupabaseAuth();
  const { isPaid, isLoading: paidLoading } = usePaidAccess();
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const isLoading = authLoading || paidLoading;

  useEffect(() => {
    if (!isLoading) {
      setLoadingTimeout(false);
      return;
    }
    const t = window.setTimeout(() => setLoadingTimeout(true), 9000);
    return () => window.clearTimeout(t);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <ScissorsLoader />
          {loadingTimeout ? (
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm text-muted-foreground">Carregamento demorando…</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Recarregar
                </Button>
                <Button onClick={() => navigate('/login')}>Ir para login</Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isPaid ? <>{children}</> : <PaywallScreen />;
};
