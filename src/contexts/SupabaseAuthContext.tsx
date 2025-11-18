import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Usuario } from '@/types/usuario';
import { toast } from 'sonner';

interface SubscriptionState {
  subscribed: boolean;
  status?: string;
  trial?: boolean;
  subscription_end?: string;
  product_id?: string;
}

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  subscription: SubscriptionState | null;
  isSubscriptionLoading: boolean;
  signUp: (email: string, password: string, userData: Partial<Usuario>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Usuario>) => Promise<{ error: any }>;
  checkSubscription: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  // Move checkSubscription outside useEffect to prevent recreation and loops
  const checkSubscription = async () => {
    setIsSubscriptionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscription(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscription(null);
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('app-theme');
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme);
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const onboardingCompleted = localStorage.getItem('onboarding-completed');
          if (!onboardingCompleted && event === 'SIGNED_IN') {
            setTimeout(() => navigate('/onboarding'), 500);
          }
          
          setTimeout(async () => {
            try {
              const { data: userData, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', newSession.user.id)
                .single();

              if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar dados do usuário:', error);
                return;
              }

              if (userData) {
                const usuario = userData as Usuario;
                setUsuario(usuario);
                
                const tema = usuario.tema_preferencia || 'feminino';
                document.documentElement.setAttribute('data-theme', tema);
                localStorage.setItem('app-theme', tema);
              } else {
                document.documentElement.setAttribute('data-theme', 'feminino');
                localStorage.setItem('app-theme', 'feminino');
              }
            } catch (error) {
              console.error('Erro ao buscar perfil do usuário:', error);
              document.documentElement.setAttribute('data-theme', 'feminino');
              localStorage.setItem('app-theme', 'feminino');
            }
          }, 0);
        } else {
          setUsuario(null);
        }
      }
    );

    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          const { data: userData } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            const usuario = userData as Usuario;
            setUsuario(usuario);
            
            const tema = usuario.tema_preferencia || 'feminino';
            document.documentElement.setAttribute('data-theme', tema);
            localStorage.setItem('app-theme', tema);
          }
          
          // Check subscription on initial load
          checkSubscription();
        }
      } catch (error) {
        console.error('Erro ao verificar sessão inicial:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<Usuario>
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: userData.nome_completo,
            telefone: userData.telefone,
            tema_preferencia: userData.tema_preferencia || 'feminino',
          }
        }
      });

      if (error) {
        console.error('Erro no auth.signUp:', error);
        toast.error(error.message);
        return { error };
      }

      console.log('Conta criada com sucesso! User ID:', data.user?.id);
      
      if (userData.tema_preferencia) {
        document.documentElement.setAttribute('data-theme', userData.tema_preferencia);
        localStorage.setItem('app-theme', userData.tema_preferencia);
      }

      toast.success('Conta criada com sucesso!');
      return { error: null };
    } catch (error) {
      console.error('Erro no signup:', error);
      toast.error('Erro ao criar conta');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        toast.error(error.message);
        return { error };
      }

      if (data.user) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('nome_completo, telefone, nome_personalizado_app')
          .eq('id', data.user.id)
          .single();

        if (!userData?.nome_completo || !userData?.telefone || !userData?.nome_personalizado_app) {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setUsuario(null);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const updateProfile = async (updates: Partial<Usuario>) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    try {
      const { error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData) {
        setUsuario(userData as Usuario);
      }

      toast.success('Perfil atualizado com sucesso!');
      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
      return { error };
    }
  };

  const value = {
    user,
    session,
    usuario,
    isLoading,
    isAuthenticated: !!user,
    subscription,
    isSubscriptionLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    checkSubscription,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
