import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Flame, Target, Crown, Zap, Star, Award } from "lucide-react";

interface GamificacaoClienteProps {
  clienteId: string;
  pontosAtual: number;
}

interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icon: any;
  conquistado: boolean;
  progresso?: number;
  meta?: number;
}

interface Desafio {
  id: string;
  nome: string;
  descricao: string;
  recompensa: number;
  progresso: number;
  meta: number;
  tipo: 'semanal' | 'mensal' | 'especial';
}

export function GamificacaoCliente({ clienteId, pontosAtual }: GamificacaoClienteProps) {
  // Buscar dados de agendamentos e histórico do cliente
  const { data: dadosGamificacao } = useQuery({
    queryKey: ['gamificacao-cliente', clienteId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar agendamentos do cliente
      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('status_pagamento', 'pago');

      const totalAgendamentos = agendamentos?.length || 0;
      const totalGasto = agendamentos?.reduce((sum, a) => sum + Number(a.valor_pago), 0) || 0;

      // Calcular sequência (streak) - dias consecutivos com agendamentos no último mês
      const hoje = new Date();
      const umMesAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const agendamentosRecentes = agendamentos?.filter(a => 
        new Date(a.data) >= umMesAtras
      ) || [];

      const sequencia = agendamentosRecentes.length;

      // Definir badges
      const badges: Badge[] = [
        {
          id: '1',
          nome: 'Primeira Visita',
          descricao: 'Completou o primeiro atendimento',
          icon: Star,
          conquistado: totalAgendamentos >= 1
        },
        {
          id: '2',
          nome: 'Cliente Fiel',
          descricao: 'Realizou 5 atendimentos',
          icon: Trophy,
          conquistado: totalAgendamentos >= 5,
          progresso: totalAgendamentos,
          meta: 5
        },
        {
          id: '3',
          nome: 'VIP',
          descricao: 'Alcançou 1000 pontos',
          icon: Crown,
          conquistado: pontosAtual >= 1000,
          progresso: pontosAtual,
          meta: 1000
        },
        {
          id: '4',
          nome: 'Frequentador',
          descricao: 'Visitou 3 vezes no mês',
          icon: Flame,
          conquistado: sequencia >= 3,
          progresso: sequencia,
          meta: 3
        },
        {
          id: '5',
          nome: 'Investidor',
          descricao: 'Gastou mais de R$ 500',
          icon: Award,
          conquistado: totalGasto >= 500,
          progresso: totalGasto,
          meta: 500
        }
      ];

      // Desafios ativos
      const desafios: Desafio[] = [
        {
          id: '1',
          nome: 'Desafio Semanal',
          descricao: 'Faça 2 agendamentos esta semana',
          recompensa: 50,
          progresso: Math.min(sequencia, 2),
          meta: 2,
          tipo: 'semanal'
        },
        {
          id: '2',
          nome: 'Maratona do Mês',
          descricao: 'Complete 4 serviços neste mês',
          recompensa: 150,
          progresso: Math.min(agendamentosRecentes.length, 4),
          meta: 4,
          tipo: 'mensal'
        },
        {
          id: '3',
          nome: 'Milestone 10',
          descricao: 'Alcance 10 atendimentos no total',
          recompensa: 200,
          progresso: Math.min(totalAgendamentos, 10),
          meta: 10,
          tipo: 'especial'
        }
      ];

      return {
        badges,
        desafios,
        totalBadges: badges.filter(b => b.conquistado).length,
        sequencia,
        totalAgendamentos
      };
    }
  });

  if (!dadosGamificacao) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando gamificação...</p>
        </CardContent>
      </Card>
    );
  }

  const getTipoDesafioColor = (tipo: string) => {
    switch (tipo) {
      case 'semanal': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'mensal': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'especial': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Estatísticas de Sequência */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dadosGamificacao.sequencia}</p>
                <p className="text-sm text-muted-foreground">Visitas no último mês</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {dadosGamificacao.totalBadges}/{dadosGamificacao.badges.length} Badges
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dadosGamificacao.badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    badge.conquistado
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <Icon
                    className={`h-8 w-8 mx-auto mb-2 ${
                      badge.conquistado ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <p className="font-medium text-sm mb-1">{badge.nome}</p>
                  <p className="text-xs text-muted-foreground mb-2">{badge.descricao}</p>
                  
                  {!badge.conquistado && badge.meta && (
                    <div className="space-y-1">
                      <Progress
                        value={(badge.progresso! / badge.meta) * 100}
                        className="h-1.5"
                      />
                      <p className="text-xs text-muted-foreground">
                        {badge.progresso}/{badge.meta}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Desafios Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Desafios Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dadosGamificacao.desafios.map((desafio) => {
              const progresso = (desafio.progresso / desafio.meta) * 100;
              const completo = desafio.progresso >= desafio.meta;

              return (
                <div
                  key={desafio.id}
                  className={`p-4 rounded-lg border ${
                    completo ? 'bg-green-500/10 border-green-500/20' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{desafio.nome}</h4>
                        <Badge variant="outline" className={getTipoDesafioColor(desafio.tipo)}>
                          {desafio.tipo}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{desafio.descricao}</p>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Zap className="h-4 w-4" />
                      <span className="font-bold">+{desafio.recompensa}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {desafio.progresso}/{desafio.meta}
                      </span>
                    </div>
                    <Progress value={progresso} className="h-2" />
                  </div>
                  
                  {completo && (
                    <Badge variant="default" className="mt-2 w-full justify-center">
                      ✓ Desafio Completo!
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
