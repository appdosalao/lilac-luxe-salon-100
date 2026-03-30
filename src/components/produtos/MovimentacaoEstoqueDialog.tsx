import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';

interface MovimentacaoEstoqueDialogProps {
  produto: any;
  tipo: 'entrada' | 'saida';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MovimentacaoEstoqueDialog({
  produto,
  tipo,
  open,
  onOpenChange,
  onSuccess
}: MovimentacaoEstoqueDialogProps) {
  const { movimentarEstoque } = useSupabaseProdutos();
  const [quantidade, setQuantidade] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const qtd = parseFloat(quantidade);
      if (isNaN(qtd) || qtd <= 0) {
        throw new Error('Quantidade inválida');
      }

      const success = await movimentarEstoque({
        produto_id: produto.id,
        tipo,
        quantidade: qtd,
        motivo: motivo || undefined,
        valor_unitario: tipo === 'entrada' ? produto.preco_custo : produto.preco_venda
      });

      if (success) {
        onSuccess();
        onOpenChange(false);
        setQuantidade('1');
        setMotivo('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Input value={produto?.nome} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade ({produto?.unidade_medida})</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.01"
                min="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (Opcional)</Label>
              <Textarea
                id="motivo"
                placeholder="Ex: Ajuste de inventário, perda, brinde..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
