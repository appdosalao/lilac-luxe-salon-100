import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useDatabase } from '@/hooks/useDatabase';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { NotificacaoAgendamento } from './NotificacaoAgendamento';

interface NotificationContextType {
  checkForNewAgendamentos: (agendamentos: any[]) => void;
  scheduleAppointmentReminder: (agendamento: any, minutosAntes?: number) => Promise<void>;
  notifyNewAppointment: (agendamento: any) => Promise<void>;
  notifyServiceCompleted: (agendamento: any) => Promise<void>;
  handleNewAppointment: (agendamento: any) => Promise<void>;
  handleServiceCompleted: (agendamento: any) => Promise<void>;
  handleExpenseReminder: (despesa: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext deve ser usado dentro de NotificationProviderAvancado');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProviderAvancado = ({ children }: NotificationProviderProps) => {
  const { checkForNewAgendamentos } = useNotifications();
  const { isSubscribed } = usePushNotifications();
  const { 
    scheduleAppointmentReminder, 
    notifyNewAppointment, 
    notifyServiceCompleted,
    checkPendingNotifications 
  } = useNotificationScheduler();
  const {
    handleNewAppointment,
    handleServiceCompleted,
    handleExpenseReminder
  } = useEnhancedNotifications();
  const { agendamentos, contasFixas } = useDatabase();
  const { configuracoes } = useConfiguracoes();

  // Monitorar mudanças nos agendamentos
  useEffect(() => {
    if (agendamentos.length > 0) {
      checkForNewAgendamentos(agendamentos);
      
      // Agendar lembretes para novos agendamentos
      agendamentos.forEach(agendamento => {
        if (configuracoes?.notificacoes?.lembretesAgendamento?.ativo) {
          const minutosAntes = configuracoes.notificacoes.lembretesAgendamento.antecedencia;
          scheduleAppointmentReminder(agendamento, minutosAntes);
        }
      });
    }
  }, [agendamentos, checkForNewAgendamentos, scheduleAppointmentReminder, configuracoes]);

  // Monitorar despesas fixas e agendar lembretes
  useEffect(() => {
    if (contasFixas.length > 0 && configuracoes?.notificacoes?.despesasFixas?.ativo) {
      // Lógica para agendar lembretes de despesas fixas
      // Implementar baseado na data de vencimento
    }
  }, [contasFixas, configuracoes]);

  // Verificação periódica de notificações pendentes
  useEffect(() => {
    const interval = setInterval(() => {
      checkPendingNotifications();
    }, 5 * 60 * 1000); // A cada 5 minutos

    return () => clearInterval(interval);
  }, [checkPendingNotifications]);

  // Simular verificação periódica de novos agendamentos
  useEffect(() => {
    const interval = setInterval(() => {
      if (agendamentos.length > 0) {
        checkForNewAgendamentos(agendamentos);
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [agendamentos, checkForNewAgendamentos]);

  const contextValue: NotificationContextType = {
    checkForNewAgendamentos,
    scheduleAppointmentReminder,
    notifyNewAppointment,
    notifyServiceCompleted,
    handleNewAppointment,
    handleServiceCompleted,
    handleExpenseReminder,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificacaoAgendamento />
    </NotificationContext.Provider>
  );
};