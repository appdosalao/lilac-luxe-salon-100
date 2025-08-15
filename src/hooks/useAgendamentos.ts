import { useState, useMemo } from 'react';
import { AgendamentoFiltros } from '@/types/agendamento';
import { useDatabase } from '@/hooks/useDatabase';

export function useAgendamentos() {
  const [filtros, setFiltros] = useState<AgendamentoFiltros>({});
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  
  const {
    agendamentos: todosAgendamentos,
    clientes,
    servicos,
    createAgendamento,
    updateAgendamento,
    isHorarioDisponivel,
    loading
  } = useDatabase();

  // Filtrar agendamentos
  const agendamentosFiltrados = useMemo(() => {
    let resultado = [...todosAgendamentos];

    if (filtros.data) {
      resultado = resultado.filter(ag => ag.data === filtros.data);
    }

    if (filtros.status) {
      resultado = resultado.filter(ag => ag.status === filtros.status);
    }

    if (filtros.statusPagamento) {
      resultado = resultado.filter(ag => ag.statusPagamento === filtros.statusPagamento);
    }

    if (filtros.clienteId) {
      resultado = resultado.filter(ag => ag.clienteId === filtros.clienteId);
    }

    if (filtros.origem) {
      resultado = resultado.filter(ag => ag.origem === filtros.origem);
    }

    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      resultado = resultado.filter(ag => 
        ag.clienteNome.toLowerCase().includes(busca) ||
        ag.servicoNome.toLowerCase().includes(busca)
      );
    }

    // Ordenar por data e hora
    resultado.sort((a, b) => {
      const dataHoraA = new Date(`${a.data}T${a.hora}`);
      const dataHoraB = new Date(`${b.data}T${b.hora}`);
      return dataHoraA.getTime() - dataHoraB.getTime();
    });

    return resultado;
  }, [todosAgendamentos, filtros]);

  // Paginação
  const totalPaginas = Math.ceil(agendamentosFiltrados.length / itensPorPagina);
  const agendamentosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return agendamentosFiltrados.slice(inicio, fim);
  }, [agendamentosFiltrados, paginaAtual, itensPorPagina]);

  // Verificar conflito de horário usando o método do banco
  const verificarConflito = (agendamento: any, excluirId?: string) => {
    if (!agendamento.data || !agendamento.hora || !agendamento.duracao) {
      return false;
    }
    return !isHorarioDisponivel(agendamento.data, agendamento.hora, agendamento.duracao, excluirId);
  };

  // CRUD operations delegadas para o useDatabase
  const criarAgendamento = async (novoAgendamento: any) => {
    const servico = servicos.find(s => s.id === novoAgendamento.servicoId);
    if (!servico) return false;

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

    const resultado = await createAgendamento(agendamentoCompleto);
    return !!resultado;
  };

  const atualizarAgendamento = async (id: string, dadosAtualizados: any) => {
    const resultado = await updateAgendamento(id, dadosAtualizados);
    return !!resultado;
  };

  const excluirAgendamento = async (id: string) => {
    // Implementar delete no useDatabase se necessário
    return true;
  };

  const cancelarAgendamento = async (id: string) => {
    return await atualizarAgendamento(id, { status: 'cancelado' });
  };

  const adicionarAgendamentosCronograma = () => {
    // Esta funcionalidade agora é gerenciada automaticamente pelo useDatabase
    console.log('Agendamentos de cronograma são criados automaticamente');
  };

  return {
    loading,
    agendamentos: agendamentosPaginados,
    agendamentosFiltrados,
    filtros,
    setFiltros,
    paginaAtual,
    setPaginaAtual,
    totalPaginas,
    clientes,
    servicos,
    criarAgendamento,
    atualizarAgendamento,
    excluirAgendamento,
    cancelarAgendamento,
    verificarConflito,
    adicionarAgendamentosCronograma,
    todosAgendamentos,
  };
}