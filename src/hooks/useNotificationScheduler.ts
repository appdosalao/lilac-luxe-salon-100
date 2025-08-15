import { useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from './usePushNotifications';
import { toast } from '@/hooks/use-toast';
import { TipoNotificacao } from '@/types/notificacao';

interface ScheduledNotification {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  programadaPara: Date;
  dados?: Record<string, any>;
}

export const useNotificationScheduler = () => {
  const { usuario } = useAuth();
  const { isSubscribed } = usePushNotifications();

  // Agendar notificação
  const scheduleNotification = useCallback(async (notification: ScheduledNotification) => {
    if (!usuario || !isSubscribed) return;

    try {
      // Calcular delay até a notificação
      const now = new Date();
      const delay = notification.programadaPara.getTime() - now.getTime();

      if (delay <= 0) {
        // Se já passou do horário, enviar imediatamente
        await sendImmediateNotification(notification);
        return;
      }

      // Usar setTimeout para notificações próximas (até 24h)
      if (delay <= 24 * 60 * 60 * 1000) {
        setTimeout(async () => {
          await sendImmediateNotification(notification);
        }, delay);

        // Salvar no localStorage para persistência
        const scheduledNotifications = getScheduledNotifications();
        scheduledNotifications.push({
          ...notification,
          programadaPara: notification.programadaPara.toISOString()
        });
        localStorage.setItem(`scheduled-notifications-${usuario.id}`, JSON.stringify(scheduledNotifications));
      } else {
        // Para notificações mais distantes, apenas salvar no localStorage
        // e verificar periodicamente
        const scheduledNotifications = getScheduledNotifications();
        scheduledNotifications.push({
          ...notification,
          programadaPara: notification.programadaPara.toISOString()
        });
        localStorage.setItem(`scheduled-notifications-${usuario.id}`, JSON.stringify(scheduledNotifications));
      }
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
    }
  }, [usuario, isSubscribed]);

  // Obter notificações agendadas
  const getScheduledNotifications = useCallback(() => {
    if (!usuario) return [];
    
    const stored = localStorage.getItem(`scheduled-notifications-${usuario.id}`);
    return stored ? JSON.parse(stored) : [];
  }, [usuario]);

  // Enviar notificação imediata
  const sendImmediateNotification = useCallback(async (notification: ScheduledNotification) => {
    if (!isSubscribed) return;

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        const options = {
          body: notification.mensagem,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          
          tag: `${notification.tipo}-${notification.id}`,
          data: {
            ...notification.dados,
            notificationId: notification.id,
            tipo: notification.tipo,
            timestamp: Date.now()
          }
        };

        await registration.showNotification(notification.titulo, options);

        // Remover da lista de agendadas
        removeScheduledNotification(notification.id);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }, [isSubscribed]);


  // Remover notificação agendada
  const removeScheduledNotification = useCallback((notificationId: string) => {
    if (!usuario) return;

    const scheduledNotifications = getScheduledNotifications();
    const filtered = scheduledNotifications.filter((n: any) => n.id !== notificationId);
    localStorage.setItem(`scheduled-notifications-${usuario.id}`, JSON.stringify(filtered));
  }, [usuario, getScheduledNotifications]);

  // Verificar notificações pendentes (executar periodicamente)
  const checkPendingNotifications = useCallback(async () => {
    if (!usuario || !isSubscribed) return;

    const scheduledNotifications = getScheduledNotifications();
    const now = new Date();

    for (const notification of scheduledNotifications) {
      const scheduledTime = new Date(notification.programadaPara);
      
      if (scheduledTime <= now) {
        await sendImmediateNotification({
          ...notification,
          programadaPara: scheduledTime
        });
      }
    }
  }, [usuario, isSubscribed, getScheduledNotifications, sendImmediateNotification]);

  // Agendar lembrete de agendamento
  const scheduleAppointmentReminder = useCallback(async (agendamento: any, minutosAntes: number = 60) => {
    const agendamentoDate = new Date(`${agendamento.data}T${agendamento.hora}`);
    const reminderTime = new Date(agendamentoDate.getTime() - (minutosAntes * 60 * 1000));

    await scheduleNotification({
      id: `reminder-${agendamento.id}`,
      tipo: 'lembrete_agendamento',
      titulo: 'Lembrete de Agendamento',
      mensagem: `${agendamento.clienteNome} tem agendamento em ${minutosAntes} minutos - ${agendamento.servicoNome}`,
      programadaPara: reminderTime,
      dados: {
        agendamentoId: agendamento.id,
        clienteNome: agendamento.clienteNome,
        servicoNome: agendamento.servicoNome,
        data: agendamento.data,
        horario: agendamento.hora
      }
    });
  }, [scheduleNotification]);

  // Agendar lembrete de despesa fixa
  const scheduleExpenseReminder = useCallback(async (contaFixa: any, diasAntes: number = 7) => {
    const vencimentoDate = new Date(contaFixa.dataVencimento);
    const reminderTime = new Date(vencimentoDate.getTime() - (diasAntes * 24 * 60 * 60 * 1000));

    await scheduleNotification({
      id: `expense-${contaFixa.id}`,
      tipo: 'despesa_fixa',
      titulo: 'Lembrete de Despesa Fixa',
      mensagem: `${contaFixa.descricao} vence em ${diasAntes} dias - R$ ${contaFixa.valor.toFixed(2)}`,
      programadaPara: reminderTime,
      dados: {
        contaFixaId: contaFixa.id,
        descricao: contaFixa.descricao,
        valor: contaFixa.valor,
        dataVencimento: contaFixa.dataVencimento,
        diasRestantes: diasAntes
      }
    });
  }, [scheduleNotification]);

  // Notificar novo agendamento
  const notifyNewAppointment = useCallback(async (agendamento: any) => {
    await sendImmediateNotification({
      id: `new-appointment-${agendamento.id}`,
      tipo: 'novo_agendamento',
      titulo: 'Novo Agendamento!',
      mensagem: `${agendamento.clienteNome} agendou ${agendamento.servicoNome} para ${agendamento.data} às ${agendamento.hora}`,
      programadaPara: new Date(),
      dados: {
        agendamentoId: agendamento.id,
        clienteNome: agendamento.clienteNome,
        servicoNome: agendamento.servicoNome,
        data: agendamento.data,
        horario: agendamento.hora,
        origem: agendamento.origem || 'manual'
      }
    });
  }, [sendImmediateNotification]);

  // Notificar serviço finalizado
  const notifyServiceCompleted = useCallback(async (agendamento: any) => {
    await sendImmediateNotification({
      id: `service-completed-${agendamento.id}`,
      tipo: 'servico_finalizado',
      titulo: 'Serviço Finalizado',
      mensagem: `Serviço de ${agendamento.servicoNome} para ${agendamento.clienteNome} foi finalizado`,
      programadaPara: new Date(),
      dados: {
        agendamentoId: agendamento.id,
        clienteNome: agendamento.clienteNome,
        servicoNome: agendamento.servicoNome,
        valor: agendamento.valor
      }
    });
  }, [sendImmediateNotification]);

  // Verificar notificações pendentes a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(checkPendingNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkPendingNotifications]);

  return {
    scheduleNotification,
    scheduleAppointmentReminder,
    scheduleExpenseReminder,
    notifyNewAppointment,
    notifyServiceCompleted,
    checkPendingNotifications,
    getScheduledNotifications,
    removeScheduledNotification
  };
};