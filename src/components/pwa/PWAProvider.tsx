import { createContext, useContext, useEffect, ReactNode } from 'react';
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
  const pwaState = usePWA();

  return (
    <PWAContext.Provider value={pwaState}>
      {children}
      {showInstallPrompt && <InstallPrompt variant="floating" />}
      {showUpdatePrompt && <UpdatePrompt />}
      {showOfflineIndicator && <OfflineIndicator variant="banner" />}
    </PWAContext.Provider>
  );
};