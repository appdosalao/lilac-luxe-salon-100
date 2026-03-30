import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Gift } from 'lucide-react';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';
import { ResgateRecompensaDialog } from './ResgateRecompensaDialog';
import type { RankingFidelidade } from '@/types/fidelidade';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export const RankingClientes = () => {
  const { ranking, carregarRanking, classes } = useSupabaseFidelidade();
  const [clienteSelecionado, setClienteSelecionado] = useState<RankingFidelidade | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [limite, setLimite] = useState<number>(10);
  const [classeFiltro, setClasseFiltro] = useState<string>('todas');
  const [busca, setBusca] = useState<string>('');

  const handleAbrirResgate = (cliente: RankingFidelidade) => {
    setClienteSelecionado(cliente);
    setDialogAberto(true);
  };

  const handleResgate = () => {
    carregarRanking(limite);
  };

  useEffect(() => {
    carregarRanking(limite);
  }, [limite]);

  const listaFiltrada = useMemo(() => {
    return ranking
      .filter(c => classeFiltro === 'todas' || c.classe_nome === classeFiltro)
      .filter(c => {
        if (!busca.trim()) return true;
        const s = busca.toLowerCase();
        return (c.cliente_nome || '').toLowerCase().includes(s) || (c.telefone || '').includes(s);
      });
  }, [ranking, classeFiltro, busca]);

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
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Select value={classeFiltro} onValueChange={setClasseFiltro}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone"
              className="h-9 px-3 rounded-md border bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLimite(10)}>Top 10</Button>
            <Button variant="outline" onClick={() => setLimite(100)}>Ver todos</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {listaFiltrada.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cliente no programa ainda
          </div>
        ) : (
          <div className="space-y-4">
            {listaFiltrada.map((cliente) => {
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
