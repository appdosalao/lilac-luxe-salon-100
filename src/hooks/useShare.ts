import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export const useShare = () => {
  const [isSharing, setIsSharing] = useState(false);

  // Detectar se é mobile/dispositivo com capacidade de compartilhamento nativo
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  // Compartilhar via API nativa ou fallback para WhatsApp
  const shareContent = async (data: ShareData): Promise<boolean> => {
    setIsSharing(true);
    
    try {
      if (canShare) {
        await navigator.share(data);
        return true;
      } else {
        // Fallback para WhatsApp
        const message = `${data.title ? data.title + '\n\n' : ''}${data.text ? data.text + '\n' : ''}${data.url || ''}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        return true;
      }
    } catch (error) {
      // Se o usuário cancelar o compartilhamento nativo, não mostrar erro
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      
      // Para outros erros, fazer fallback para WhatsApp
      const message = `${data.title ? data.title + '\n\n' : ''}${data.text ? data.text + '\n' : ''}${data.url || ''}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      return true;
    } finally {
      setIsSharing(false);
    }
  };

  // Copiar para área de transferência
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "✅ Copiado!",
        description: "Conteúdo copiado para a área de transferência.",
      });
      return true;
    } catch (error) {
      toast({
        title: "❌ Erro ao copiar",
        description: "Não foi possível copiar o conteúdo.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    canShare,
    isSharing,
    shareContent,
    copyToClipboard,
  };
};