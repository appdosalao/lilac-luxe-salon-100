import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, AuthState } from '@/types/usuario';
import { updateManifest } from '@/utils/manifestUtils';

interface AuthContextType extends AuthState {
  login: (email: string, senha: string) => Promise<boolean>;
  cadastrar: (dados: any) => Promise<boolean>;
  logout: () => void;
  updateUsuario: (usuario: Usuario) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    usuario: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Verificar se existe uma sessão salva no localStorage
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('usuario');
        if (savedUser) {
          const usuario = JSON.parse(savedUser);
          setAuthState({
            usuario,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Atualizar manifest com nome personalizado
          updateManifest(usuario);
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      // TODO: Implementar com Supabase
      // Por enquanto, simulação
      if (email && senha) {
        const mockUser: Usuario = {
          id: '1',
          nome_completo: 'Usuário Demo',
          nome_personalizado_app: 'Salão Demo',
          email,
          telefone: '(11) 99999-9999',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        localStorage.setItem('usuario', JSON.stringify(mockUser));
        setAuthState({
          usuario: mockUser,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Atualizar manifest com nome personalizado
        updateManifest(mockUser);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const cadastrar = async (dados: any): Promise<boolean> => {
    try {
      // TODO: Implementar com Supabase
      // Validações básicas
      if (dados.senha !== dados.confirmar_senha) {
        throw new Error('Senhas não coincidem');
      }
      
      const novoUsuario: Usuario = {
        id: Date.now().toString(),
        nome_completo: dados.nome_completo,
        nome_personalizado_app: dados.nome_personalizado_app,
        email: dados.email,
        telefone: dados.telefone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      localStorage.setItem('usuario', JSON.stringify(novoUsuario));
      setAuthState({
        usuario: novoUsuario,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Atualizar manifest com nome personalizado
      updateManifest(novoUsuario);
      
      return true;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('usuario');
    setAuthState({
      usuario: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUsuario = (usuario: Usuario) => {
    localStorage.setItem('usuario', JSON.stringify(usuario));
    setAuthState(prev => ({
      ...prev,
      usuario,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        cadastrar,
        logout,
        updateUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};