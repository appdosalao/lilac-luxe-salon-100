import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface AgendamentoSemPontos {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  servico_nome: string;
  valor: number;
  data: string;
  programa_id?: string;
}

export function SincronizacaoPontos() {
  const queryClient = useQueryClient();

  // Buscar programa de fidelidade ativo
  const { data: programaAtivo } = useQuery({
    queryKey: ['programa-ativo'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('programas_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Buscar agendamentos concluídos sem pontos atribuídos
  const { data: agendamentosSemPontos, isLoading } = useQuery({
    queryKey: ['agendamentos-sem-pontos', programaAtivo?.id],
    queryFn: async () => {
      if (!programaAtivo) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar agendamentos concluídos
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          id,
          cliente_id,
          servico_id,
          valor,
          data,
          clientes!inner(nome),
          servicos!inner(nome)
        `)
        .eq('user_id', user.id)
        .eq('status', 'concluido')
        .order('data', { ascending: false })
        .limit(100);

      if (agendamentosError) throw agendamentosError;

      // Buscar histórico de pontos existente
      const { data: historico, error: historicoError } = await supabase
        .from('historico_pontos')
        .select('agendamento_id')
        .eq('user_id', user.id)
        .eq('programa_id', programaAtivo.id)
        .not('agendamento_id', 'is', null);

      if (historicoError) throw historicoError;

      const agendamentosComPontos = new Set(
        historico?.map(h => h.agendamento_id) || []
      );

      // Filtrar agendamentos sem pontos
      const semPontos: AgendamentoSemPontos[] = (agendamentos || [])
        .filter(a => !agendamentosComPontos.has(a.id))
        .map(a => ({
          id: a.id,
          cliente_id: a.cliente_id,
          cliente_nome: (a.clientes as any)?.nome || 'Cliente',
          servico_nome: (a.servicos as any)?.nome || 'Serviço',
          valor: parseFloat(a.valor?.toString() || '0'),
          data: a.data,
          programa_id: programaAtivo.id
        }));

      return semPontos;
    },
    enabled: !!programaAtivo
  });

  // Sincronizar pontos automaticamente
  const sincronizarMutation = useMutation({
    mutationFn: async () => {
      if (!programaAtivo || !agendamentosSemPontos || agendamentosSemPontos.length === 0) {
        throw new Error("Nenhum agendamento para sincronizar");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let sucessos = 0;
      let erros = 0;

      for (const agendamento of agendamentosSemPontos) {
        try {
          // Calcular pontos
          const pontosGanhos = Math.floor(
            agendamento.valor * parseFloat(programaAtivo.pontos_por_real?.toString() || '1')
          );

          // Buscar ou criar registro de pontos do cliente
          const { data: pontosCliente, error: buscaError } = await supabase
            .from('pontos_fidelidade')
            .select('*')
            .eq('user_id', user.id)
            .eq('cliente_id', agendamento.cliente_id)
            .eq('programa_id', programaAtivo.id)
            .single();

          if (buscaError && buscaError.code !== 'PGRST116') throw buscaError;

          if (pontosCliente) {
            // Atualizar pontos existentes
            const { error: updateError } = await supabase
              .from('pontos_fidelidade')
              .update({
                pontos_totais: pontosCliente.pontos_totais + pontosGanhos,
                pontos_disponiveis: pontosCliente.pontos_disponiveis + pontosGanhos
              })
              .eq('id', pontosCliente.id);

            if (updateError) throw updateError;
          } else {
            // Criar novo registro de pontos
            const { error: insertError } = await supabase
              .from('pontos_fidelidade')
              .insert({
                user_id: user.id,
                cliente_id: agendamento.cliente_id,
                programa_id: programaAtivo.id,
                pontos_totais: pontosGanhos,
                pontos_disponiveis: pontosGanhos,
                nivel: 'bronze'
              });

            if (insertError) throw insertError;
          }

          // Registrar no histórico
          const { error: historicoError } = await supabase
            .from('historico_pontos')
            .insert({
              user_id: user.id,
              cliente_id: agendamento.cliente_id,
              programa_id: programaAtivo.id,
              agendamento_id: agendamento.id,
              pontos: pontosGanhos,
              tipo: 'ganho',
              descricao: `Pontos por serviço: ${agendamento.servico_nome}`,
              multiplicador_aplicado: parseFloat(programaAtivo.pontos_por_real?.toString() || '1')
            });

          if (historicoError) throw historicoError;

          sucessos++;
        } catch (error) {
          console.error('Erro ao processar agendamento:', agendamento.id, error);
          erros++;
        }
      }

      return { sucessos, erros, total: agendamentosSemPontos.length };
    },
    onSuccess: (result) => {
      toast.success(
        `✅ Sincronização concluída! ${result.sucessos} agendamento(s) processado(s)${
          result.erros > 0 ? `, ${result.erros} erro(s)` : ''
        }`
      );
      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-pontos'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-fidelidade'] });
      queryClient.invalidateQueries({ queryKey: ['ranking-fidelidade'] });
    },
    onError: (error) => {
      toast.error(`❌ Erro na sincronização: ${error.message}`);
    }
  });

  // Sincronização automática ao carregar (se houver agendamentos pendentes)
  useEffect(() => {
    if (programaAtivo && agendamentosSemPontos && agendamentosSemPontos.length > 0) {
      // Sincronizar automaticamente após 2 segundos
      const timer = setTimeout(() => {
        sincronizarMutation.mutate();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [programaAtivo?.id, agendamentosSemPontos?.length]);

  if (!programaAtivo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Sincronização de Pontos
          </CardTitle>
          <CardDescription>
            Nenhum programa de fidelidade ativo encontrado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Crie um programa de fidelidade ativo para começar a acumular pontos automaticamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Sincronização Automática de Pontos
        </CardTitle>
        <CardDescription>
          Agendamentos concluídos são automaticamente convertidos em pontos de fidelidade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Programa Ativo</p>
            <p className="text-2xl font-bold text-primary">{programaAtivo.nome}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {programaAtivo.pontos_por_real} ponto(s) por R$ 1,00 gasto
            </p>
          </div>

          <Badge variant={agendamentosSemPontos && agendamentosSemPontos.length > 0 ? "default" : "secondary"}>
            {isLoading ? 'Verificando...' : 
              agendamentosSemPontos?.length === 0 ? 
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Sincronizado
                </span> :
                `${agendamentosSemPontos?.length} pendente(s)`
            }
          </Badge>
        </div>

        {agendamentosSemPontos && agendamentosSemPontos.length > 0 && (
          <>
            <div className="border rounded-lg p-3 bg-accent/50">
              <p className="text-sm font-medium mb-2">Agendamentos Pendentes de Sincronização:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {agendamentosSemPontos.slice(0, 5).map(ag => (
                  <div key={ag.id} className="text-xs flex items-center justify-between py-1">
                    <span className="truncate">
                      {ag.cliente_nome} - {ag.servico_nome}
                    </span>
                    <span className="text-muted-foreground ml-2 shrink-0">
                      R$ {ag.valor.toFixed(2)}
                    </span>
                  </div>
                ))}
                {agendamentosSemPontos.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    E mais {agendamentosSemPontos.length - 5} agendamento(s)...
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={() => sincronizarMutation.mutate()}
              disabled={sincronizarMutation.isPending}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${sincronizarMutation.isPending ? 'animate-spin' : ''}`} />
              {sincronizarMutation.isPending ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
          </>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3">
          <p>💡 <strong>Dica:</strong> Os pontos são atribuídos automaticamente quando você marca um agendamento como "Concluído". A sincronização ocorre em segundo plano.</p>
        </div>
      </CardContent>
    </Card>
  );
}