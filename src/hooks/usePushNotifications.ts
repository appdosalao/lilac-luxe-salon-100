import { useState, useCallback, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const usePushNotifications = () => {
  const { usuario } = useSupabaseAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar suporte a push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  // Verificar se já está inscrito
  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const subscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(subscription.getKey('auth')!)
          }
        };
        setSubscription(subscriptionData);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
    }
  }, []);

  // Converter ArrayBuffer para Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Solicitar permissão e subscrever
  const subscribe = useCallback(async () => {
    if (!isSupported || !usuario) return false;

    setIsLoading(true);
    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Permissão negada",
          description: "As notificações push foram bloqueadas. Ative nas configurações do navegador.",
          variant: "destructive",
        });
        return false;
      }

      // Obter service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Chave pública VAPID (em produção, isso viria do servidor)
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLfgA7X3EgMGvpADQJ1wpQOVWvwG4yA-7XVvPDn5TPBY-A3VoGcEng';
      
      // Subscrever para push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      };

      // Salvar subscription no servidor (simulado)
      await saveSubscriptionToServer(subscriptionData);

      setSubscription(subscriptionData);
      setIsSubscribed(true);

      toast({
        title: "Notificações ativadas!",
        description: "Você receberá notificações push sobre agendamentos e lembretes.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao subscrever push notifications:', error);
      toast({
        title: "Erro ao ativar notificações",
        description: "Não foi possível ativar as notificações push. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, usuario]);

  // Cancelar subscription
  const unsubscribe = useCallback(async () => {
    if (!isSubscribed) return;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await removeSubscriptionFromServer();
      }

      setSubscription(null);
      setIsSubscribed(false);

      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais notificações push.",
      });
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      toast({
        title: "Erro ao desativar notificações",
        description: "Não foi possível desativar as notificações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isSubscribed]);

  // Salvar subscription no servidor (simulado - em produção usar Supabase)
  const saveSubscriptionToServer = async (subscriptionData: PushSubscriptionData) => {
    if (!usuario) return;

    // Em produção, enviar para Supabase
    localStorage.setItem(`push-subscription-${usuario.id}`, JSON.stringify(subscriptionData));
  };

  // Remover subscription do servidor
  const removeSubscriptionFromServer = async () => {
    if (!usuario) return;
    
    localStorage.removeItem(`push-subscription-${usuario.id}`);
  };

  // Enviar notificação de teste
  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed) return;

    try {
      // Simular notificação local para teste
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification('Teste de Notificação', {
          body: 'Esta é uma notificação de teste do seu salão!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: 'test-notification',
          data: {
            url: '/',
            timestamp: Date.now()
          },
        });

        toast({
          title: "Notificação de teste enviada!",
          description: "Verifique se a notificação apareceu.",
        });
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível enviar a notificação de teste.",
        variant: "destructive",
      });
    }
  }, [isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    subscription,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkSubscription
  };
};