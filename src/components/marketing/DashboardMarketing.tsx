import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Users, TrendingUp, Target, Sparkles } from "lucide-react";
import { RankingFidelidade } from "./RankingFidelidade";
import { SincronizacaoPontos } from "./SincronizacaoPontos";

export function DashboardMarketing() {
  // Estatísticas gerais
  const { data: stats } = useQuery({
    queryKey: ['marketing-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Total de clientes
      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Programas de fidelidade ativos
      const { count: programasAtivos } = await supabase
        .from('programas_fidelidade')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('ativo', true);

      // Total de pontos distribuídos
      const { data: pontosData } = await supabase
        .from('pontos_fidelidade')
        .select('pontos_totais')
        .eq('user_id', user.id);

      const totalPontos = pontosData?.reduce((sum, p) => sum + p.pontos_totais, 0) || 0;

      // Clientes com pontos
      const { count: clientesComPontos } = await supabase
        .from('pontos_fidelidade')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .gt('pontos_totais', 0);

      // Distribuição por níveis
      const { data: niveis } = await supabase
        .from('pontos_fidelidade')
        .select('nivel')
        .eq('user_id', user.id);

      const distribuicaoNiveis = niveis?.reduce((acc: any, item) => {
        acc[item.nivel] = (acc[item.nivel] || 0) + 1;
        return acc;
      }, {});

      return {
        totalClientes: totalClientes || 0,
        programasAtivos: programasAtivos || 0,
        totalPontos,
        clientesComPontos: clientesComPontos || 0,
        distribuicaoNiveis: distribuicaoNiveis || {}
      };
    }
  });

  // Sugestões de campanhas baseadas em dados
  const { data: sugestoes } = useQuery({
    queryKey: ['sugestoes-campanhas'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const sugestoesLista = [];

      // Clientes inativos
      const { count: inativos } = await supabase
        .from('agendamentos')
        .select('cliente_id', { count: 'exact' })
        .eq('user_id', user.id)
        .lt('data', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if ((inativos || 0) > 0) {
        sugestoesLista.push({
          tipo: 'reativacao',
          titulo: 'Campanha de Reativação',
          descricao: `${inativos} cliente(s) sem visita há mais de 60 dias`,
          prioridade: 'alta'
        });
      }

      // Clientes bronze com muitos pontos
      const { data: bronzeAlto } = await supabase
        .from('pontos_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .eq('nivel', 'bronze')
        .gte('pontos_totais', 400);

      if (bronzeAlto && bronzeAlto.length > 0) {
        sugestoesLista.push({
          tipo: 'upgrade',
          titulo: 'Incentivo para Upgrade de Nível',
          descricao: `${bronzeAlto.length} cliente(s) próximo(s) do nível Prata`,
          prioridade: 'media'
        });
      }

      // Clientes com pontos para resgatar
      const { data: pontosAltos } = await supabase
        .from('pontos_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .gte('pontos_disponiveis', 100);

      if (pontosAltos && pontosAltos.length > 0) {
        sugestoesLista.push({
          tipo: 'resgate',
          titulo: 'Lembrete de Resgate',
          descricao: `${pontosAltos.length} cliente(s) com pontos disponíveis para resgate`,
          prioridade: 'baixa'
        });
      }

      return sugestoesLista;
    }
  });

  const getNivelColor = (nivel: string) => {
    const cores: any = {
      bronze: 'bg-orange-500/10 text-orange-500',
      prata: 'bg-gray-400/10 text-gray-400',
      ouro: 'bg-yellow-500/10 text-yellow-500',
      platina: 'bg-purple-500/10 text-purple-500'
    };
    return cores[nivel] || 'bg-gray-500/10 text-gray-500';
  };

  const getPrioridadeColor = (prioridade: string) => {
    const cores: any = {
      alta: 'destructive',
      media: 'default',
      baixa: 'secondary'
    };
    return cores[prioridade] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClientes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.clientesComPontos || 0} com pontos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Programas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats?.programasAtivos || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fidelidade ativa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Pontos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats?.totalPontos?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Distribuídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              Taxa de Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats?.totalClientes && stats?.clientesComPontos
                ? Math.round((stats.clientesComPontos / stats.totalClientes) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Níveis */}
      {stats?.distribuicaoNiveis && Object.keys(stats.distribuicaoNiveis).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Níveis</CardTitle>
            <CardDescription>
              Quantidade de clientes em cada nível do programa de fidelidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.distribuicaoNiveis).map(([nivel, quantidade]) => (
                <div
                  key={nivel}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getNivelColor(nivel)}`}
                >
                  <span className="text-sm font-medium capitalize">{nivel}</span>
                  <Badge variant="secondary" className="text-xs">
                    {quantidade as number} cliente(s)
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sincronização Automática */}
      <SincronizacaoPontos />

      {/* Sugestões de Campanhas */}
      {sugestoes && sugestoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sugestões de Campanhas
            </CardTitle>
            <CardDescription>
              Baseadas na análise automática de dados e comportamento dos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sugestoes.map((sugestao, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{sugestao.titulo}</h4>
                      <Badge variant={getPrioridadeColor(sugestao.prioridade)}>
                        {sugestao.prioridade}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{sugestao.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking de Fidelidade */}
      <RankingFidelidade />
    </div>
  );
}