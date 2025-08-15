import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useEffect, useState } from 'react';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  variant?: 'badge' | 'banner';
}

export const OfflineIndicator = ({ position = 'top', variant = 'badge' }: OfflineIndicatorProps) => {
  const { isOffline } = usePWA();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (wasOffline && !isOffline) {
      setShowOnlineMessage(true);
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    setWasOffline(isOffline);
  }, [isOffline, wasOffline]);

  if (variant === 'banner') {
    if (isOffline) {
      return (
        <div className={`fixed left-0 right-0 z-40 bg-yellow-500 text-yellow-900 p-2 ${
          position === 'top' ? 'top-0' : 'bottom-0'
        }`}>
          <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="h-4 w-4" />
            Você está offline. Algumas funcionalidades podem estar limitadas.
          </div>
        </div>
      );
    }

    if (showOnlineMessage) {
      return (
        <div className={`fixed left-0 right-0 z-40 bg-green-500 text-white p-2 ${
          position === 'top' ? 'top-0' : 'bottom-0'
        }`}>
          <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-medium">
            <Wifi className="h-4 w-4" />
            Conexão restaurada!
          </div>
        </div>
      );
    }

    return null;
  }

  // Badge variant
  if (isOffline) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    );
  }

  if (showOnlineMessage) {
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-600">
        <Wifi className="h-3 w-3" />
        Online
      </Badge>
    );
  }

  return null;
};