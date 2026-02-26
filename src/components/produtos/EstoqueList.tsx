import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseEstoque } from '@/hooks/useSupabaseEstoque';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Settings, AlertTriangle } from 'lucide-react';

export function EstoqueList() {
  const { movimentacoes, loading } = useSupabaseEstoque();

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'saida':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ajuste':
        return <Settings className="h-4 w-4 text-blue-600" />;
      case 'perda':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: any = {
      entrada: 'Entrada',
      saida: 'Saída',
      ajuste: 'Ajuste',
      perda: 'Perda',
    };
    return labels[tipo] || tipo;
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return 'default';
      case 'saida':
        return 'secondary';
      case 'perda':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Movimentações de Estoque</h2>

      <div className="grid gap-4">
        {movimentacoes.map((mov) => (
          <Card key={mov.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {getTipoIcon(mov.tipo)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getTipoBadgeVariant(mov.tipo)}>
                      {getTipoLabel(mov.tipo)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(mov.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium mb-1">
                    Produto ID: {mov.produto_id.slice(0, 8)}
                  </p>
                  
                  {mov.motivo && (
                    <p className="text-sm text-muted-foreground">{mov.motivo}</p>
                  )}
                  
                  {mov.origem_tipo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Origem: {mov.origem_tipo}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold">
                  {mov.tipo === 'entrada' ? '+' : '-'} {mov.quantidade}
                </p>
                {mov.valor_total > 0 && (
                  <p className="text-sm text-muted-foreground">
                    R$ {Number(mov.valor_total).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}

        {movimentacoes.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhuma movimentação registrada ainda.
          </Card>
        )}
      </div>
    </div>
  );
}
