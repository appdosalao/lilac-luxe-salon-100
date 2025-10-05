import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClienteAnalise {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  totalGastoMes: number;
  ultimaVisita?: string;
  totalAgendamentos: number;
  ativo: boolean;
}

export function AnaliseClientes() {
  const { data: analise, isLoading } = useQuery({
    queryKey: ['analise-clientes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const fimMes = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const dataLimiteInativo = format(subDays(new Date(), 60), 'yyyy-MM-dd');

      // Buscar clientes
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user.id);

      if (clientesError) throw clientesError;

      // Buscar agendamentos do mês
      const { data: agendamentosMes, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('cliente_id, valor, data, status')
        .eq('user_id', user.id)
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .in('status', ['concluido', 'agendado']);

      if (agendamentosError) throw agendamentosError;

      // Buscar último agendamento de cada cliente
      const { data: ultimosAgendamentos, error: ultimosError } = await supabase
        .from('agendamentos')
        .select('cliente_id, data')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (ultimosError) throw ultimosError;

      // Processar dados
      const clientesAnalise: ClienteAnalise[] = (clientes || []).map(cliente => {
        const agendamentosCliente = (agendamentosMes || []).filter(
          a => a.cliente_id === cliente.id
        );
        
        const totalGastoMes = agendamentosCliente.reduce(
          (sum, a) => sum + parseFloat(a.valor?.toString() || '0'), 
          0
        );

        const ultimoAgendamento = (ultimosAgendamentos || []).find(
          a => a.cliente_id === cliente.id
        );

        const ativo = ultimoAgendamento 
          ? ultimoAgendamento.data >= dataLimiteInativo
          : false;

        return {
          id: cliente.id,
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          totalGastoMes,
          ultimaVisita: ultimoAgendamento?.data,
          totalAgendamentos: agendamentosCliente.length,
          ativo
        };
      });

      // Separar ativos e inativos
      const clientesAtivos = clientesAnalise.filter(c => c.ativo);
      const clientesInativos = clientesAnalise.filter(c => !c.ativo);

      // Criar rankings (apenas clientes que gastaram no mês)
      const clientesComGastos = clientesAnalise.filter(c => c.totalGastoMes > 0);
      const maioresGastadores = [...clientesComGastos]
        .sort((a, b) => b.totalGastoMes - a.totalGastoMes)
        .slice(0, 10);
      
      const menoresGastadores = [...clientesComGastos]
        .sort((a, b) => a.totalGastoMes - b.totalGastoMes)
        .slice(0, 10);

      return {
        clientesAtivos,
        clientesInativos,
        maioresGastadores,
        menoresGastadores,
        totalClientes: clientesAnalise.length,
        percentualAtivos: clientesAnalise.length > 0 
          ? (clientesAtivos.length / clientesAnalise.length * 100).toFixed(1)
          : '0'
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Carregando análise...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analise) return null;

  return (
    <div className="space-y-6">
      {/* Resumo de Clientes Ativos/Inativos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analise.totalClientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Clientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {analise.clientesAtivos.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analise.percentualAtivos}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              Clientes Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {analise.clientesInativos.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sem visita há mais de 60 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Maiores Gastadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Top 10 Clientes que Mais Gastam (Mês Atual)
          </CardTitle>
          <CardDescription>
            Clientes com maior volume de gastos em {format(new Date(), 'MMMM/yyyy', { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analise.maioresGastadores.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum cliente com gastos registrados neste mês
            </p>
          ) : (
            <div className="space-y-3">
              {analise.maioresGastadores.map((cliente, index) => (
                <div
                  key={cliente.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500 font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{cliente.nome}</p>
                      {cliente.ativo && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{cliente.telefone}</span>
                      <span>•</span>
                      <span>{cliente.totalAgendamentos} agendamento(s)</span>
                      {cliente.ultimaVisita && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(cliente.ultimaVisita), 'dd/MM/yyyy')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-500">
                      R$ {cliente.totalGastoMes.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 10 Menores Gastadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-500" />
            Top 10 Clientes que Menos Gastam (Mês Atual)
          </CardTitle>
          <CardDescription>
            Clientes com menor volume de gastos - oportunidade para campanhas de engajamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analise.menoresGastadores.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum cliente com gastos registrados neste mês
            </p>
          ) : (
            <div className="space-y-3">
              {analise.menoresGastadores.map((cliente, index) => (
                <div
                  key={cliente.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{cliente.nome}</p>
                      {!cliente.ativo && (
                        <Badge variant="secondary" className="shrink-0 text-xs bg-orange-500/10 text-orange-500">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{cliente.telefone}</span>
                      <span>•</span>
                      <span>{cliente.totalAgendamentos} agendamento(s)</span>
                      {cliente.ultimaVisita && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(cliente.ultimaVisita), 'dd/MM/yyyy')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-500">
                      R$ {cliente.totalGastoMes.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Clientes Inativos */}
      {analise.clientesInativos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Clientes Inativos (Sem visita há mais de 60 dias)
            </CardTitle>
            <CardDescription>
              Oportunidade para campanhas de reativação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {analise.clientesInativos.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{cliente.nome}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{cliente.telefone}</span>
                      {cliente.email && (
                        <>
                          <span>•</span>
                          <span className="truncate">{cliente.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {cliente.ultimaVisita && (
                    <div className="text-right text-xs text-muted-foreground">
                      Última visita: {format(new Date(cliente.ultimaVisita), 'dd/MM/yyyy')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
