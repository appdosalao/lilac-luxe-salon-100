import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Usuario, UsuarioCadastro } from '@/types/usuario';
import { updateManifest } from '@/utils/manifestUtils';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  cadastrar: (dados: UsuarioCadastro) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number): Promise<T> => {
  return await new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('timeout'));
    }, ms);

    Promise.resolve(promise)
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
};

const normalizeUsuario = (profile: any): Usuario => {
  return {
    id: String(profile?.id ?? ''),
    nome_completo: String(profile?.nome_completo ?? ''),
    nome_personalizado_app: String(profile?.nome_personalizado_app ?? ''),
    email: String(profile?.email ?? ''),
    telefone: String(profile?.telefone ?? ''),
    tema_preferencia: (profile?.tema_preferencia ?? 'feminino') as Usuario['tema_preferencia'],
    created_at: String(profile?.created_at ?? new Date().toISOString()),
    updated_at: String(profile?.updated_at ?? new Date().toISOString()),
    plan_type: (profile?.plan_type ?? null) as Usuario['plan_type'],
    subscription_status: (profile?.subscription_status ?? null) as Usuario['subscription_status'],
    trial_start_date: (profile?.trial_start_date ?? null) as Usuario['trial_start_date'],
    trial_used: (profile?.trial_used ?? null) as Usuario['trial_used'],
    payment_provider: (profile?.payment_provider ?? null) as Usuario['payment_provider'],
    cakto_order_id: (profile?.cakto_order_id ?? null) as Usuario['cakto_order_id'],
    cakto_order_ref_id: (profile?.cakto_order_ref_id ?? null) as Usuario['cakto_order_ref_id'],
    cakto_product_id: (profile?.cakto_product_id ?? null) as Usuario['cakto_product_id'],
    cakto_offer_id: (profile?.cakto_offer_id ?? null) as Usuario['cakto_offer_id'],
    cakto_subscription_id: (profile?.cakto_subscription_id ?? null) as Usuario['cakto_subscription_id'],
    cakto_last_event: (profile?.cakto_last_event ?? null) as Usuario['cakto_last_event'],
    cakto_last_status: (profile?.cakto_last_status ?? null) as Usuario['cakto_last_status'],
    cakto_customer_email: (profile?.cakto_customer_email ?? null) as Usuario['cakto_customer_email'],
    subscription_updated_at: (profile?.subscription_updated_at ?? null) as Usuario['subscription_updated_at'],
    paid_access: Boolean(profile?.paid_access ?? false),
    paid_at: (profile?.paid_at ?? null) as Usuario['paid_at'],
  };
};

const applyTheme = (theme?: Usuario['tema_preferencia'] | null) => {
  const next = theme || 'feminino';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('app-theme', next);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const hydrationLock = useRef<string | null>(null);

  const hydrateFromSession = async (nextSession: Session | null) => {
    console.log('[Auth] hydrateFromSession chamado...', { userId: nextSession?.user?.id });
    // Se não houver sessão nova, e já tivermos um usuário, não limpamos imediatamente
    // para evitar "flicker" de redirecionamento em falhas temporárias de rede ao retomar foco
    if (!nextSession?.user) {
      hydrationLock.current = null;
      // Limpamos o estado se não houver sessão ativa
      setSession(null);
      setUser(null);
      setUsuario(null);
      setSessionError(false);
      applyTheme(localStorage.getItem('app-theme') as any);
      return;
    }

    // Se já estamos hidratando ESTE usuário, evitamos chamadas paralelas
    if (hydrationLock.current === nextSession.user.id) {
      console.log(`[Auth] Hidratação já em curso para o usuário ${nextSession.user.id}, ignorando chamada redundante.`);
      return;
    }

    // Se já temos o mesmo usuário e o perfil já está carregado, evitamos sobrescrever
    // o estado de 'usuario' se não for necessário, prevenindo triggers em outros hooks
    const isSameUser = user?.id === nextSession.user.id;
    
    // Atualiza sessão e usuário base (rápido, local)
    setSession(nextSession);
    setUser(nextSession.user);
    
    // Se estávamos mostrando o loader, agora podemos liberar o acesso básico
    // O perfil carregará em background
    setIsLoading(false);

    // Se for o mesmo usuário e já tivermos o objeto 'usuario', só atualizamos se houver mudança real
    if (isSameUser && usuario) {
      setSessionError(false);
      return;
    }

    // Adquire o lock para este usuário
    hydrationLock.current = nextSession.user.id;

    try {
      let profile: any = null;
      let profileError: any = null;
      let attempts = 0;
      const maxAttempts = 4; // Aumentado para 4 tentativas
      const timeouts = [10000, 20000, 30000, 45000]; // Timeouts progressivos

      while (attempts < maxAttempts) {
        if (hydrationLock.current !== nextSession.user.id) return;

        try {
          console.log(`[Auth] Tentativa ${attempts + 1}/${maxAttempts} para carregar perfil de ${nextSession.user.id}... (Online: ${navigator.onLine})`);
          const startTime = Date.now();
          
          const res = await withTimeout(
            supabase.from('usuarios').select('*').eq('id', nextSession.user.id).single(),
            timeouts[attempts]
          );
          
          const duration = Date.now() - startTime;
          profile = (res as any).data;
          profileError = (res as any).error;
          
          if (!profileError && profile) {
            console.log(`[Auth] Perfil carregado com sucesso em ${duration}ms.`);
            break;
          }
          
          if (profileError?.code === 'PGRST116') {
            console.warn(`[Auth] Perfil não encontrado para ${nextSession.user.id}. Tentando criar perfil básico...`);
            
            // Tenta criar um perfil básico para evitar bloqueio
            const { data: newProfile, error: insertError } = await supabase.from('usuarios').insert({
              id: nextSession.user.id,
              email: nextSession.user.email,
              nome_completo: nextSession.user.user_metadata?.nome_completo || 'Novo Usuário',
              nome_personalizado_app: nextSession.user.user_metadata?.nome_personalizado_app || 'Meu Salão',
              tema_preferencia: nextSession.user.user_metadata?.tema_preferencia || 'feminino',
            }).select().single();

            if (!insertError && newProfile) {
              profile = newProfile;
              profileError = null;
              console.log('[Auth] Perfil básico criado com sucesso.');
            } else {
              console.error('[Auth] Erro ao criar perfil básico:', insertError);
            }
            break;
          }
        } catch (err) {
          profileError = err instanceof Error ? err : new Error('timeout');
          console.warn(`[Auth] Erro na tentativa ${attempts + 1}: ${profileError.message}`);
        }
        
        attempts++;
        if (attempts < maxAttempts && !profile) {
          const delay = attempts * 3000; // Delay progressivo: 3s, 6s...
          console.warn(`[Auth] Aguardando ${delay/1000}s antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Se o usuário mudou enquanto carregávamos o perfil, ignoramos o resultado
      if (hydrationLock.current !== nextSession.user.id) return;

      if (profileError) {
        // Se houver erro ao carregar o perfil (ex: timeout ao voltar da suspensão),
        // tentamos uma última vez sem timeout (confiando no default do Supabase/Navegador)
        // apenas se for o mesmo usuário e não tivermos o perfil ainda.
        if (profileError.message === 'timeout' && hydrationLock.current === nextSession.user.id && !usuario) {
          console.log('[Auth] Tentativa final sem timeout manual...');
          try {
            const { data, error } = await supabase.from('usuarios').select('*').eq('id', nextSession.user.id).single();
            if (!error && data) {
              const nextUsuario = normalizeUsuario(data);
              setUsuario(nextUsuario);
              setSessionError(false);
              return;
            }
          } catch (e) {
            console.error('[Auth] Falha na tentativa final de emergência:', e);
          }
        }

        // Se houver erro ao carregar o perfil (ex: timeout ao voltar da suspensão),
        // mantemos o usuário atual se o ID for o mesmo para evitar logout indesejado
        if (usuario && usuario.id === nextSession.user.id) {
          console.warn('[Auth] Falha temporária ao carregar perfil, mantendo estado atual.');
          setSessionError(false); // Mantemos o usuário antigo, então não é um erro bloqueante
          return;
        }
        
        console.error(`[Auth] Erro crítico ao carregar perfil para ${nextSession.user.id}:`, profileError);
        if (profileError instanceof Error) {
          console.error('[Auth] Detalhes do erro:', {
            message: profileError.message,
            stack: profileError.stack,
            attempts
          });
        }
        setUsuario(null);
        setSessionError(true);
        return;
      }

      const nextUsuario = normalizeUsuario(profile);
      setUsuario(nextUsuario);
      setSessionError(false);
      applyTheme(nextUsuario.tema_preferencia);
      updateManifest(nextUsuario);
    } finally {
      // Só removemos o lock se ainda formos o mesmo usuário
      if (hydrationLock.current === nextSession.user.id) {
        hydrationLock.current = null;
      }
    }
  };

  const login: AuthContextType['login'] = async (email, senha) => {
    setSessionError(false);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    
    if (error || !data?.user) {
      return false;
    }

    // Definimos a sessão e usuário IMEDIATAMENTE para liberar a navegação
    // O perfil (usuario) será carregado de forma assíncrona pelo onAuthStateChange ou hydrateFromSession
    setSession(data.session);
    setUser(data.user);
    setSessionError(false);
    
    // Disparamos a hidratação em segundo plano sem esperar por ela aqui
    void hydrateFromSession(data.session);
    
    return true;
  };

  const cadastrar: AuthContextType['cadastrar'] = async (dados) => {
    setSessionError(false);
    if (dados.senha !== dados.confirmar_senha) {
      throw new Error('Senhas não coincidem');
    }

    const { error } = await supabase.auth.signUp({
      email: dados.email,
      password: dados.senha,
      options: {
        data: {
          nome_completo: dados.nome_completo,
          nome_personalizado_app: dados.nome_personalizado_app,
          telefone: dados.telefone,
          tema_preferencia: dados.tema_preferencia,
        },
      },
    });

    if (error) {
      console.error('Erro no Supabase Auth (Sign Up):', error.message);
      throw error;
    }

    return true;
  };

  const logout: AuthContextType['logout'] = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      try {
        await supabase.auth.signOut();
      } catch {}
    } finally {
      setUsuario(null);
      setUser(null);
      setSession(null);
      setSessionError(false);
    }
  };

  const refreshProfile: AuthContextType['refreshProfile'] = async () => {
    const currentUserId = usuario?.id || user?.id;
    if (!currentUserId) {
      setUsuario(null);
      setSessionError(false);
      return;
    }

    try {
      let profile: any = null;
      let profileError: any = null;
      let attempts = 0;
      const maxAttempts = 3;
      const timeouts = [10000, 20000, 30000];

      while (attempts < maxAttempts) {
        try {
          console.log(`[Auth] Refresh: Tentativa ${attempts + 1}/${maxAttempts} para ${currentUserId}...`);
          const res = await withTimeout(
            supabase.from('usuarios').select('*').eq('id', currentUserId).single(),
            timeouts[attempts]
          );
          profile = (res as any).data;
          profileError = (res as any).error;

          if (!profileError && profile) break;
          if (profileError?.code === 'PGRST116') break;
        } catch (err) {
          profileError = err instanceof Error ? err : new Error('timeout');
        }

        attempts++;
        if (attempts < maxAttempts && !profile) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      if (profileError || !profile) {
        console.warn('[Auth] Falha no refreshProfile após retentativas:', profileError);
        if (!usuario) setSessionError(true);
        return;
      }

      const nextUsuario = normalizeUsuario(profile);
      setUsuario(nextUsuario);
      setSessionError(false);
      applyTheme(nextUsuario.tema_preferencia);
      updateManifest(nextUsuario);
    } catch (err) {
      console.warn('[Auth] Erro inesperado no refreshProfile:', err);
      if (!usuario) setSessionError(true);
    }
  };

  useEffect(() => {
    let active = true;

    const storedTheme = localStorage.getItem('app-theme');
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme);
    }

    const init = async () => {
      setIsLoading(true);
      try {
        // Aumentado o timeout para 15 segundos para conexões mais lentas
        const { data } = await withTimeout(supabase.auth.getSession(), 15000);
        if (!active) return;
        await hydrateFromSession(data.session);
      } catch (error) {
        // Se der timeout ou erro, tentamos hidratar sem sessão (o que levará ao login)
        console.warn('Falha ao recuperar sessão inicial (timeout ou rede):', error);
        if (!active) return;
        
        // Em caso de erro de rede/timeout, tentamos carregar o que estiver no cache local do Supabase
        // sem forçar uma nova requisição de rede imediatamente se possível
        try {
          const { data: localSession } = await supabase.auth.getSession();
          await hydrateFromSession(localSession.session);
        } catch {
          await hydrateFromSession(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void init();

    const { data } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!active) return;

      // Se não houver sessão, limpa tudo e para o loader (se houver)
      if (!nextSession) {
        setSession(null);
        setUser(null);
        setUsuario(null);
        setIsLoading(false);
        return;
      }

      // Se já temos a mesma sessão (pelo ID do usuário), atualizamos a sessão silenciosamente
      // Isso evita o flicker ao mudar de aba quando o Supabase refresca o token
      if (user?.id === nextSession.user.id && usuario) {
        setSession(nextSession);
        setUser(nextSession.user);
        return;
      }

      // Só mostramos o loader se ainda não tivermos NENHUMA sessão carregada
      // Se o usuário já está logado, nunca mais ativamos o isLoading global
      const needsLoader = !session && !usuario;
      if (needsLoader) setIsLoading(true);

      // Iniciamos a hidratação em background sem aguardar o retorno aqui
      // Isso permite que a sessão (user) seja disponibilizada imediatamente
      // e o ProtectedRoute possa renderizar os filhos enquanto o perfil carrega
      void hydrateFromSession(nextSession).finally(() => {
        if (active) setIsLoading(false);
      });
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = useMemo(() => !!session, [session]);

  const value: AuthContextType = {
    user,
    session,
    usuario,
    isAuthenticated,
    isLoading,
    sessionError,
    login,
    cadastrar,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

