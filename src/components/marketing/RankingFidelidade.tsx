import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown, Award, Medal } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RankingClienteProps {
  programaId?: string;
}

export function RankingFidelidade({ programaId }: RankingClienteProps) {
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['ranking-fidelidade', programaId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from('ranking_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .order('pontos_totais', { ascending: false })
        .limit(10);
      
      if (programaId) {
        query = query.eq('programa_id', programaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getNivelInfo = (nivel: string) => {
    const niveis: Record<string, { nome: string; cor: string; icon: any }> = {
      bronze: { nome: 'Bronze', cor: '#CD7F32', icon: Medal },
      prata: { nome: 'Prata', cor: '#C0C0C0', icon: Award },
      ouro: { nome: 'Ouro', cor: '#FFD700', icon: Trophy },
      platina: { nome: 'Platina', cor: '#E5E4E2', icon: Crown }
    };
    return niveis[nivel] || niveis.bronze;
  };

  const getPosicaoIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-semibold text-muted-foreground">#{posicao}</span>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando ranking...</p>
        </CardContent>
      </Card>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Clientes</CardTitle>
          <CardDescription>Nenhum cliente no ranking ainda</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Top 10 Clientes
        </CardTitle>
        <CardDescription>Ranking dos clientes com mais pontos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ranking.map((cliente) => {
            const nivelInfo = getNivelInfo(cliente.nivel);
            const Icon = nivelInfo.icon;
            
            return (
              <div
                key={cliente.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-center w-10">
                  {getPosicaoIcon(cliente.posicao_ranking)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{cliente.cliente_nome}</p>
                    <Badge 
                      variant="secondary" 
                      className="shrink-0"
                      style={{ backgroundColor: `${nivelInfo.cor}20`, color: nivelInfo.cor }}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {nivelInfo.nome}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{cliente.pontos_totais.toLocaleString()} pts totais</span>
                    <span className="text-primary font-medium">
                      {cliente.pontos_disponiveis.toLocaleString()} pts disponíveis
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
