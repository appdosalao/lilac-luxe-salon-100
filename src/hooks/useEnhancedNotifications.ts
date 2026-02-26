import { useCallback, useRef, useEffect } from 'react';
import { useNotifications } from './useNotifications';
import { usePushNotifications } from './usePushNotifications';
import { useNotificationScheduler } from './useNotificationScheduler';
import { useConfiguracoes } from './useConfiguracoes';
import { toast } from '@/hooks/use-toast';

export const useEnhancedNotifications = () => {
  const { playNotificationSound } = useNotifications();
  const { isSubscribed } = usePushNotifications();
  const { 
    notifyNewAppointment, 
    notifyServiceCompleted, 
    scheduleAppointmentReminder 
  } = useNotificationScheduler();
  const { configuracoes } = useConfiguracoes();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Função personalizada para tocar som baseado na configuração
  const playCustomSound = useCallback(async (soundType?: 'notification' | 'notification2' | 'notification3') => {
    if (!soundType) return;

    try {
      const soundFile = soundType === 'notification' ? 'notification' : soundType;
      if (!audioRef.current || audioRef.current.src !== `/sounds/${soundFile}.mp3`) {
        audioRef.current = new Audio(`/sounds/${soundFile}.mp3`);
        audioRef.current.volume = 0.7;
        audioRef.current.preload = 'auto';
      }
      
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.log('Erro ao reproduzir som:', error);
    }
  }, []);

  // Notificar novo agendamento com todas as opções configuradas
  const handleNewAppointment = useCallback(async (agendamento: any) => {
    if (!configuracoes?.notificacoes) return;

    const config = configuracoes.notificacoes.novosAgendamentos;

    // Notificação visual (toast)
    if (config.visual) {
      toast({
        title: "Novo Agendamento!",
        description: `${agendamento.clienteNome} agendou ${agendamento.servicoNome} para ${agendamento.data} às ${agendamento.hora}`,
        duration: 5000,
      });
    }

    // Som personalizado
    if (config.sonoro) {
      await playCustomSound(config.som);
    }

    // Push notification
    if (config.push && isSubscribed) {
      await notifyNewAppointment(agendamento);
    }

    // Agendar lembrete se configurado
    if (configuracoes.notificacoes.lembretesAgendamento.ativo) {
      const minutosAntes = configuracoes.notificacoes.lembretesAgendamento.antecedencia;
      await scheduleAppointmentReminder(agendamento, minutosAntes);
    }
  }, [configuracoes, playNotificationSound, isSubscribed, notifyNewAppointment, scheduleAppointmentReminder]);

  // Notificar serviço finalizado
  const handleServiceCompleted = useCallback(async (agendamento: any) => {
    if (!configuracoes?.notificacoes?.servicoFinalizado?.ativo) return;

    const config = configuracoes.notificacoes.servicoFinalizado;

    // Toast
    toast({
      title: "Serviço Finalizado",
      description: `${agendamento.servicoNome} para ${agendamento.clienteNome} foi concluído`,
      duration: 3000,
    });

    // Som personalizado
    if (config.sonoro) {
      await playCustomSound('notification2'); // Som diferente para serviço finalizado
    }

    // Push notification
    if (config.push && isSubscribed) {
      await notifyServiceCompleted(agendamento);
    }
  }, [configuracoes, playNotificationSound, isSubscribed, notifyServiceCompleted]);

  // Lembrete de despesa fixa
  const handleExpenseReminder = useCallback(async (despesa: any) => {
    if (!configuracoes?.notificacoes?.despesasFixas?.ativo) return;

    const config = configuracoes.notificacoes.despesasFixas;
    const diasRestantes = Math.ceil((new Date(despesa.dataVencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Toast
    toast({
      title: "Lembrete de Despesa",
      description: `${despesa.descricao} vence em ${diasRestantes} dias - R$ ${despesa.valor.toFixed(2)}`,
      duration: 8000,
    });

    // Som personalizado
    if (config.sonoro) {
      await playCustomSound('notification3'); // Som diferente para despesas
    }

    // Push notification seria implementada aqui
  }, [configuracoes, playNotificationSound]);

  return {
    handleNewAppointment,
    handleServiceCompleted,
    handleExpenseReminder,
  };
};