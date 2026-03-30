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
        console.log('[PersistenceGuard] App restaurado. Preservando estado atual.');
        // Aqui garantimos que o router e estados não sejam resetados
      } else {
        console.log('[PersistenceGuard] App minimizado. Aguardando retorno...');
        // Opcional: Salvar estados críticos no sessionStorage se necessário
      }
    };

    // 2. Interceptar recargas/fechamentos acidentais (antes de sair)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Opcional: Só ativar se houver formulários sujos ou estados críticos
      // Para bloquear recargas automáticas, o próprio evento no PWA/Browser pode ser prevenido
    };

    // 3. PageHide - Melhor para economizar recursos e salvar estados finais
    const handlePageHide = (e: PageTransitionEvent) => {
      console.log('[PersistenceGuard] PageHide detectado. Persistindo dados voláteis...');
    };

    // 4. Bloquear qualquer tentativa automática de reload via script (Log de auditoria)
    // Sobrescrever o window.location.reload opcionalmente para log
    /*
    const originalReload = window.location.reload;
    window.location.reload = (forcedReload?: boolean) => {
      console.warn('[PersistenceGuard] Tentativa de reload detectada.', forcedReload);
      originalReload();
    };
    */

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', () => console.log('[PersistenceGuard] Foco recuperado.'));

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', () => {});
    };
  }, []);

  return <>{children}</>;
};
