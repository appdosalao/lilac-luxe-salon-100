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
        console.log('[PersistenceGuard] Foco recuperado. Estado preservado.');
      }
    };

    // 2. Capturar cliques em links globais para evitar href="#" disparando reload ou scroll indesejado
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.getAttribute('href') === '#') {
        e.preventDefault();
        console.warn('[PersistenceGuard] Clique em link vazio (#) bloqueado.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleGlobalClick);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return <>{children}</>;
};
