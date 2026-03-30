import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePaidAccess } from '@/hooks/usePaidAccess';
import { PaywallScreen } from '@/components/PaywallScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, usuario, session } = useSupabaseAuth();
  const { isPaid, isLoading: paidLoading } = usePaidAccess();
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Consideramos carregando APENAS se não houver NENHUMA sessão e o auth estiver trabalhando
  // Se já temos session ou usuario, ignoramos QUALQUER carregamento de fundo para estabilidade total
  const isInitialBoot = !session && !usuario && authLoading;
  const isLoading = isInitialBoot || (isAuthenticated && !usuario && authLoading);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTimeout(false);
      return;
    }
    const t = window.setTimeout(() => setLoadingTimeout(true), 9000);
    return () => window.clearTimeout(t);
  }, [isLoading]);

  // Nunca mostramos o loader de tela cheia se já temos o objeto de usuário (perfil)
  if (isLoading && !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
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

  // Se o usuário está autenticado mas o perfil ainda não carregou,
  // mantemos o loader para evitar redirecionamento incorreto para o paywall
  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ScissorsLoader />
      </div>
    );
  }

  if (isPaid) {
    return <>{children}</>;
  }

  const subscriptionStatus = usuario?.subscription_status ?? null;
  const trialStart = typeof usuario?.trial_start_date === 'string' ? new Date(usuario.trial_start_date).getTime() : null;
  const trialEligible =
    subscriptionStatus === 'trial' ||
    subscriptionStatus === 'inactive' ||
    subscriptionStatus === null ||
    subscriptionStatus === '';
  const trialValid =
    trialEligible &&
    typeof trialStart === 'number' &&
    Number.isFinite(trialStart) &&
    Date.now() < trialStart + 7 * 24 * 60 * 60 * 1000;

  return trialValid ? <>{children}</> : <PaywallScreen />;
};
