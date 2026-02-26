import { useSupabaseConfiguracoes } from './useSupabaseConfiguracoes';
import { useMemo } from 'react';

export const useConfiguracoes = () => {
  const supabaseConfig = useSupabaseConfiguracoes();
  
  // Adaptador para manter compatibilidade com interface existente
  const adaptedConfig = useMemo(() => {
    if (!supabaseConfig.configuracaoHorarios || !supabaseConfig.configuracaoNotificacoes || !supabaseConfig.configuracaoBackup) {
      return {
        ...supabaseConfig,
        configuracoes: null,
        updateConfiguracoes: async () => null,
        isHorarioDisponivel: () => false,
        getHorariosDisponiveis: () => [],
        exportarDados: async () => {},
        enviarBackupPorEmail: async () => false,
      };
    }

    // Converter configurações do Supabase para o formato antigo
    const configuracoes = {
      id: 'supabase-config',
      userId: supabaseConfig.configuracaoHorarios[0]?.user_id || '',
      horarios: {
        diasAtivos: {
          domingo: supabaseConfig.configuracaoHorarios.find(h => h.dia_semana === 0)?.ativo || false,
          segunda: supabaseConfig.configuracaoHorarios.find(h => h.dia_semana === 1)?.ativo || false,
          terca: supabaseConfig.configuracaoHorarios.find(h => h.dia_semana === 2)?.ativo || false,
          quarta: supabaseConfig.configuracaoHorarios.find(h => h.dia_semana === 3)?.ativo || false,
          quinta: supabaseConfig.configuracaoHorarios.find(h => h.dia_semana === 4)?.ativo || false,
          sexta: supabaseConfig.configuracaoHorarios.find(h => h.dia_semana === 5)?.ativo || false,
          sabado: supabaseConfig.configuracaoHorarios.find(h => h.dia_semana === 6)?.ativo || false,
        },
        horarioExpediente: {
          inicio: supabaseConfig.configuracaoHorarios.find(h => h.ativo)?.horario_abertura || '08:00',
          termino: supabaseConfig.configuracaoHorarios.find(h => h.ativo)?.horario_fechamento || '18:00',
        },
        intervaloAlmoco: {
          inicio: supabaseConfig.configuracaoHorarios.find(h => h.intervalo_inicio)?.intervalo_inicio || '12:00',
          termino: supabaseConfig.configuracaoHorarios.find(h => h.intervalo_fim)?.intervalo_fim || '13:00',
        },
        intervalosPersonalizados: [],
      },
      notificacoes: {
        push: { ativo: supabaseConfig.configuracaoNotificacoes.notificacoes_push },
        novosAgendamentos: {
          visual: true,
          sonoro: supabaseConfig.configuracaoNotificacoes.notificacoes_som,
          push: supabaseConfig.configuracaoNotificacoes.notificacoes_push,
          som: 'notification' as const,
        },
        lembretesAgendamento: {
          ativo: true,
          antecedencia: supabaseConfig.configuracaoNotificacoes.lembrete_agendamento_minutos,
          push: supabaseConfig.configuracaoNotificacoes.notificacoes_push,
          sonoro: supabaseConfig.configuracaoNotificacoes.notificacoes_som,
        },
        retornoCronograma: {
          ativo: true,
          push: supabaseConfig.configuracaoNotificacoes.notificacoes_push,
          sonoro: supabaseConfig.configuracaoNotificacoes.notificacoes_som,
        },
        despesasFixas: {
          ativo: true,
          antecedencia: supabaseConfig.configuracaoNotificacoes.lembrete_contas_fixas_dias,
          push: supabaseConfig.configuracaoNotificacoes.notificacoes_push,
          sonoro: supabaseConfig.configuracaoNotificacoes.notificacoes_som,
        },
        servicoFinalizado: {
          ativo: true,
          push: supabaseConfig.configuracaoNotificacoes.notificacoes_push,
          sonoro: supabaseConfig.configuracaoNotificacoes.notificacoes_som,
        },
        tempoAntecedencia: supabaseConfig.configuracaoNotificacoes.lembrete_agendamento_minutos,
      },
      backup: {
        backupAutomatico: supabaseConfig.configuracaoBackup.backup_automatico,
        emailBackup: supabaseConfig.configuracaoBackup.email_backup || '',
        diasSemanaBackup: [0],
        ultimoBackup: supabaseConfig.configuracaoBackup.ultimo_backup,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      ...supabaseConfig,
      configuracoes,
      updateConfiguracoes: async (updates: any) => {
        // Implementar conversão e salvamento
        if (updates.notificacoes) {
          await supabaseConfig.salvarNotificacoes({
            notificacoes_push: updates.notificacoes.push?.ativo || false,
            notificacoes_som: updates.notificacoes.novosAgendamentos?.sonoro || false,
            lembrete_agendamento_minutos: updates.notificacoes.lembretesAgendamento?.antecedencia || 60,
          });
        }
        if (updates.backup) {
          await supabaseConfig.salvarBackup({
            backup_automatico: updates.backup.backupAutomatico || false,
            email_backup: updates.backup.emailBackup || '',
          });
        }
        return configuracoes;
      },
      isHorarioDisponivel: supabaseConfig.verificarDisponibilidade,
      getHorariosDisponiveis: (diaSemana: number, duracaoServico = 60) => {
        return supabaseConfig.getHorariosDisponiveisDia(diaSemana, duracaoServico);
      },
      exportarDados: async () => {
        // Implementar export usando dados do Supabase
        console.log('Export de dados não implementado para Supabase ainda');
      },
      enviarBackupPorEmail: async (email: string) => {
        // Implementar envio por email
        console.log('Envio por email não implementado ainda');
        return false;
      },
    };
  }, [
    supabaseConfig.configuracaoHorarios, 
    supabaseConfig.configuracaoNotificacoes, 
    supabaseConfig.configuracaoBackup,
    supabaseConfig.loading
  ]);

  return adaptedConfig;
};