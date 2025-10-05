import React, { useMemo } from 'react';
import { useSupabaseAgendamentos } from './useSupabaseAgendamentos';
import { useServicos } from './useServicos';
import { useSupabaseClientes } from './useSupabaseClientes';

export function useAgendamentos() {
  const agendamentosData = useSupabaseAgendamentos();
  const { todosServicos: servicos } = useServicos();
  const { clientes } = useSupabaseClientes();

  // Enriquecer agendamentos com nomes completos de clientes e serviços
  const todosAgendamentos = useMemo(() => {
    const agendamentos = agendamentosData.todosAgendamentos || [];
    return agendamentos.map(agendamento => {
      const cliente = clientes.find(c => c.id === agendamento.clienteId);
      const servico = servicos.find(s => s.id === agendamento.servicoId);
      
      return {
        ...agendamento,
        clienteNome: cliente?.nome || cliente?.nomeCompleto || agendamento.clienteNome || 'Cliente não encontrado',
        servicoNome: servico?.nome || agendamento.servicoNome || 'Serviço não encontrado',
        servicoValor: servico?.valor || agendamento.valor || 0,
        servicoDuracao: servico?.duracao || agendamento.duracao || 30,
        // Informações adicionais para a agenda
        clienteEmail: cliente?.email || '',
        clienteTelefone: cliente?.telefone || '',
        servicoDescricao: servico?.descricao || ''
      };
    });
  }, [agendamentosData.todosAgendamentos, clientes, servicos]);

  // Agendamentos filtrados também com nomes completos
  const agendamentosFiltradosEnriquecidos = useMemo(() => {
    const agendamentos = agendamentosData.agendamentosFiltrados || [];
    return agendamentos.map(agendamento => {
      const cliente = clientes.find(c => c.id === agendamento.clienteId);
      const servico = servicos.find(s => s.id === agendamento.servicoId);
      
      return {
        ...agendamento,
        clienteNome: cliente?.nome || cliente?.nomeCompleto || agendamento.clienteNome || 'Cliente não encontrado',
        servicoNome: servico?.nome || agendamento.servicoNome || 'Serviço não encontrado',
        servicoValor: servico?.valor || agendamento.valor || 0,
        servicoDuracao: servico?.duracao || agendamento.duracao || 30,
        // Informações adicionais para a agenda
        clienteEmail: cliente?.email || '',
        clienteTelefone: cliente?.telefone || '',
        servicoDescricao: servico?.descricao || ''
      };
    });
  }, [agendamentosData.agendamentosFiltrados, clientes, servicos]);

  // Verificar conflito de horário
  const verificarConflito = (agendamento: any, excluirId?: string) => {
    if (!agendamento.data || !agendamento.hora || !agendamento.duracao) {
      return false;
    }

    const dataHora = new Date(`${agendamento.data}T${agendamento.hora}`);
    const fimAgendamento = new Date(dataHora.getTime() + agendamento.duracao * 60000);

    return agendamentosData.todosAgendamentos.some(ag => {
      if (ag.id === excluirId) return false;
      if (ag.data !== agendamento.data) return false;

      const dataHoraExistente = new Date(`${ag.data}T${ag.hora}`);
      const fimExistente = new Date(dataHoraExistente.getTime() + ag.duracao * 60000);

      return (
        (dataHora >= dataHoraExistente && dataHora < fimExistente) ||
        (fimAgendamento > dataHoraExistente && fimAgendamento <= fimExistente) ||
        (dataHora <= dataHoraExistente && fimAgendamento >= fimExistente)
      );
    });
  };

  const criarAgendamento = async (novoAgendamento: any) => {
    const servico = servicos.find(s => s.id === novoAgendamento.servicoId);
    if (!servico) {
      console.error('Serviço não encontrado');
      return false;
    }

    // Verificar se horário está dentro das configurações usando as funções do Supabase
    const horarioDisponivel = await agendamentosData.verificarHorarioDisponivel?.(
      novoAgendamento.data, 
      novoAgendamento.hora
    );
    
    if (!horarioDisponivel) {
      console.error('Horário não está disponível nas configurações de trabalho');
      return false;
    }

    const agendamentoCompleto = {
      ...novoAgendamento,
      duracao: servico.duracao,
      valor: novoAgendamento.valor || servico.valor,
      valorPago: novoAgendamento.valorPago || 0,
      valorDevido: novoAgendamento.valorDevido || novoAgendamento.valor || servico.valor,
      formaPagamento: novoAgendamento.formaPagamento || 'fiado',
      statusPagamento: novoAgendamento.statusPagamento || 'em_aberto',
      status: novoAgendamento.status || 'agendado',
      origem: novoAgendamento.origem || 'manual',
      confirmado: novoAgendamento.confirmado ?? false,
    };

    return await agendamentosData.criarAgendamento(agendamentoCompleto);
  };

  const adicionarAgendamentosCronograma = () => {
    // Esta funcionalidade agora é gerenciada automaticamente pelo Supabase
    console.log('Agendamentos de cronograma são criados automaticamente');
  };

  return {
    ...agendamentosData,
    // Substituir os dados originais pelos enriquecidos
    todosAgendamentos,
    agendamentosFiltrados: agendamentosFiltradosEnriquecidos,
    // Dados auxiliares
    clientes,
    servicos,
    // Funções
    verificarConflito,
    criarAgendamento,
    adicionarAgendamentosCronograma,
    verificarHorarioDisponivel: agendamentosData.verificarHorarioDisponivel,
  };
}