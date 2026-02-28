import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgendamentoOnlineData, ServicoDisponivel, HorarioDisponivel } from '@/types/agendamento-online';
import { toast } from 'sonner';

export const useAgendamentoOnlineService = () => {
  const [loading, setLoading] = useState(false);
  const [servicos, setServicos] = useState<ServicoDisponivel[]>([]);

  // Carregar serviços disponíveis
  const carregarServicos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('servicos_public')
        .select('*');

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error("Não foi possível carregar a lista de serviços disponíveis.");
    }
  }, []);

  // A verificação de disponibilidade agora é feita pela função RPC do Supabase

  // Calcular horários disponíveis usando a função melhorada do Supabase
  const calcularHorariosDisponiveis = useCallback(async (
    servicoId: string, 
    data: string
  ): Promise<HorarioDisponivel[]> => {
    const servico = servicos.find(s => s.id === servicoId);
    if (!servico) {
      console.log('Serviço não encontrado:', servicoId);
      return [];
    }

    try {
      // Buscar configurações mais recentes para garantir sincronização
      const { data: configuracoes, error: configError } = await supabase
        .from('configuracoes_horarios')
        .select('user_id')
        .eq('ativo', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (configError || !configuracoes || configuracoes.length === 0) {
        console.error('Nenhuma configuração de horário encontrada');
        return [];
      }

      const userId = configuracoes[0].user_id;

      // Usar função melhorada do Supabase que considera duração e conflitos
      const { data: horariosResult, error } = await supabase.rpc('buscar_horarios_com_multiplos_intervalos', {
        data_selecionada: data,
        user_id_param: userId,
        duracao_servico: servico.duracao
      });

      if (error) {
        console.error('Erro ao buscar horários:', error);
        return [];
      }

      console.log(`Horários para serviço ${servico.nome} (${servico.duracao}min):`, horariosResult);

      // Filtrar apenas horários disponíveis e formatar corretamente
      const horariosFormatados = (horariosResult || [])
        .filter(item => item.horario && item.disponivel === true)
        .map(item => ({
          horario: item.horario,
          disponivel: true
        }));

      return horariosFormatados;
    } catch (error) {
      console.error('Erro ao calcular horários disponíveis:', error);
      return [];
    }
  }, [servicos]);

  // Criar cliente se não existir
  const criarClienteSeNaoExistir = useCallback(async (dados: AgendamentoOnlineData) => {
    try {
      // Usar função do Supabase para criar cliente
      const { data, error } = await supabase.rpc('criar_cliente_agendamento_online', {
        p_nome: dados.nome_completo,
        p_telefone: dados.telefone,
        p_email: dados.email,
        p_observacoes: 'Cliente criado via agendamento online'
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }, []);

  // Criar agendamento online com validação final
  const criarAgendamento = useCallback(async (dados: AgendamentoOnlineData): Promise<boolean> => {
    setLoading(true);
    try {
      const servico = servicos.find(s => s.id === dados.servico_id);
      if (!servico) {
        throw new Error('Serviço não encontrado');
      }

      // Validação final de disponibilidade antes de criar
      const horariosDisponiveis = await calcularHorariosDisponiveis(dados.servico_id, dados.data);
      const horarioDisponivel = horariosDisponiveis.find(h => h.horario === dados.horario && h.disponivel);
      
      if (!horarioDisponivel) {
        toast.error("Este horário não está mais disponível. Por favor, selecione outro horário.");
        return false;
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

      toast.success(`Agendamento confirmado! ✨\nSeu agendamento para ${servico.nome} foi confirmado para ${new Date(dados.data).toLocaleDateString('pt-BR')} às ${dados.horario}. Você foi cadastrado como cliente.`);

      return true;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error("Não foi possível confirmar seu agendamento. Tente novamente.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [servicos, criarClienteSeNaoExistir, calcularHorariosDisponiveis]);

  return {
    loading,
    servicos,
    carregarServicos,
    calcularHorariosDisponiveis,
    criarAgendamento
  };
};