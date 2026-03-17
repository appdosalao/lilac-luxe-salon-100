import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
  login: (email: string, senha: string) => Promise<boolean>;
  cadastrar: (dados: UsuarioCadastro) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    is_active: Boolean(profile?.is_active ?? false),
    payment_status: (profile?.payment_status ?? null) as Usuario['payment_status'],
    trial_start_date: (profile?.trial_start_date ?? null) as Usuario['trial_start_date'],
    trial_end_date: (profile?.trial_end_date ?? null) as Usuario['trial_end_date'],
    plan_expires_at: (profile?.plan_expires_at ?? null) as Usuario['plan_expires_at'],
    asaas_customer_id: (profile?.asaas_customer_id ?? null) as Usuario['asaas_customer_id'],
    asaas_subscription_id: (profile?.asaas_subscription_id ?? null) as Usuario['asaas_subscription_id'],
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

  const hydrateFromSession = async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setUsuario(null);
      applyTheme(localStorage.getItem('app-theme') as any);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', nextSession.user.id)
      .single();

    if (profileError) {
      setUsuario(null);
      return;
    }

    const nextUsuario = normalizeUsuario(profile);
    setUsuario(nextUsuario);
    applyTheme(nextUsuario.tema_preferencia);
    updateManifest(nextUsuario);
  };

  const login: AuthContextType['login'] = async (email, senha) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error || !data?.user) {
      return false;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return false;
    }

    const nextUsuario = normalizeUsuario(profile);
    setSession(data.session);
    setUser(data.user);
    setUsuario(nextUsuario);
    applyTheme(nextUsuario.tema_preferencia);
    updateManifest(nextUsuario);
    return true;
  };

  const cadastrar: AuthContextType['cadastrar'] = async (dados) => {
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
        },
      },
    });

    if (error) {
      return false;
    }

    return true;
  };

  const logout: AuthContextType['logout'] = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setUser(null);
    setSession(null);
  };

  const refreshProfile: AuthContextType['refreshProfile'] = async () => {
    if (!usuario?.id) {
      setUsuario(null);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', usuario.id)
      .single();

    if (error) {
      return;
    }

    const nextUsuario = normalizeUsuario(profile);
    setUsuario(nextUsuario);
    applyTheme(nextUsuario.tema_preferencia);
    updateManifest(nextUsuario);
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
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        await hydrateFromSession(data.session);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void init();

    const { data } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      setIsLoading(true);
      try {
        await hydrateFromSession(nextSession);
      } finally {
        if (active) setIsLoading(false);
      }
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

