import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Gift } from 'lucide-react';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';
import { ResgateRecompensaDialog } from './ResgateRecompensaDialog';
import type { RankingFidelidade } from '@/types/fidelidade';

export const RankingClientes = () => {
  const { ranking, carregarRanking } = useSupabaseFidelidade();
  const [clienteSelecionado, setClienteSelecionado] = useState<RankingFidelidade | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);

  const handleAbrirResgate = (cliente: RankingFidelidade) => {
    setClienteSelecionado(cliente);
    setDialogAberto(true);
  };

  const handleResgate = () => {
    carregarRanking();
  };

  const getNivelBadge = (cliente: typeof ranking[0]) => {
    // Usar classe_nome e classe_cor da view se disponíveis
    if (cliente.classe_nome && cliente.classe_cor) {
      return {
        color: 'border',
        label: cliente.classe_nome,
        style: { backgroundColor: cliente.classe_cor, color: '#fff' }
      };
    }
    
    // Fallback se não houver classe
    return {
      color: 'bg-muted text-muted-foreground',
      label: 'Sem classe',
      style: undefined
    };
  };

  const getRankingIcon = (pos: number) => {
    if (pos === 1) return <Trophy className="h-5 w-5 text-accent" />;
    if (pos === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (pos === 3) return <Award className="h-5 w-5 text-warning" />;
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
              const nivelInfo = getNivelBadge(cliente);
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
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={nivelInfo.color}
                        style={nivelInfo.style}
                      >
                        {nivelInfo.label}
                      </Badge>
                      {cliente.pontos_disponiveis > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAbrirResgate(cliente)}
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Resgatar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {clienteSelecionado && (
        <ResgateRecompensaDialog
          cliente={clienteSelecionado}
          open={dialogAberto}
          onOpenChange={setDialogAberto}
          onResgate={handleResgate}
        />
      )}
    </Card>
  );
};
