import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
}

interface PWAActions {
  installApp: () => Promise<boolean>;
  updateApp: () => void;
  dismissInstall: () => void;
}

export const usePWA = (): PWAState & PWAActions => {
  // Verificação de segurança para garantir que useState está disponível
  if (typeof useState !== 'function') {
    console.warn('useState não está disponível, retornando estado padrão');
    return {
      isInstallable: false,
      isInstalled: false,
      isOffline: false,
      hasUpdate: false,
      installApp: async () => false,
      updateApp: () => {},
      dismissInstall: () => {}
    };
  }

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      try {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isInWebAppiOS = (window.navigator as any).standalone === true;
        setIsInstalled(isStandalone || isInWebAppiOS);
      } catch (error) {
        console.warn('Erro ao verificar se está instalado:', error);
      }
    };

    checkIfInstalled();

    // Listener para prompt de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      try {
        e.preventDefault();
        const event = e as BeforeInstallPromptEvent;
        setInstallPrompt(event);
        setIsInstallable(true);
      } catch (error) {
        console.warn('Erro no handleBeforeInstallPrompt:', error);
      }
    };

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      try {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
      } catch (error) {
        console.warn('Erro no handleAppInstalled:', error);
      }
    };

    // Listeners para status de rede
    const handleOnline = () => {
      try {
        setIsOffline(false);
      } catch (error) {
        console.warn('Erro no handleOnline:', error);
      }
    };
    
    const handleOffline = () => {
      try {
        setIsOffline(true);
      } catch (error) {
        console.warn('Erro no handleOffline:', error);
      }
    };

    // Registrar listeners
    try {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    } catch (error) {
      console.warn('Erro ao registrar event listeners:', error);
    }

    // Service Worker - verificar atualizações (sem re-registrar)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log('Service Worker verificado no usePWA:', registration.scope);
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  try {
                    setHasUpdate(true);
                  } catch (error) {
                    console.warn('Erro ao atualizar hasUpdate:', error);
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('Erro ao acessar Service Worker:', error);
        });

      // Listener para mensagens do Service Worker
      try {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
            try {
              setHasUpdate(true);
            } catch (error) {
              console.warn('Erro ao processar mensagem do Service Worker:', error);
            }
          }
        });
      } catch (error) {
        console.warn('Erro ao adicionar listener de mensagens:', error);
      }
    }

    return () => {
      try {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      } catch (error) {
        console.warn('Erro ao remover event listeners:', error);
      }
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao instalar o app:', error);
      return false;
    }
  };

  const updateApp = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar o app:', error);
    }
  };

  const dismissInstall = () => {
    try {
      setIsInstallable(false);
      setInstallPrompt(null);
    } catch (error) {
      console.error('Erro ao dispensar instalação:', error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOffline,
    hasUpdate,
    installApp,
    updateApp,
    dismissInstall,
  };
};