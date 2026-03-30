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
    <Card className="border-primary/10 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Ranking de Clientes</CardTitle>
              <CardDescription>
                Visualize os clientes mais engajados e realize resgates
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant={limite === 10 ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setLimite(10)}
              className="flex-1 sm:flex-none rounded-xl font-bold"
            >
              Top 10
            </Button>
            <Button 
              variant={limite === 100 ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setLimite(100)}
              className="flex-1 sm:flex-none rounded-xl font-bold"
            >
              Ver Todos
            </Button>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                {/* Usando um ícone de busca simples ou apenas padding */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
            </div>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="h-11 w-full pl-10 pr-4 rounded-xl border border-border/50 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-sm shadow-sm"
            />
          </div>
          <Select value={classeFiltro} onValueChange={setClasseFiltro}>
            <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-medium shadow-sm">
              <SelectValue placeholder="Filtrar por classe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todas">Todas as Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {listaFiltrada.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground max-w-sm mx-auto font-medium">
              Não encontramos clientes que correspondam aos filtros aplicados no momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {listaFiltrada.map((cliente) => {
              const nivelInfo = getNivelBadge(cliente);
              return (
                <div
                  key={cliente.cliente_id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 hover:bg-muted/20 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-0 w-full sm:w-auto">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-muted/50 font-extrabold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {getRankingIcon(cliente.ranking)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-lg text-foreground truncate">{cliente.cliente_nome}</div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {cliente.telefone}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-black text-primary tracking-tight">
                        {cliente.pontos_totais} <span className="text-[10px] uppercase align-middle">pts</span>
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                        {cliente.pontos_disponiveis} disponíveis para resgate
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={`font-bold text-[10px] uppercase tracking-widest px-3 py-1 shadow-sm ${nivelInfo.color}`}
                        style={nivelInfo.style}
                      >
                        {nivelInfo.label}
                      </Badge>
                      {cliente.pontos_disponiveis > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAbrirResgate(cliente)}
                          className="rounded-xl font-bold border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                        >
                          <Gift className="h-4 w-4 mr-2" />
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
