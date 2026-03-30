import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, TrendingUp, Users, Gift, RefreshCw } from 'lucide-react';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';
import { Button } from '@/components/ui/button';

export const EstatisticasFidelidade = () => {
  const { estatisticas, sincronizarDoHistorico, recarregar, loading } = useSupabaseFidelidade();

  useEffect(() => {
    const key = 'fid_last_sync';
    const last = localStorage.getItem(key);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    if (!last || now - parseInt(last) > dayMs) {
      (async () => {
        const ok = await sincronizarDoHistorico();
        if (ok) {
          localStorage.setItem(key, String(now));
          recarregar();
        }
      })();
    }
  }, [sincronizarDoHistorico, recarregar]);

  const stats = [
    {
      title: 'Clientes no Programa',
      value: estatisticas?.total_clientes_programa || 0,
      icon: Users,
      color: 'text-info'
    },
    {
      title: 'Pontos Distribuídos',
      value: estatisticas?.total_pontos_distribuidos || 0,
      icon: Award,
      color: 'text-success'
    },
    {
      title: 'Pontos Resgatados',
      value: estatisticas?.total_pontos_resgatados || 0,
      icon: Gift,
      color: 'text-primary'
    },
    {
      title: 'Clientes Ativos (30d)',
      value: estatisticas?.clientes_ativos_30d || 0,
      icon: TrendingUp,
      color: 'text-warning'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Visão Geral do Programa
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl font-semibold border-primary/20 hover:bg-primary/5 transition-colors"
          onClick={async () => {
            const ok = await sincronizarDoHistorico();
            if (ok) recarregar();
          }}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Atualizando dados...' : 'Sincronizar Histórico'}
        </Button>
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-primary/10 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative">
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:scale-110 transition-transform duration-500 ${stat.color.replace('text-', 'bg-')}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-background shadow-sm border border-border/50 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight">
                  {stat.value.toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Dados atualizados</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
