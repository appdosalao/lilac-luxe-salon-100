import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Usuario } from '@/types/usuario';
import { toast } from 'sonner';

interface SubscriptionStatus {
  subscribed: boolean;
  status: 'trial' | 'active' | 'expired' | 'inactive';
  trial_days_remaining?: number;
  trial_end_date?: string;
  subscription_end?: string | null;
  product_id?: string | null;
}

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  subscription: SubscriptionStatus | null;
  isSubscriptionLoading: boolean;
  setSubscription: (sub: SubscriptionStatus | null) => void;
  checkSubscription: () => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<Usuario>, planType?: 'trial' | 'paid') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Usuario>) => Promise<{ error: any }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  const checkSubscription = async () => {
    if (!session || !user) {
      setSubscription(null);
      return;
    }

    setIsSubscriptionLoading(true);
    try {
      // Buscar dados locais do usuário
      const { data: userData } = await supabase
        .from('usuarios')
        .select('trial_start_date, trial_used, subscription_status')
        .eq('id', user.id)
        .single();

      // Se usuário não tem status definido, permitir iniciar trial
      if (!userData?.subscription_status || userData.subscription_status === 'inactive') {
        setSubscription({
          subscribed: false,
          status: 'inactive'
        });
        setIsSubscriptionLoading(false);
        return;
      }

      // ✅ MUDANÇA PRINCIPAL: SEMPRE VERIFICAR STRIPE PRIMEIRO
      // Isso garante que upgrades de trial para pago sejam detectados
      try {
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        // Se encontrou assinatura ativa no Stripe, atualizar e retornar
        if (!stripeError && stripeData?.subscribed) {
          await supabase
            .from('usuarios')
            .update({ 
              subscription_status: 'active',
              trial_used: true 
            })
            .eq('id', user.id);

          setSubscription({
            subscribed: true,
            status: 'active',
            subscription_end: stripeData.subscription_end,
            product_id: stripeData.product_id
          });
          setIsSubscriptionLoading(false);
          return; // ✅ Sair aqui se tem assinatura paga
        }
      } catch (stripeError) {
        console.error('Erro ao verificar Stripe (continuando com verificação local):', stripeError);
        // Continuar com verificação de trial local se Stripe falhar
      }

      // Só verifica trial local se NÃO encontrou assinatura no Stripe
      if (userData?.trial_start_date && userData.subscription_status === 'trial') {
        const trialStart = new Date(userData.trial_start_date);
        const now = new Date();
        const daysSinceTrial = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = 7 - daysSinceTrial;

        if (daysRemaining > 0) {
          const trialEndDate = new Date(trialStart);
          trialEndDate.setDate(trialEndDate.getDate() + 7);
          
          setSubscription({
            subscribed: true,
            status: 'trial',
            trial_days_remaining: daysRemaining,
            trial_end_date: trialEndDate.toISOString()
          });
          setIsSubscriptionLoading(false);
          return;
        } else {
          // Trial expirado
          await supabase
            .from('usuarios')
            .update({ subscription_status: 'expired' })
            .eq('id', user.id);
            
          setSubscription({
            subscribed: false,
            status: 'expired'
          });
          setIsSubscriptionLoading(false);
          return;
        }
      }

      // Se chegou aqui, não tem trial nem assinatura
      setSubscription({
        subscribed: false,
        status: 'inactive'
      });
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      setSubscription({ subscribed: false, status: 'inactive' });
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    // Aplicar tema salvo localmente imediatamente (evita flash)
    const storedTheme = localStorage.getItem('app-theme');
    console.log('🟢 [INIT] Tema armazenado localmente:', storedTheme);
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme);
    }
    
    // Configurar listener de mudanças de auth PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🟡 [AUTH] State changed:', event, 'User ID:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('🟡 [AUTH] Usuário logado, buscando perfil...');
          // Verificar se é primeiro login
          const onboardingCompleted = localStorage.getItem('onboarding-completed');
          if (!onboardingCompleted && event === 'SIGNED_IN') {
            setTimeout(() => navigate('/onboarding'), 500);
          }
          // Verificar assinatura
          setTimeout(() => checkSubscription(), 100);
          // Defer para evitar deadlock
          setTimeout(async () => {
            try {
              console.log('🔵 [QUERY] Buscando usuário no banco:', session.user.id);
              const { data: userData, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', session.user.id)
                .single();

              console.log('🔵 [QUERY] Resultado:', { userData, error });

              if (error && error.code !== 'PGRST116') {
                console.error('❌ [ERROR] Erro ao buscar dados do usuário:', error);
                console.error('❌ [ERROR] Código do erro:', error.code);
                console.error('❌ [ERROR] Mensagem:', error.message);
                return;
              }

              if (userData) {
                const usuario = userData as Usuario;
                setUsuario(usuario);
                
                // Aplicar tema
                const tema = usuario.tema_preferencia || 'feminino';
                console.log('✅ [SUCCESS] Usuário carregado:', usuario.email);
                console.log('✅ [SUCCESS] Tema do banco de dados:', tema);
                console.log('✅ [SUCCESS] Aplicando tema:', tema);
                document.documentElement.setAttribute('data-theme', tema);
                localStorage.setItem('app-theme', tema);
              } else {
                console.log('⚠️ [WARNING] Usuário não encontrado no banco, aplicando tema padrão');
                document.documentElement.setAttribute('data-theme', 'feminino');
                localStorage.setItem('app-theme', 'feminino');
              }
            } catch (error) {
              console.error('❌ [EXCEPTION] Erro ao buscar perfil do usuário:', error);
              document.documentElement.setAttribute('data-theme', 'feminino');
              localStorage.setItem('app-theme', 'feminino');
            }
          }, 0);
        } else {
          setUsuario(null);
          console.log('🟤 [AUTH] Sem sessão, aplicando tema padrão');
          document.documentElement.setAttribute('data-theme', 'feminino');
          localStorage.setItem('app-theme', 'feminino');
        }

        setIsLoading(false);
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsLoading(false);
      }
      // O onAuthStateChange vai lidar com a sessão
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: Partial<Usuario>, planType?: 'trial' | 'paid') => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      console.log('🟣 [SIGNUP] Iniciando cadastro...');
      console.log('🟣 [SIGNUP] Tema selecionado:', userData.tema_preferencia);
      console.log('🟣 [SIGNUP] Email:', email);
      console.log('🟣 [SIGNUP] Tipo de plano:', planType);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: userData.nome_completo,
            nome_personalizado_app: userData.nome_personalizado_app || 'Meu Salão',
            telefone: userData.telefone,
            tema_preferencia: userData.tema_preferencia || 'feminino',
            plan_type: planType || 'trial',
          }
        }
      });

      if (error) {
        console.error('❌ [SIGNUP] Erro no auth.signUp:', error);
        toast.error(error.message);
        return { error };
      }

      console.log('✅ [SIGNUP] Conta criada com sucesso! User ID:', data.user?.id);
      
      // O perfil é criado automaticamente via trigger no banco de dados
      // Aplicar tema localmente
      if (userData.tema_preferencia) {
        document.documentElement.setAttribute('data-theme', userData.tema_preferencia);
        localStorage.setItem('app-theme', userData.tema_preferencia);
      }

      // Se escolheu trial, fazer login automático
      if (planType === 'trial' && data.user && !error) {
        console.log('🟣 [SIGNUP] Fazendo login automático para trial...');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          console.error('❌ [SIGNUP] Erro no login automático:', signInError);
          toast.error('Conta criada! Por favor, faça login.');
          return { error: signInError };
        }
        
        console.log('✅ [SIGNUP] Login automático realizado com sucesso!');
        // Aguardar um momento para o onAuthStateChange processar
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success('🎉 Conta criada! Bem-vindo ao seu trial de 7 dias!');
      } else {
        toast.success('Conta criada com sucesso! Faça login para continuar.');
      }

      return { error: null };
    } catch (error) {
      console.error('❌ [SIGNUP] EXCEÇÃO GERAL no cadastro:', error);
      toast.error('Erro inesperado no cadastro. Por favor, tente novamente.');
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Login realizado com sucesso!');
      return { error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUsuario(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Usuario>) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao atualizar perfil');
        return { error };
      }

      const updatedUsuario = data as Usuario;
      setUsuario(updatedUsuario);
      
      // Aplicar tema se foi atualizado
      if (updates.tema_preferencia) {
        console.log('Aplicando novo tema:', updates.tema_preferencia);
        document.documentElement.setAttribute('data-theme', updates.tema_preferencia);
        localStorage.setItem('app-theme', updates.tema_preferencia);
      }
      
      toast.success('Perfil atualizado com sucesso!');
      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!session;

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        session,
        usuario,
        isLoading,
        isAuthenticated,
        subscription,
        isSubscriptionLoading,
        setSubscription,
        checkSubscription,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth deve ser usado dentro de SupabaseAuthProvider');
  }
  return context;
};