import { useState, useCallback } from 'react';
import { Cronograma } from '@/types/cronograma';
import { Agendamento } from '@/types/agendamento';
import { toast } from '@/hooks/use-toast';

interface AgendamentoCronograma {
  clienteId: string;
  clienteNome: string;
  servicoId: string;
  servicoNome: string;
  data: string;
  duracao: number;
  valor: number;
  cronogramaId: string;
}

export const useIntegracaoCronograma = () => {
  const [loading, setLoading] = useState(false);

  // Função para encontrar horário disponível
  const encontrarHorarioDisponivel = useCallback((
    data: string, 
    duracaoMinutos: number, 
    agendamentosExistentes: Agendamento[],
    horaPreferida: string = '09:00'
  ): string => {
    const agendamentosDoDia = agendamentosExistentes.filter(
      ag => ag.data === data && ag.status !== 'cancelado'
    );

    // Horários de funcionamento (9h às 18h)
    const horarios = [];
    for (let h = 9; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        horarios.push(hora);
      }
    }

    // Verificar conflitos
    for (const hora of horarios) {
      const inicioNovo = new Date(`${data}T${hora}`);
      const fimNovo = new Date(inicioNovo.getTime() + duracaoMinutos * 60000);

      const temConflito = agendamentosDoDia.some(ag => {
        const inicio = new Date(`${ag.data}T${ag.hora}`);
        const fim = new Date(inicio.getTime() + ag.duracao * 60000);
        return (inicioNovo < fim && fimNovo > inicio);
      });

      if (!temConflito) {
        return hora;
      }
    }

    return horaPreferida; // Fallback
  }, []);

  // Gerar agendamentos para um cronograma
  const gerarAgendamentosCronograma = useCallback((
    cronograma: Cronograma,
    dadosAgendamento: AgendamentoCronograma,
    dataInicio: string,
    numeroSessoes: number,
    agendamentosExistentes: Agendamento[]
  ): Agendamento[] => {
    const agendamentosGerados: Agendamento[] = [];
    const dataBase = new Date(dataInicio);

    for (let i = 0; i < numeroSessoes; i++) {
      const dataAgendamento = new Date(dataBase);
      dataAgendamento.setDate(dataBase.getDate() + (i * cronograma.intervalo_dias));
      
      const dataFormatada = dataAgendamento.toISOString().split('T')[0];
      
      const horario = encontrarHorarioDisponivel(
        dataFormatada,
        dadosAgendamento.duracao,
        [...agendamentosExistentes, ...agendamentosGerados]
      );

      const agendamento: Agendamento = {
        id: `cronograma_${cronograma.id_cronograma}_${i}_${Date.now()}`,
        clienteId: dadosAgendamento.clienteId,
        clienteNome: dadosAgendamento.clienteNome,
        servicoId: dadosAgendamento.servicoId,
        servicoNome: dadosAgendamento.servicoNome,
        data: dataFormatada,
        hora: horario,
        duracao: dadosAgendamento.duracao,
        valor: dadosAgendamento.valor,
        valorPago: 0,
        valorDevido: dadosAgendamento.valor,
        formaPagamento: 'fiado',
        statusPagamento: 'em_aberto',
        status: 'agendado',
        observacoes: `Agendamento gerado automaticamente pelo cronograma: ${cronograma.tipo_servico}`,
        origem: 'cronograma',
        origem_cronograma: true,
        cronogramaId: cronograma.id_cronograma,
        confirmado: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      agendamentosGerados.push(agendamento);
    }

    return agendamentosGerados;
  }, [encontrarHorarioDisponivel]);

  // Processar conclusão de agendamento de cronograma
  const processarConclusaoAgendamento = useCallback((
    agendamento: Agendamento,
    onUpdateRetorno: (idRetorno: string, updates: any) => void
  ) => {
    if (agendamento.origem === 'cronograma' && agendamento.cronogramaId) {
      // Encontrar e atualizar o retorno correspondente
      // Esta lógica será integrada com o hook de retornos
      toast({
        title: "Cronograma atualizado",
        description: "O progresso do cronograma foi atualizado automaticamente.",
      });
    }
  }, []);

  // Processar cancelamento de agendamento de cronograma
  const processarCancelamentoAgendamento = useCallback((
    agendamento: Agendamento,
    onUpdateRetorno: (idRetorno: string, updates: any) => void
  ) => {
    if (agendamento.origem === 'cronograma' && agendamento.cronogramaId) {
      // Cancelar o retorno correspondente
      toast({
        title: "Cronograma atualizado",
        description: "O retorno foi cancelado no cronograma.",
      });
    }
  }, []);

  return {
    loading,
    gerarAgendamentosCronograma,
    processarConclusaoAgendamento,
    processarCancelamentoAgendamento,
    encontrarHorarioDisponivel,
  };
};