import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, X, Smartphone, Monitor, Tablet } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useAuth } from '@/contexts/AuthContext';

interface InstallPromptProps {
  variant?: 'banner' | 'card' | 'floating';
  showDismiss?: boolean;
}

export const InstallPrompt = ({ variant = 'banner', showDismiss = true }: InstallPromptProps) => {
  const { isInstallable, installApp, dismissInstall } = usePWA();
  const { usuario } = useAuth();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isDismissed) return null;

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await installApp();
    if (success) {
      setIsDismissed(true);
    }
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    dismissInstall();
  };

  const appName = usuario?.nome_personalizado_app || 'Sistema do Salão';

  if (variant === 'banner') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-3 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5" />
            <div>
              <p className="font-medium">Instale o {appName}</p>
              <p className="text-sm opacity-90">Acesso rápido direto da tela inicial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              variant="secondary"
              size="sm"
            >
              {isInstalling ? 'Instalando...' : 'Instalar'}
            </Button>
            {showDismiss && (
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Instalar App</CardTitle>
              </div>
              {showDismiss && (
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardDescription>
              Instale o {appName} para acesso rápido
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                Mobile
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tablet className="h-3 w-3" />
                Tablet
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                Desktop
              </Badge>
            </div>
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="w-full"
            >
              {isInstalling ? 'Instalando...' : 'Instalar Agora'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Card variant
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Instalar {appName}</CardTitle>
              <CardDescription>
                Tenha acesso rápido direto da sua tela inicial
              </CardDescription>
            </div>
          </div>
          {showDismiss && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Mobile
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Desktop
            </Badge>
          </div>
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            size="sm"
          >
            {isInstalling ? 'Instalando...' : 'Instalar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};