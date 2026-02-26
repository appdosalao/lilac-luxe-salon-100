import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingBag } from 'lucide-react';
import { useSupabaseVendas } from '@/hooks/useSupabaseVendas';
import { VendaForm } from './VendaForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function VendasList() {
  const { vendas, loading } = useSupabaseVendas();
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return <div>Carregando vendas...</div>;
  }

  if (showForm) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Registrar Nova Venda</h2>
        <VendaForm onSuccess={() => setShowForm(false)} />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Vendas de Produtos</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      {vendas.length === 0 ? (
        <Card className="p-8 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhuma venda registrada ainda.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {vendas.map((venda) => (
            <Card key={venda.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">
                      Venda #{venda.id.slice(0, 8)}
                    </h3>
                    <Badge variant={venda.status_pagamento === 'pago' ? 'default' : 'secondary'}>
                      {venda.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      Data: {format(new Date(venda.data_venda), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    {venda.forma_pagamento && (
                      <p>Pagamento: {venda.forma_pagamento}</p>
                    )}
                    {venda.observacoes && (
                      <p className="mt-2">{venda.observacoes}</p>
                    )}
                  </div>

                  {venda.itens_venda && venda.itens_venda.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Itens:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {venda.itens_venda.map((item) => (
                          <li key={item.id}>
                            {item.quantidade}x - R$ {item.valor_unitario.toFixed(2)} = R$ {item.valor_total.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    R$ {venda.valor_total.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
