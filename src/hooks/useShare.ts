import * as React from 'react';

const { useState } = React;
import { toast } from 'sonner';

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
      toast.success("✅ Copiado! Conteúdo copiado para a área de transferência.");
      return true;
    } catch (error) {
      toast.error("❌ Erro ao copiar. Não foi possível copiar o conteúdo.");
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