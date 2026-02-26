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
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="gap-2"
          onClick={async () => {
            const ok = await sincronizarDoHistorico();
            if (ok) recarregar();
          }}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Sincronizando...' : 'Sincronizar do Histórico'}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
