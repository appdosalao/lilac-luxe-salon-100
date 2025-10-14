import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';

export const RankingClientes = () => {
  const { ranking } = useSupabaseFidelidade();

  const getNivelBadge = (nivel: string) => {
    const niveis: Record<string, { color: string; label: string }> = {
      bronze: { color: 'bg-orange-700 text-white', label: 'Bronze' },
      prata: { color: 'bg-gray-400 text-white', label: 'Prata' },
      ouro: { color: 'bg-yellow-500 text-white', label: 'Ouro' },
      platina: { color: 'bg-purple-600 text-white', label: 'Platina' }
    };
    return niveis[nivel] || niveis.bronze;
  };

  const getRankingIcon = (pos: number) => {
    if (pos === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (pos === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (pos === 3) return <Award className="h-5 w-5 text-orange-700" />;
    return <span className="text-sm font-medium text-muted-foreground">#{pos}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <CardTitle>Top 10 Clientes</CardTitle>
        </div>
        <CardDescription>
          Ranking dos clientes mais engajados no programa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cliente no programa ainda
          </div>
        ) : (
          <div className="space-y-4">
            {ranking.map((cliente) => {
              const nivelInfo = getNivelBadge(cliente.nivel);
              return (
                <div
                  key={cliente.cliente_id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10">
                      {getRankingIcon(cliente.ranking)}
                    </div>
                    <div>
                      <div className="font-medium">{cliente.cliente_nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {cliente.telefone}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {cliente.pontos_totais} pts
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {cliente.pontos_disponiveis} disponíveis
                      </div>
                    </div>
                    <Badge className={nivelInfo.color}>
                      {nivelInfo.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
