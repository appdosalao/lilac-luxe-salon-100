import { useSupabaseAgendamentos } from './useSupabaseAgendamentos';
import { useServicos } from './useServicos';
import { useSupabaseClientes } from './useSupabaseClientes';

export function useAgendamentos() {
  const agendamentosData = useSupabaseAgendamentos();
  const { todosServicos: servicos } = useServicos();
  const { clientes } = useSupabaseClientes();

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
    clientes,
    servicos,
    verificarConflito,
    criarAgendamento,
    adicionarAgendamentosCronograma,
  };
}