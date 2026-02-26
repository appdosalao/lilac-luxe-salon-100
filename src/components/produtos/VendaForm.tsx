import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useSupabaseVendas } from '@/hooks/useSupabaseVendas';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';
import { useSupabaseClientes } from '@/hooks/useSupabaseClientes';
import { NovoItemVenda } from '@/types/venda';

export function VendaForm({ onSuccess }: { onSuccess: () => void }) {
  const { createVenda } = useSupabaseVendas();
  const { produtos } = useSupabaseProdutos();
  const { clientes } = useSupabaseClientes();
  
  const [clienteId, setClienteId] = useState('');
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<NovoItemVenda[]>([
    { produto_id: '', quantidade: 1, valor_unitario: 0, valor_total: 0 }
  ]);

  const produtosRevenda = produtos.filter(p => p.categoria === 'revenda' && p.ativo);

  const adicionarItem = () => {
    setItens([...itens, { produto_id: '', quantidade: 1, valor_unitario: 0, valor_total: 0 }]);
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const atualizarItem = (index: number, campo: keyof NovoItemVenda, valor: any) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    
    if (campo === 'produto_id') {
      const produto = produtos.find(p => p.id === valor);
      if (produto) {
        novosItens[index].valor_unitario = produto.preco_venda;
      }
    }
    
    if (campo === 'quantidade' || campo === 'valor_unitario') {
      novosItens[index].valor_total = novosItens[index].quantidade * novosItens[index].valor_unitario;
    }
    
    setItens(novosItens);
  };

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + item.valor_total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (itens.some(item => !item.produto_id)) {
      alert('Selecione um produto para cada item');
      return;
    }

    try {
      await createVenda({
        cliente_id: clienteId || undefined,
        data_venda: dataVenda,
        forma_pagamento: formaPagamento || undefined,
        observacoes: observacoes || undefined,
        itens,
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Informações da Venda</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Cliente (opcional)</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data da Venda</Label>
            <Input
              type="date"
              value={dataVenda}
              onChange={(e) => setDataVenda(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a venda"
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Itens da Venda</h3>
          <Button type="button" variant="outline" size="sm" onClick={adicionarItem}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Item
          </Button>
        </div>

        {produtosRevenda.length === 0 && (
          <p className="text-muted-foreground text-sm mb-4">
            Nenhum produto de revenda cadastrado. Cadastre produtos com a categoria "Revenda" para poder vendê-los.
          </p>
        )}

        <div className="space-y-4">
          {itens.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="grid gap-4 md:grid-cols-12 items-end">
                <div className="md:col-span-5">
                  <Label>Produto</Label>
                  <Select
                    value={item.produto_id}
                    onValueChange={(value) => atualizarItem(index, 'produto_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosRevenda.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} - R$ {p.preco_venda.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(index, 'quantidade', parseFloat(e.target.value))}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Valor Unitário</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.valor_unitario}
                    onChange={(e) => atualizarItem(index, 'valor_unitario', parseFloat(e.target.value))}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Total</Label>
                  <Input
                    type="number"
                    value={item.valor_total.toFixed(2)}
                    disabled
                  />
                </div>

                <div className="md:col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removerItem(index)}
                    disabled={itens.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Valor Total:</span>
            <span>R$ {calcularTotal().toFixed(2)}</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit">
          Registrar Venda
        </Button>
      </div>
    </form>
  );
}
