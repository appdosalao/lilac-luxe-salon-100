import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useState } from 'react';

interface UpdatePromptProps {
  variant?: 'banner' | 'card' | 'floating';
  showDismiss?: boolean;
}

export const UpdatePrompt = ({ variant = 'floating', showDismiss = true }: UpdatePromptProps) => {
  const { hasUpdate, updateApp } = usePWA();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!hasUpdate || isDismissed) return null;

  const handleUpdate = () => {
    setIsUpdating(true);
    updateApp();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (variant === 'banner') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-3 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5" />
            <div>
              <p className="font-medium">Nova versão disponível</p>
              <p className="text-sm opacity-90">Atualize para a versão mais recente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              variant="secondary"
              size="sm"
            >
              {isUpdating ? 'Atualizando...' : 'Atualizar'}
            </Button>
            {showDismiss && (
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
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
      <div className="fixed bottom-4 left-4 z-50">
        <Card className="w-80 shadow-xl border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg text-blue-900">Atualização</CardTitle>
              </div>
              {showDismiss && (
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardDescription className="text-blue-700">
              Nova versão disponível com melhorias e correções
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? 'Atualizando...' : 'Atualizar Agora'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Card variant
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-blue-900">Nova Versão Disponível</CardTitle>
              <CardDescription className="text-blue-700">
                Atualize para ter acesso às últimas melhorias
              </CardDescription>
            </div>
          </div>
          {showDismiss && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-end">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};