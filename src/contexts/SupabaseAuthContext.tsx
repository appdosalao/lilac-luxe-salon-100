import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
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
                return;
              }

              if (userData) {
                const usuario = userData as Usuario;
                setUsuario(usuario);
                
                const tema = usuario.tema_preferencia || 'feminino';
                console.log('✅ [SUCCESS] Usuário carregado, aplicando tema:', tema);
                document.documentElement.setAttribute('data-theme', tema);
                localStorage.setItem('app-theme', tema);
              } else if (error?.code === 'PGRST116') {
                // Usuário não tem registro na tabela usuarios - criar automaticamente
                console.log('🟡 [AUTO-CREATE] Criando registro de usuário automaticamente...');
                
                const { data: newUserData, error: createError } = await supabase
                  .from('usuarios')
                  .insert({
                    id: session.user.id,
                    email: session.user.email || '',
                    nome_completo: session.user.user_metadata?.nome_completo || '',
                    nome_personalizado_app: 'Meu Salão',
                    telefone: session.user.user_metadata?.telefone || '',
                    tema_preferencia: 'feminino'
                  })
                  .select()
                  .single();

                if (createError) {
                  console.error('❌ [AUTO-CREATE] Erro ao criar usuário:', createError);
                  document.documentElement.setAttribute('data-theme', 'feminino');
                  localStorage.setItem('app-theme', 'feminino');
                } else if (newUserData) {
                  console.log('✅ [AUTO-CREATE] Usuário criado com sucesso');
                  const usuario = newUserData as Usuario;
                  setUsuario(usuario);
                  
                  const tema = usuario.tema_preferencia || 'feminino';
                  document.documentElement.setAttribute('data-theme', tema);
                  localStorage.setItem('app-theme', tema);
                }
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

  const signUp = async (email: string, password: string, userData: Partial<Usuario>) => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      console.log('🟣 [SIGNUP] Iniciando cadastro...');
      console.log('🟣 [SIGNUP] Tema selecionado:', userData.tema_preferencia);
      console.log('🟣 [SIGNUP] Email:', email);
      
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
        console.error('❌ [SIGNUP] Erro no auth.signUp:', error);
        toast.error(error.message);
        return { error };
      }

      console.log('✅ [SIGNUP] Auth criado com sucesso. User ID:', data.user?.id);

      if (data.user) {
        // Criar registro na tabela usuarios
        console.log('🔵 [INSERT] Iniciando inserção na tabela usuarios...');
        console.log('🔵 [INSERT] Tema para inserir:', userData.tema_preferencia);
        console.log('🔵 [INSERT] userData completo:', JSON.stringify(userData, null, 2));
        
        const profileData = {
          id: data.user.id,
          email,
          nome_completo: userData.nome_completo || '',
          nome_personalizado_app: userData.nome_personalizado_app || 'Meu Salão',
          telefone: userData.telefone || '',
          tema_preferencia: userData.tema_preferencia || 'feminino',
        };
        
        console.log('🔵 [INSERT] Dados que serão inseridos:', JSON.stringify(profileData, null, 2));
        
        try {
          const { data: insertedData, error: profileError } = await supabase
            .from('usuarios')
            .insert(profileData)
            .select()
            .single();

          if (profileError) {
            console.error('❌ [INSERT] ERRO CRÍTICO ao criar perfil!');
            console.error('❌ [INSERT] Código do erro:', profileError.code);
            console.error('❌ [INSERT] Mensagem:', profileError.message);
            console.error('❌ [INSERT] Detalhes completos:', JSON.stringify(profileError, null, 2));
            toast.error('Erro ao criar perfil no banco de dados. Por favor, tente novamente.');
            return { error: profileError };
          }

          console.log('✅ [INSERT] Perfil criado com sucesso!');
          console.log('✅ [INSERT] Dados inseridos:', JSON.stringify(insertedData, null, 2));
          console.log('✅ [INSERT] Tema confirmado no banco:', insertedData.tema_preferencia);
          
          // Aplicar tema imediatamente após criação
          const temaFinal = insertedData.tema_preferencia || 'feminino';
          console.log('✅ [THEME] Aplicando tema após cadastro:', temaFinal);
          document.documentElement.setAttribute('data-theme', temaFinal);
          localStorage.setItem('app-theme', temaFinal);
          
          // Verificar se realmente foi salvo
          console.log('🔍 [VERIFY] Verificando tema aplicado...');
          console.log('🔍 [VERIFY] document.documentElement.dataset.theme:', document.documentElement.getAttribute('data-theme'));
          console.log('🔍 [VERIFY] localStorage app-theme:', localStorage.getItem('app-theme'));
        } catch (insertError) {
          console.error('❌ [INSERT] EXCEÇÃO ao inserir perfil:', insertError);
          toast.error('Erro inesperado ao criar perfil. Por favor, contate o suporte.');
          return { error: insertError };
        }

        toast.success('Conta criada com sucesso! Verifique seu email.');
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