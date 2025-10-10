import { useState, useEffect, createContext, useContext } from '@/lib/react';
import type { ReactNode } from '@/lib/react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Usuario } from '@/types/usuario';
import { toast } from 'sonner';

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, userData: Partial<Usuario>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Usuario>) => Promise<{ error: any }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Configurar listener de mudanças de auth PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Buscar dados do usuário da tabela usuarios
          setTimeout(async () => {
            try {
              const { data: userData, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar dados do usuário:', error);
                return;
              }

              if (userData) {
                setUsuario(userData);
              }
            } catch (error) {
              console.error('Erro ao buscar perfil do usuário:', error);
            }
          }, 0);
        } else {
          setUsuario(null);
        }

        setIsLoading(false);
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: Partial<Usuario>) => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: userData.nome_completo,
            nome_personalizado_app: userData.nome_personalizado_app || 'Meu Salão',
            telefone: userData.telefone,
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      if (data.user) {
        // Criar registro na tabela usuarios
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            email,
            nome_completo: userData.nome_completo || '',
            nome_personalizado_app: userData.nome_personalizado_app || 'Meu Salão',
            telefone: userData.telefone || '',
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }

        toast.success('Conta criada com sucesso! Verifique seu email.');
      }

      return { error: null };
    } catch (error) {
      console.error('Erro no cadastro:', error);
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

      setUsuario(data);
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