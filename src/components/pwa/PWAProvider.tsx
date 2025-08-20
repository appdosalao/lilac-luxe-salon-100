import { createContext, useContext, type ReactNode } from 'react';

console.log('PWAProvider: React importado, useContext type:', typeof useContext);
import { usePWA } from '@/hooks/usePWA';
import { InstallPrompt } from './InstallPrompt';
import { UpdatePrompt } from './UpdatePrompt';
import { OfflineIndicator } from './OfflineIndicator';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
  installApp: () => Promise<boolean>;
  updateApp: () => void;
  dismissInstall: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWAContext = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWAContext deve ser usado dentro de PWAProvider');
  }
  return context;
};

interface PWAProviderProps {
  children: ReactNode;
  showInstallPrompt?: boolean;
  showUpdatePrompt?: boolean;
  showOfflineIndicator?: boolean;
}

export const PWAProvider = ({ 
  children, 
  showInstallPrompt = true, 
  showUpdatePrompt = true, 
  showOfflineIndicator = true 
}: PWAProviderProps) => {
  console.log('PWAProvider: Iniciando provider, chamando usePWA...');
  
  try {
    const pwaState = usePWA();
    console.log('PWAProvider: usePWA executado com sucesso');
    
    return (
      <PWAContext.Provider value={pwaState}>
        {children}
        {showInstallPrompt && <InstallPrompt variant="floating" />}
        {showUpdatePrompt && <UpdatePrompt />}
        {showOfflineIndicator && <OfflineIndicator variant="banner" />}
      </PWAContext.Provider>
    );
  } catch (error) {
    console.error('PWAProvider: Erro ao usar usePWA:', error);
    return <div>{children}</div>;
  }
};