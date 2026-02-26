import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseConfiguracoes } from './useSupabaseConfiguracoes';
import { toast } from 'sonner';
import { Notificacao, TipoNotificacao } from '@/types/notificacao';

export function useNotificacaoGlobal() {
  const { user } = useSupabaseAuth();
  const { configuracaoNotificacoes } = useSupabaseConfiguracoes();

  // Função para criar notificação
  const criarNotificacao = async (
    tipo: TipoNotificacao,
    titulo: string,
    mensagem: string,
    dados?: Record<string, any>,
    programadaPara?: string
  ) => {
    if (!user?.id) return;

    try {
      // Mostrar notificação visual se configurado
      if (configuracaoNotificacoes?.notificacoes_push) {
        toast(titulo, {
          description: mensagem,
          duration: 5000,
        });
      }

      // Tocar som se configurado
      if (configuracaoNotificacoes?.notificacoes_som) {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(console.error);
      }

    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  // Notificações específicas para cada evento
  const notificarNovoAgendamento = (clienteNome: string, servicoNome: string, data: string, horario: string, origem?: string) => {
    if (!configuracaoNotificacoes?.notificar_novos_agendamentos) return;
    
    criarNotificacao(
      'novo_agendamento',
      'Novo Agendamento',
      `${clienteNome} agendou ${servicoNome} para ${data} às ${horario}`,
      { clienteNome, servicoNome, data, horario, origem }
    );
  };

  const notificarLembreteAgendamento = (clienteNome: string, servicoNome: string, data: string, horario: string) => {
    criarNotificacao(
      'lembrete_agendamento',
      'Lembrete de Agendamento',
      `${clienteNome} tem agendamento de ${servicoNome} hoje às ${horario}`,
      { clienteNome, servicoNome, data, horario }
    );
  };

  const notificarRetornoCronograma = (clienteNome: string, servicoNome: string, dataRetorno: string) => {
    criarNotificacao(
      'retorno_cronograma',
      'Retorno de Cronograma',
      `${clienteNome} tem retorno de ${servicoNome} agendado para ${dataRetorno}`,
      { clienteNome, servicoNome, dataRetorno }
    );
  };

  const notificarDespesaFixa = (descricao: string, valor: number, dataVencimento: string, diasRestantes: number) => {
    if (!configuracaoNotificacoes?.lembrete_contas_fixas_dias) return;
    
    criarNotificacao(
      'despesa_fixa',
      'Despesa Fixa Vencendo',
      `${descricao} vence em ${diasRestantes} dias (${dataVencimento}) - R$ ${valor.toFixed(2)}`,
      { descricao, valor, dataVencimento, diasRestantes }
    );
  };

  const notificarServicoFinalizado = (clienteNome: string, servicoNome: string, valor?: number) => {
    if (!configuracaoNotificacoes?.notificar_pagamentos) return;
    
    criarNotificacao(
      'servico_finalizado',
      'Serviço Finalizado',
      `Serviço ${servicoNome} para ${clienteNome} foi finalizado${valor ? ` - R$ ${valor.toFixed(2)}` : ''}`,
      { clienteNome, servicoNome, valor }
    );
  };

  // Listener para agendamentos em tempo real
  useEffect(() => {
    if (!user?.id) return;

    const agendamentosChannel = supabase
      .channel('agendamentos_notificacoes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agendamentos',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const agendamento = payload.new as any;
        notificarNovoAgendamento(
          agendamento.cliente_nome || 'Cliente',
          agendamento.servico_nome || 'Serviço',
          agendamento.data,
          agendamento.hora,
          agendamento.origem
        );
      })
      .subscribe();

    const contasFixasChannel = supabase
      .channel('contas_fixas_notificacoes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'contas_fixas',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const conta = payload.new as any;
        // Verificar se está próximo do vencimento
        const hoje = new Date();
        const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), conta.data_vencimento);
        const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes <= (configuracaoNotificacoes?.lembrete_contas_fixas_dias || 5)) {
          notificarDespesaFixa(conta.nome, conta.valor, dataVencimento.toLocaleDateString(), diasRestantes);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(agendamentosChannel);
      supabase.removeChannel(contasFixasChannel);
    };
  }, [user?.id, configuracaoNotificacoes]);

  return {
    criarNotificacao,
    notificarNovoAgendamento,
    notificarLembreteAgendamento,
    notificarRetornoCronograma,
    notificarDespesaFixa,
    notificarServicoFinalizado,
  };
}