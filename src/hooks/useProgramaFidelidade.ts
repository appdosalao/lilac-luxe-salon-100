import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";

export function useProgramaFidelidade() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar programa ativo
  const { data: programaAtivo } = useQuery({
    queryKey: ['programa-fidelidade-ativo', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('programas_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Buscar pontos do cliente
  const buscarPontosCliente = async (clienteId: string) => {
    if (!user || !programaAtivo) return null;

    const { data, error } = await supabase
      .from('pontos_fidelidade')
      .select('*')
      .eq('user_id', user.id)
      .eq('cliente_id', clienteId)
      .eq('programa_id', programaAtivo.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  };

  // Adicionar pontos quando agendamento é pago
  const adicionarPontosPorPagamento = useMutation({
    mutationFn: async ({ 
      clienteId, 
      agendamentoId, 
      valorPago 
    }: { 
      clienteId: string; 
      agendamentoId: string; 
      valorPago: number;
    }) => {
      if (!user || !programaAtivo) {
        throw new Error("Programa de fidelidade não configurado");
      }

      // Calcular pontos ganhos
      const pontosGanhos = Math.floor(valorPago * programaAtivo.pontos_por_real);

      if (pontosGanhos <= 0) return;

      // Buscar ou criar registro de pontos do cliente
      let pontosCliente = await buscarPontosCliente(clienteId);

      if (!pontosCliente) {
        // Criar novo registro
        const { data, error } = await supabase
          .from('pontos_fidelidade')
          .insert({
            user_id: user.id,
            cliente_id: clienteId,
            programa_id: programaAtivo.id,
            pontos_totais: pontosGanhos,
            pontos_disponiveis: pontosGanhos,
            pontos_resgatados: 0
          })
          .select()
          .single();

        if (error) throw error;
        pontosCliente = data;
      } else {
        // Atualizar pontos existentes
        const { error } = await supabase
          .from('pontos_fidelidade')
          .update({
            pontos_totais: pontosCliente.pontos_totais + pontosGanhos,
            pontos_disponiveis: pontosCliente.pontos_disponiveis + pontosGanhos
          })
          .eq('id', pontosCliente.id);

        if (error) throw error;
      }

      // Registrar histórico
      await supabase.from('historico_pontos').insert({
        user_id: user.id,
        cliente_id: clienteId,
        programa_id: programaAtivo.id,
        agendamento_id: agendamentoId,
        pontos: pontosGanhos,
        tipo: 'ganho',
        descricao: `Ganhou ${pontosGanhos} pontos por pagamento de R$ ${valorPago.toFixed(2)}`
      });

      return pontosGanhos;
    },
    onSuccess: (pontosGanhos) => {
      if (pontosGanhos && pontosGanhos > 0) {
        queryClient.invalidateQueries({ queryKey: ['pontos-fidelidade'] });
        queryClient.invalidateQueries({ queryKey: ['estatisticas-fidelidade'] });
        toast({
          title: "Pontos adicionados!",
          description: `Cliente ganhou ${pontosGanhos} pontos de fidelidade`,
        });
      }
    }
  });

  // Resgatar pontos
  const resgatarPontos = useMutation({
    mutationFn: async ({ 
      clienteId, 
      pontosResgatados 
    }: { 
      clienteId: string; 
      pontosResgatados: number;
    }) => {
      if (!user || !programaAtivo) {
        throw new Error("Programa de fidelidade não configurado");
      }

      const pontosCliente = await buscarPontosCliente(clienteId);

      if (!pontosCliente) {
        throw new Error("Cliente não possui pontos");
      }

      if (pontosCliente.pontos_disponiveis < pontosResgatados) {
        throw new Error("Pontos insuficientes");
      }

      if (pontosResgatados < programaAtivo.pontos_minimos_resgate) {
        throw new Error(`Mínimo de ${programaAtivo.pontos_minimos_resgate} pontos para resgate`);
      }

      // Atualizar pontos
      const { error } = await supabase
        .from('pontos_fidelidade')
        .update({
          pontos_disponiveis: pontosCliente.pontos_disponiveis - pontosResgatados,
          pontos_resgatados: pontosCliente.pontos_resgatados + pontosResgatados
        })
        .eq('id', pontosCliente.id);

      if (error) throw error;

      // Registrar histórico
      const valorResgate = pontosResgatados * programaAtivo.valor_ponto;
      await supabase.from('historico_pontos').insert({
        user_id: user.id,
        cliente_id: clienteId,
        programa_id: programaAtivo.id,
        pontos: -pontosResgatados,
        tipo: 'resgate',
        descricao: `Resgatou ${pontosResgatados} pontos (R$ ${valorResgate.toFixed(2)})`
      });

      return valorResgate;
    },
    onSuccess: (valorResgate) => {
      queryClient.invalidateQueries({ queryKey: ['pontos-fidelidade'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-fidelidade'] });
      toast({
        title: "Pontos resgatados!",
        description: `Desconto de R$ ${valorResgate.toFixed(2)} aplicado`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resgatar pontos",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    programaAtivo,
    buscarPontosCliente,
    adicionarPontosPorPagamento,
    resgatarPontos
  };
}
