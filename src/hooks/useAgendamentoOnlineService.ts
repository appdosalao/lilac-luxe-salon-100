import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgendamentoOnlineData, ServicoDisponivel, HorarioDisponivel } from '@/types/agendamento-online';
import { toast } from '@/hooks/use-toast';

export const useAgendamentoOnlineService = () => {
  const [loading, setLoading] = useState(false);
  const [servicos, setServicos] = useState<ServicoDisponivel[]>([]);

  // Carregar serviços disponíveis
  const carregarServicos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome, valor, duracao, descricao')
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Não foi possível carregar a lista de serviços disponíveis.",
        variant: "destructive"
      });
    }
  }, []);

  // Verificar disponibilidade de horário
  const verificarDisponibilidade = useCallback(async (
    data: string, 
    horario: string, 
    duracao: number
  ): Promise<boolean> => {
    try {
      // Calcular horário de fim do serviço
      const [horas, minutos] = horario.split(':').map(Number);
      const inicioMinutos = horas * 60 + minutos;
      const fimMinutos = inicioMinutos + duracao;

      // Verificar conflitos em agendamentos online
      const { data: conflitosOnline } = await supabase
        .from('agendamentos_online')
        .select('horario, duracao')
        .eq('data', data)
        .in('status', ['pendente', 'confirmado']);

      // Verificar conflitos em agendamentos regulares
      const { data: conflitosRegulares } = await supabase
        .from('agendamentos')
        .select('hora, duracao')
        .eq('data', data)
        .neq('status', 'cancelado');

      // Combinar todos os conflitos
      const todosConflitos = [
        ...(conflitosOnline || []).map(c => ({ hora: c.horario, duracao: c.duracao })),
        ...(conflitosRegulares || []).map(c => ({ hora: c.hora, duracao: c.duracao }))
      ];

      // Verificar se há sobreposição
      for (const conflito of todosConflitos) {
        const [confHoras, confMinutos] = conflito.hora.split(':').map(Number);
        const confInicioMinutos = confHoras * 60 + confMinutos;
        const confFimMinutos = confInicioMinutos + conflito.duracao;

        if (inicioMinutos < confFimMinutos && fimMinutos > confInicioMinutos) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return false;
    }
  }, []);

  // Calcular horários disponíveis para uma data e serviço
  const calcularHorariosDisponiveis = useCallback(async (
    servicoId: string, 
    data: string
  ): Promise<HorarioDisponivel[]> => {
    const servico = servicos.find(s => s.id === servicoId);
    if (!servico) return [];

    const horariosBase = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30'
    ];

    const horariosDisponiveis: HorarioDisponivel[] = [];

    for (const horario of horariosBase) {
      // Verificar se o serviço cabe no horário de funcionamento
      const [horas, minutos] = horario.split(':').map(Number);
      const inicioMinutos = horas * 60 + minutos;
      const fimMinutos = inicioMinutos + servico.duracao;
      const limiteFim = 18 * 60; // 18:00

      if (fimMinutos > limiteFim) {
        horariosDisponiveis.push({ horario, disponivel: false });
        continue;
      }

      // Verificar disponibilidade real
      const disponivel = await verificarDisponibilidade(data, horario, servico.duracao);
      horariosDisponiveis.push({ horario, disponivel });
    }

    return horariosDisponiveis;
  }, [servicos, verificarDisponibilidade]);

  // Criar cliente se não existir
  const criarClienteSeNaoExistir = useCallback(async (dados: AgendamentoOnlineData) => {
    try {
      // Verificar se já existe cliente com o mesmo email
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', dados.email)
        .maybeSingle();

      if (clienteExistente) {
        return clienteExistente.id;
      }

      // Criar novo cliente
      const { data: novoCliente, error } = await supabase
        .from('clientes')
        .insert({
          nome: dados.nome_completo,
          telefone: dados.telefone,
          email: dados.email,
          observacoes: 'Cliente criado via agendamento online',
          historico_servicos: []
        })
        .select('id')
        .single();

      if (error) throw error;
      return novoCliente.id;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }, []);

  // Criar agendamento online
  const criarAgendamento = useCallback(async (dados: AgendamentoOnlineData): Promise<boolean> => {
    setLoading(true);
    try {
      const servico = servicos.find(s => s.id === dados.servico_id);
      if (!servico) {
        throw new Error('Serviço não encontrado');
      }

      // Criar ou encontrar cliente
      const clienteId = await criarClienteSeNaoExistir(dados);

      // Criar agendamento online
      const { error } = await supabase
        .from('agendamentos_online')
        .insert({
          nome_completo: dados.nome_completo,
          email: dados.email,
          telefone: dados.telefone,
          servico_id: dados.servico_id,
          data: dados.data,
          horario: dados.horario,
          observacoes: dados.observacoes,
          valor: servico.valor,
          duracao: servico.duracao,
          status: 'pendente',
          origem: 'formulario_online',
          user_agent: navigator.userAgent
        });

      if (error) throw error;

      toast({
        title: "Agendamento confirmado! ✨",
        description: `Seu agendamento para ${servico.nome} foi confirmado para ${new Date(dados.data).toLocaleDateString('pt-BR')} às ${dados.horario}. Você foi cadastrado como cliente.`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro ao agendar",
        description: "Não foi possível confirmar seu agendamento. Tente novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [servicos, criarClienteSeNaoExistir]);

  return {
    loading,
    servicos,
    carregarServicos,
    calcularHorariosDisponiveis,
    criarAgendamento
  };
};