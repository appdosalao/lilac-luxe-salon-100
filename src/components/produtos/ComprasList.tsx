import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabaseCompras } from '@/hooks/useSupabaseCompras';
import { CompraForm } from './CompraForm';
import { ShoppingCart, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

export function ComprasList() {
  const { compras, loading } = useSupabaseCompras();
  const [showForm, setShowForm] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pendente: 'secondary',
      pago_parcial: 'default',
      pago: 'default',
      vencido: 'destructive',
    };
    const labels: any = {
      pendente: 'Pendente',
      pago_parcial: 'Pago Parcial',
      pago: 'Pago',
      vencido: 'Vencido',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  if (showForm) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Registrar Nova Compra</h2>
        <CompraForm onSuccess={() => setShowForm(false)} />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Histórico de Compras</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Compra
        </Button>
      </div>

      <div className="grid gap-4">
        {compras.map((compra) => (
          <Card key={compra.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">
                    {compra.numero_nota ? `Nota: ${compra.numero_nota}` : `Compra #${compra.id.slice(0, 8)}`}
                  </h3>
                  {getStatusBadge(compra.status_pagamento)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(compra.data_compra), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">R$ {Number(compra.valor_total).toFixed(2)}</p>
                {compra.valor_devido > 0 && (
                  <p className="text-sm text-destructive">
                    Devido: R$ {Number(compra.valor_devido).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {compra.itens_compra && compra.itens_compra.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium mb-2">Itens:</p>
                <div className="space-y-1">
                  {compra.itens_compra.map((item: any) => (
                    <div key={item.id} className="text-sm flex justify-between">
                      <span>{item.quantidade}x - Produto ID: {item.produto_id.slice(0, 8)}</span>
                      <span>R$ {Number(item.valor_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}

        {compras.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhuma compra registrada ainda.
          </Card>
        )}
      </div>
    </div>
  );
}
