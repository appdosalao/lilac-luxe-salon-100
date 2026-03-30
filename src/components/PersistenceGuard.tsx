import React, { useEffect, useRef } from 'react';

/**
 * PersistenceGuard
 * Componente responsável por interceptar eventos de visibilidade, foco e sistema
 * para garantir que o estado da aplicação seja preservado e reloads indesejados bloqueados.
 */
export const PersistenceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isInternalNavigationRef = useRef(false);

  useEffect(() => {
    // 1. Bloqueio de recarga indesejada em eventos de visibilidade
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[PersistenceGuard] App restaurado. Preservando estado atual.');
      } else {
        console.log('[PersistenceGuard] App minimizado. Aguardando retorno...');
      }
    };

    // 2. Interceptar recargas/fechamentos acidentais
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Se for uma navegação interna controlada pelo React Router, não bloqueamos
      if (isInternalNavigationRef.current) return;

      // Só mostrar confirmação se houver algo importante ou para prevenir reloads automáticos do browser
      const message = 'Você tem alterações não salvas. Deseja realmente sair?';
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    // 3. Capturar cliques em links globais para evitar href="#" disparando reload
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.getAttribute('href') === '#') {
        e.preventDefault();
        console.warn('[PersistenceGuard] Clique em href="#" bloqueado para evitar scroll/reload.');
      }
    };

    // 4. Auditoria de Formulários (Opcional: Logar submits sem preventDefault se possível)
    // Na prática, React já lida com isso se usarmos onSubmit, mas este listener global ajuda em casos edge
    const handleGlobalSubmit = (e: SubmitEvent) => {
      if (e.defaultPrevented) return;
      // Se chegar aqui sem preventDefault, pode ser um submit nativo que recarregaria a página
      console.warn('[PersistenceGuard] Submit de formulário detectado sem preventDefault.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('submit', handleGlobalSubmit);
    window.addEventListener('focus', () => console.log('[PersistenceGuard] Foco recuperado.'));

    // Sobrescrever temporariamente o reload para debug se necessário
    const originalReload = window.location.reload;
    // @ts-ignore
    window.location.reload = (forcedReload?: boolean) => {
      if (forcedReload === true) {
        originalReload.call(window.location);
      } else {
        console.warn('[PersistenceGuard] Tentativa de reload programático bloqueada. Use reload(true) se for intencional.');
      }
    };

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('submit', handleGlobalSubmit);
      // @ts-ignore
      window.location.reload = originalReload;
    };
  }, []);

  return <>{children}</>;
};
