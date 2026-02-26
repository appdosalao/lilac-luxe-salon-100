import { useState } from 'react';
import { DollarSign, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Agendamento } from '@/types/agendamento';

interface PagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: Agendamento | null;
  onConfirmar: (agendamentoId: string, valorPago: number, formaPagamento: string) => Promise<boolean>;
}

export default function PagamentoDialog({
  open,
  onOpenChange,
  agendamento,
  onConfirmar,
}: PagamentoDialogProps) {
  const [valorPago, setValorPago] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<string>('dinheiro');
  const [processando, setProcessando] = useState(false);

  const valorDevido = agendamento?.valorDevido || 0;
  const valorTotal = agendamento?.valor || 0;

  const handleConfirmar = async (pagarCompleto: boolean) => {
    if (!agendamento) return;

    setProcessando(true);
    const valor = pagarCompleto ? valorDevido : parseFloat(valorPago.replace(',', '.')) || 0;
    
    const sucesso = await onConfirmar(agendamento.id, valor, formaPagamento);
    
    if (sucesso) {
      onOpenChange(false);
      setValorPago('');
      setFormaPagamento('dinheiro');
    }
    setProcessando(false);
  };

  const formatarValor = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Registrar Pagamento
          </DialogTitle>
          <DialogDescription>
            Registre o pagamento do agendamento de {agendamento?.clienteNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do agendamento */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor Total:</span>
              <span className="font-semibold">{formatarValor(valorTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Já Pago:</span>
              <span className="font-semibold text-success">
                {formatarValor(agendamento?.valorPago || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground font-medium">Valor Devido:</span>
              <span className="font-bold text-destructive">{formatarValor(valorDevido)}</span>
            </div>
          </div>

          {/* Forma de pagamento */}
          <div className="space-y-2">
            <Label htmlFor="forma-pagamento">Forma de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger id="forma-pagamento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">
                  <div className="flex items-center gap-2">
                    <span>💵</span>
                    Dinheiro
                  </div>
                </SelectItem>
                <SelectItem value="cartao">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão
                  </div>
                </SelectItem>
                <SelectItem value="pix">
                  <div className="flex items-center gap-2">
                    <span>📱</span>
                    PIX
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor parcial */}
          <div className="space-y-2">
            <Label htmlFor="valor-pago">Valor Pago (parcial)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="valor-pago"
                type="text"
                placeholder="0,00"
                value={valorPago}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d,]/g, '');
                  setValorPago(value);
                }}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para pagar o valor completo
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processando}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => handleConfirmar(false)}
            disabled={processando || !valorPago}
            className="w-full sm:w-auto"
          >
            Pagar Parcial
          </Button>
          <Button
            onClick={() => handleConfirmar(true)}
            disabled={processando}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-lilac-primary"
          >
            {processando ? 'Processando...' : 'Pagar Completo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
