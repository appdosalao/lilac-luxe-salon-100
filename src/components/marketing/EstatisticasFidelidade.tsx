import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, TrendingUp, Users, Gift } from 'lucide-react';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';

export const EstatisticasFidelidade = () => {
  const { estatisticas } = useSupabaseFidelidade();

  const stats = [
    {
      title: 'Clientes no Programa',
      value: estatisticas?.total_clientes_programa || 0,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Pontos Distribuídos',
      value: estatisticas?.total_pontos_distribuidos || 0,
      icon: Award,
      color: 'text-green-500'
    },
    {
      title: 'Pontos Resgatados',
      value: estatisticas?.total_pontos_resgatados || 0,
      icon: Gift,
      color: 'text-purple-500'
    },
    {
      title: 'Clientes Ativos (30d)',
      value: estatisticas?.clientes_ativos_30d || 0,
      icon: TrendingUp,
      color: 'text-orange-500'
    }
  ];

  return (
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
  );
};
