import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export type NivelLog = 'info' | 'warning' | 'error' | 'critical';
export type CategoriaLog = 'auth' | 'agendamento' | 'financeiro' | 'cliente' | 'servico' | 'cronograma' | 'sistema' | 'backup';

export interface LogSistema {
  nivel: NivelLog;
  categoria: CategoriaLog;
  acao: string;
  descricao: string;
  entidade_tipo?: string;
  entidade_id?: string;
  metadados?: Record<string, any>;
}

export function useAuditoriaGlobal() {
  const { user } = useSupabaseAuth();

  const logarAcao = useCallback(async (log: LogSistema) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('logs_sistema')
        .insert({
          user_id: user.id,
          nivel: log.nivel,
          categoria: log.categoria,
          acao: log.acao,
          descricao: log.descricao,
          entidade_tipo: log.entidade_tipo,
          entidade_id: log.entidade_id,
          metadados: log.metadados || {},
          ip_address: null, // Será preenchido pelo servidor se necessário
          user_agent: navigator.userAgent,
        });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }, [user?.id]);

  // Logs específicos para cada módulo
  const logAgendamento = {
    criar: (agendamentoId: string, clienteNome: string, servicoNome: string) =>
      logarAcao({
        nivel: 'info',
        categoria: 'agendamento',
        acao: 'criar',
        descricao: `Agendamento criado para ${clienteNome} - ${servicoNome}`,
        entidade_tipo: 'agendamento',
        entidade_id: agendamentoId,
        metadados: { clienteNome, servicoNome }
      }),

    atualizar: (agendamentoId: string, campo: string, valorAnterior: any, valorNovo: any) =>
      logarAcao({
        nivel: 'info',
        categoria: 'agendamento',
        acao: 'atualizar',
        descricao: `Agendamento atualizado: ${campo} alterado`,
        entidade_tipo: 'agendamento',
        entidade_id: agendamentoId,
        metadados: { campo, valorAnterior, valorNovo }
      }),

    cancelar: (agendamentoId: string, motivo?: string) =>
      logarAcao({
        nivel: 'warning',
        categoria: 'agendamento',
        acao: 'cancelar',
        descricao: `Agendamento cancelado${motivo ? `: ${motivo}` : ''}`,
        entidade_tipo: 'agendamento',
        entidade_id: agendamentoId,
        metadados: { motivo }
      }),

    concluir: (agendamentoId: string, valorPago: number) =>
      logarAcao({
        nivel: 'info',
        categoria: 'agendamento',
        acao: 'concluir',
        descricao: `Agendamento concluído - R$ ${valorPago.toFixed(2)}`,
        entidade_tipo: 'agendamento',
        entidade_id: agendamentoId,
        metadados: { valorPago }
      }),
  };

  const logFinanceiro = {
    criarLancamento: (lancamentoId: string, tipo: string, valor: number, descricao: string) =>
      logarAcao({
        nivel: 'info',
        categoria: 'financeiro',
        acao: 'criar_lancamento',
        descricao: `Lançamento ${tipo}: R$ ${valor.toFixed(2)} - ${descricao}`,
        entidade_tipo: 'lancamento',
        entidade_id: lancamentoId,
        metadados: { tipo, valor, descricao }
      }),

    pagarConta: (contaId: string, nome: string, valor: number) =>
      logarAcao({
        nivel: 'info',
        categoria: 'financeiro',
        acao: 'pagar_conta',
        descricao: `Conta paga: ${nome} - R$ ${valor.toFixed(2)}`,
        entidade_tipo: 'conta_fixa',
        entidade_id: contaId,
        metadados: { nome, valor }
      }),

    backup: (sucesso: boolean, detalhes?: string) =>
      logarAcao({
        nivel: sucesso ? 'info' : 'error',
        categoria: 'financeiro',
        acao: 'backup',
        descricao: `Backup ${sucesso ? 'realizado com sucesso' : 'falhou'}${detalhes ? `: ${detalhes}` : ''}`,
        metadados: { sucesso, detalhes }
      }),
  };

  const logCliente = {
    criar: (clienteId: string, nome: string) =>
      logarAcao({
        nivel: 'info',
        categoria: 'cliente',
        acao: 'criar',
        descricao: `Cliente criado: ${nome}`,
        entidade_tipo: 'cliente',
        entidade_id: clienteId,
        metadados: { nome }
      }),

    atualizar: (clienteId: string, nome: string) =>
      logarAcao({
        nivel: 'info',
        categoria: 'cliente',
        acao: 'atualizar',
        descricao: `Cliente atualizado: ${nome}`,
        entidade_tipo: 'cliente',
        entidade_id: clienteId,
        metadados: { nome }
      }),

    deletar: (clienteId: string, nome: string) =>
      logarAcao({
        nivel: 'warning',
        categoria: 'cliente',
        acao: 'deletar',
        descricao: `Cliente deletado: ${nome}`,
        entidade_tipo: 'cliente',
        entidade_id: clienteId,
        metadados: { nome }
      }),
  };

  const logServico = {
    criar: (servicoId: string, nome: string, valor: number) =>
      logarAcao({
        nivel: 'info',
        categoria: 'servico',
        acao: 'criar',
        descricao: `Serviço criado: ${nome} - R$ ${valor.toFixed(2)}`,
        entidade_tipo: 'servico',
        entidade_id: servicoId,
        metadados: { nome, valor }
      }),

    atualizar: (servicoId: string, nome: string) =>
      logarAcao({
        nivel: 'info',
        categoria: 'servico',
        acao: 'atualizar',
        descricao: `Serviço atualizado: ${nome}`,
        entidade_tipo: 'servico',
        entidade_id: servicoId,
        metadados: { nome }
      }),

    deletar: (servicoId: string, nome: string) =>
      logarAcao({
        nivel: 'warning',
        categoria: 'servico',
        acao: 'deletar',
        descricao: `Serviço deletado: ${nome}`,
        entidade_tipo: 'servico',
        entidade_id: servicoId,
        metadados: { nome }
      }),
  };

  const logCronograma = {
    criar: (cronogramaId: string, clienteNome: string, servicoNome: string) =>
      logarAcao({
        nivel: 'info',
        categoria: 'cronograma',
        acao: 'criar',
        descricao: `Cronograma criado: ${clienteNome} - ${servicoNome}`,
        entidade_tipo: 'cronograma',
        entidade_id: cronogramaId,
        metadados: { clienteNome, servicoNome }
      }),

    ativar: (cronogramaId: string, agendamentosCriados: number) =>
      logarAcao({
        nivel: 'info',
        categoria: 'cronograma',
        acao: 'ativar',
        descricao: `Cronograma ativado: ${agendamentosCriados} agendamentos criados`,
        entidade_tipo: 'cronograma',
        entidade_id: cronogramaId,
        metadados: { agendamentosCriados }
      }),

    cancelar: (cronogramaId: string) =>
      logarAcao({
        nivel: 'warning',
        categoria: 'cronograma',
        acao: 'cancelar',
        descricao: 'Cronograma cancelado',
        entidade_tipo: 'cronograma',
        entidade_id: cronogramaId,
      }),
  };

  const logSistema = {
    login: () =>
      logarAcao({
        nivel: 'info',
        categoria: 'auth',
        acao: 'login',
        descricao: 'Usuário fez login no sistema',
      }),

    logout: () =>
      logarAcao({
        nivel: 'info',
        categoria: 'auth',
        acao: 'logout',
        descricao: 'Usuário fez logout do sistema',
      }),

    configuracao: (tipo: string, descricao: string) =>
      logarAcao({
        nivel: 'info',
        categoria: 'sistema',
        acao: 'configuracao',
        descricao: `Configuração alterada: ${tipo} - ${descricao}`,
        metadados: { tipo }
      }),

    erro: (erro: string, contexto?: string) =>
      logarAcao({
        nivel: 'error',
        categoria: 'sistema',
        acao: 'erro',
        descricao: `Erro no sistema: ${erro}`,
        metadados: { erro, contexto }
      }),
  };

  return {
    logarAcao,
    logAgendamento,
    logFinanceiro,
    logCliente,
    logServico,
    logCronograma,
    logSistema,
  };
}