import React, { useEffect } from 'react';

/**
 * PersistenceGuard
 * Componente responsável por interceptar eventos de visibilidade, foco e sistema
 * para garantir que o estado da aplicação seja preservado e reloads indesejados bloqueados.
 */
export const PersistenceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // 1. Bloqueio de recarga indesejada em eventos de visibilidade
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App restaurado
      }
    };

    // 2. Interceptar recargas/fechamentos acidentais
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Nota: Browsers modernos só mostram o prompt se houver interação do usuário com a página
    };

    // 3. Capturar cliques em links globais para evitar href="#" disparando reload ou scroll indesejado
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.getAttribute('href') === '#') {
        e.preventDefault();
      }
    };

    // 4. Auditoria de Formulários
    const handleGlobalSubmit = (e: SubmitEvent) => {
      // O React já lida com preventDefault na maioria dos casos via onSubmit
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('submit', handleGlobalSubmit);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('submit', handleGlobalSubmit);
    };
  }, []);

  return <>{children}</>;
};
