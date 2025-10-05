import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface NotificationSettings {
  soundEnabled: boolean;
  visualEnabled: boolean;
  autoHide: boolean;
  hideDelay: number;
  soundType: 'notification' | 'notification2' | 'notification3';
}

interface AgendamentoNotification {
  id: string;
  clienteNome: string;
  servicoNome: string;
  data: string;
  horario: string;
  origem: 'manual' | 'cronograma' | 'online';
  criadoEm: string;
  shown: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  visualEnabled: true,
  autoHide: true,
  hideDelay: 10000, // 10 segundos
  soundType: 'notification',
};

export const useNotifications = () => {
  const { usuario } = useSupabaseAuth();
  const [settings, setSettings] = React.useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      const parsedSettings = JSON.parse(saved);
      // Garantir que todas as propriedades existem (migração de versões antigas)
      return {
        ...DEFAULT_SETTINGS,
        ...parsedSettings,
      };
    }
    return DEFAULT_SETTINGS;
  });
  
  const [notifications, setNotifications] = React.useState<AgendamentoNotification[]>([]);
  const [lastChecked, setLastChecked] = React.useState<string>(new Date().toISOString());
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const shownNotificationsRef = React.useRef<Set<string>>(new Set());

  // Inicializar áudio
  React.useEffect(() => {
    if (settings.soundEnabled) {
      // Garantir que soundType existe e tem um valor válido
      const soundType = settings.soundType || 'notification';
      const soundFile = soundType === 'notification' ? 'notification' : soundType;
      audioRef.current = new Audio(`/sounds/${soundFile}.mp3`);
      audioRef.current.volume = 0.5;
      audioRef.current.preload = 'auto';
    }

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [settings.soundEnabled, settings.soundType]);

  // Salvar configurações
  React.useEffect(() => {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  }, [settings]);

  // Função para tocar som de notificação
  const playNotificationSound = React.useCallback(async () => {
    if (!settings.soundEnabled || !audioRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      // Falha silenciosa - alguns navegadores bloqueiam autoplay
      console.log('Não foi possível reproduzir som de notificação:', error);
    }
  }, [settings.soundEnabled]);

  // Função para adicionar nova notificação
  const addNotification = React.useCallback((agendamento: Omit<AgendamentoNotification, 'shown'>) => {
    if (!usuario || !settings.visualEnabled) return;

    // Verificar se já foi mostrada
    if (shownNotificationsRef.current.has(agendamento.id)) return;

    const newNotification = { ...agendamento, shown: false };
    setNotifications(prev => [newNotification, ...prev.slice(0, 2)]); // Máximo 3 notificações
    shownNotificationsRef.current.add(agendamento.id);

    // Tocar som
    playNotificationSound();

    toast.success(`Novo Agendamento! ${agendamento.clienteNome} - ${agendamento.servicoNome}`);

    // Auto-hide se habilitado
    if (settings.autoHide) {
      setTimeout(() => {
        removeNotification(agendamento.id);
      }, settings.hideDelay);
    }
  }, [usuario, settings, playNotificationSound]);

  // Função para remover notificação
  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Função para limpar todas as notificações
  const clearAllNotifications = React.useCallback(() => {
    setNotifications([]);
  }, []);

  // Função para atualizar configurações
  const updateSettings = React.useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Função para verificar novos agendamentos (simula real-time)
  const checkForNewAgendamentos = React.useCallback((agendamentos: any[]) => {
    if (!usuario) return;

    const newAgendamentos = agendamentos.filter(agendamento => {
      // Filtrar apenas agendamentos do usuário logado
      if (agendamento.userId !== usuario.id) return false;
      
      // Verificar se foi criado após última verificação
      const criadoEm = new Date(agendamento.createdAt);
      const ultimaVerificacao = new Date(lastChecked);
      
      return criadoEm > ultimaVerificacao && !shownNotificationsRef.current.has(agendamento.id);
    });

    if (newAgendamentos.length > 0) {
      newAgendamentos.forEach(agendamento => {
        const origem = agendamento.origem || 'manual';
        const origemText = origem === 'online' ? 'Agendamento Online' : 
                          origem === 'cronograma' ? 'Agendamento Automático' : 
                          'Agendamento Manual';

        addNotification({
          id: agendamento.id,
          clienteNome: agendamento.clienteNome,
          servicoNome: agendamento.servicoNome,
          data: agendamento.data,
          horario: agendamento.hora,
          origem: origem,
          criadoEm: agendamento.createdAt,
        });
      });

      setLastChecked(new Date().toISOString());
    }
  }, [usuario, lastChecked, addNotification]);

  // Função para solicitar permissão de notificação
  const requestNotificationPermission = React.useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  return {
    notifications,
    settings,
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateSettings,
    checkForNewAgendamentos,
    requestNotificationPermission,
    playNotificationSound,
  };
};