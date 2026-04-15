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
  const { isAuthenticated, isLoading: authLoading, usuario, session, sessionError, refreshProfile, logout } = useSupabaseAuth();
  const { isPaid, isLoading: paidLoading } = usePaidAccess();
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Carregamento real: precisamos de sessão (autenticação) E perfil carregado
  // Se temos sessão mas não temos perfil E sessionError é false, deixamos passar
  // porque o hydrateFromSession está rodando em background
  const needsBlockingLoader = !session && !usuario && authLoading;
  const isLoading = needsBlockingLoader || (sessionError && !usuario && authLoading);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTimeout(false);
      return;
    }
    const t = window.setTimeout(() => setLoadingTimeout(true), 9000);
    return () => window.clearTimeout(t);
  }, [isLoading]);

  // Se houver um erro de sessão (timeout no perfil por exemplo)
  // mostramos uma tela de erro em vez de redirecionar para login
  // APENAS se já passou um tempo considerável tentando carregar
  if (sessionError && !usuario && loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-destructive animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Falha na Conexão</h2>
            <p className="text-muted-foreground">
              Não conseguimos carregar seu perfil. Isso pode ser devido a uma conexão instável com a internet ou latência no banco de dados.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              className="min-w-[140px]" 
              onClick={() => {
                setLoadingTimeout(false);
                refreshProfile();
              }}
            >
              Tentar Novamente
            </Button>
            <Button 
              variant="outline" 
              className="min-w-[140px]" 
              onClick={() => logout()}
            >
              Sair e Entrar de Novo
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
  // permitimos o acesso se houver uma sessão ativa. O perfil carregará em background.
  if (!usuario && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
    subscriptionStatus === null;
  const trialValid =
    trialEligible &&
    typeof trialStart === 'number' &&
    Number.isFinite(trialStart) &&
    Date.now() < trialStart + 7 * 24 * 60 * 60 * 1000;

  return trialValid ? <>{children}</> : <PaywallScreen />;
};
