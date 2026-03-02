import { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseConfiguracoes } from '@/hooks/useSupabaseConfiguracoes';
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
  const [settings, setSettings] = useState<NotificationSettings>(() => {
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
  
  const [notifications, setNotifications] = useState<AgendamentoNotification[]>([]);
  const [lastChecked, setLastChecked] = useState<string>(new Date().toISOString());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shownNotificationsRef = useRef<Set<string>>(new Set());
  const { configuracaoNotificacoes } = useSupabaseConfiguracoes();

  // Inicializar áudio
  useEffect(() => {
    if (settings.soundEnabled) {
      const custom = configuracaoNotificacoes?.som_personalizado;
      const soundType = settings.soundType || 'notification';
      const base = soundType === 'notification' ? 'notification' : soundType;
      const filename = custom || `${base}.mp3`;
      const sundsSrc = `/sunds/${filename}`;
      const sondSrc = `/sond/${filename}`;
      const soundsSrc = `/sounds/${filename}`;
      const audio = new Audio(sundsSrc);
      audio.volume = 0.5;
      audio.preload = 'auto';
      audio.onerror = () => {
        const toSond = new Audio(sondSrc);
        toSond.volume = 0.5;
        toSond.preload = 'auto';
        toSond.onerror = () => {
          const fallback = new Audio(soundsSrc);
          fallback.volume = 0.5;
          fallback.preload = 'auto';
          audioRef.current = fallback;
        };
        audioRef.current = toSond;
      };
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [settings.soundEnabled, settings.soundType, configuracaoNotificacoes?.som_personalizado]);

  // Salvar configurações
  useEffect(() => {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  }, [settings]);

  // Função para tocar som de notificação
  const playNotificationSound = useCallback(async () => {
    if (!settings.soundEnabled) return;

    const tryPlay = async (srcs: string[]) => {
      for (const src of srcs) {
        try {
          const a = new Audio(src);
          a.volume = 0.5;
          a.preload = 'auto';
          await a.play();
          audioRef.current = a;
          return true;
        } catch {
          continue;
        }
      }
      return false;
    };

    const custom = configuracaoNotificacoes?.som_personalizado;
    const soundType = settings.soundType || 'notification';
    const base = soundType === 'notification' ? 'notification' : soundType;
    const filename = custom || `${base}.mp3`;
    const candidates = [
      `/sunds/${filename}`,
      `/sond/${filename}`,
      `/sounds/${filename}`,
    ];

    await tryPlay(candidates);
  }, [settings.soundEnabled]);

  // Função para adicionar nova notificação
  const addNotification = useCallback((agendamento: Omit<AgendamentoNotification, 'shown'>) => {
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
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Função para limpar todas as notificações
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Função para atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Função para verificar novos agendamentos (simula real-time)
  const checkForNewAgendamentos = useCallback((agendamentos: any[]) => {
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
  const requestNotificationPermission = useCallback(async () => {
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
