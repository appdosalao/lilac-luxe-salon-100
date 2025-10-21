import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RankingFidelidade, Recompensa } from '@/types/fidelidade';

interface ResgateRecompensaDialogProps {
  cliente: RankingFidelidade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResgate: () => void;
}

export const ResgateRecompensaDialog = ({ 
  cliente, 
  open, 
  onOpenChange,
  onResgate 
}: ResgateRecompensaDialogProps) => {
  const { recompensas } = useSupabaseFidelidade();
  const [recompensaSelecionada, setRecompensaSelecionada] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recompensasDisponiveis, setRecompensasDisponiveis] = useState<Recompensa[]>([]);

  useEffect(() => {
    // Filtrar recompensas que o cliente pode resgatar
    const disponiveis = recompensas.filter(r => {
      if (!r.ativo) return false;
      if (r.pontos_necessarios > cliente.pontos_disponiveis) return false;
      
      // Se a recompensa é exclusiva de uma classe, verificar se o cliente está nela
      if (r.classe_id && cliente.classe_nome) {
        // Buscar a classe da recompensa para comparar
        return true; // Por enquanto permitir, pode refinar depois
      }
      
      return true;
    });
    
    setRecompensasDisponiveis(disponiveis);
  }, [recompensas, cliente]);

  const handleResgate = async () => {
    if (!recompensaSelecionada) {
      toast.error('Selecione uma recompensa');
      return;
    }

    const recompensa = recompensas.find(r => r.id === recompensaSelecionada);
    if (!recompensa) return;

    try {
      setLoading(true);

      // 1. Registrar o resgate
      const dataExpiracao = new Date();
      dataExpiracao.setDate(dataExpiracao.getDate() + recompensa.validade_dias);

      const { data: resgate, error: erroResgate } = await supabase
        .from('historico_resgates')
        .insert({
          user_id: cliente.user_id,
          cliente_id: cliente.cliente_id,
          recompensa_id: recompensa.id,
          pontos_gastos: recompensa.pontos_necessarios,
          data_expiracao: dataExpiracao.toISOString().split('T')[0]
        })
        .select()
        .single();

      if (erroResgate) throw erroResgate;

      // 2. Deduzir pontos do cliente
      const { error: erroPontos } = await supabase
        .from('pontos_fidelidade')
        .insert({
          user_id: cliente.user_id,
          cliente_id: cliente.cliente_id,
          pontos: -recompensa.pontos_necessarios,
          origem: 'resgate',
          origem_id: resgate.id,
          descricao: `Resgate: ${recompensa.nome}`
        });

      if (erroPontos) throw erroPontos;

      // 3. Preparar mensagem para o cliente
      const mensagem = `🎁 *Recompensa Resgatada!*\n\n` +
        `Olá ${cliente.cliente_nome}!\n\n` +
        `Você resgatou: *${recompensa.nome}*\n` +
        `Pontos gastos: ${recompensa.pontos_necessarios}\n` +
        `Pontos restantes: ${cliente.pontos_disponiveis - recompensa.pontos_necessarios}\n\n` +
        `${recompensa.descricao || ''}\n\n` +
        `Válido até: ${new Date(dataExpiracao).toLocaleDateString('pt-BR')}\n\n` +
        `Apresente esta mensagem no seu próximo atendimento! ✨`;

      // 4. Abrir WhatsApp com a mensagem
      const telefone = cliente.telefone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
      window.open(whatsappUrl, '_blank');

      toast.success('Resgate realizado! WhatsApp aberto para enviar confirmação.');
      onResgate();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Erro ao resgatar recompensa:', error);
      toast.error('Erro ao processar resgate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Resgatar Recompensa
          </DialogTitle>
          <DialogDescription>
            Cliente: {cliente.cliente_nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Pontos disponíveis: <strong>{cliente.pontos_disponiveis}</strong>
            </AlertDescription>
          </Alert>

          {recompensasDisponiveis.length === 0 ? (
            <Alert>
              <AlertDescription>
                Este cliente não tem pontos suficientes para resgatar nenhuma recompensa no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Selecione a Recompensa</Label>
                <Select value={recompensaSelecionada} onValueChange={setRecompensaSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma recompensa" />
                  </SelectTrigger>
                  <SelectContent>
                    {recompensasDisponiveis.map((recompensa) => (
                      <SelectItem key={recompensa.id} value={recompensa.id}>
                        {recompensa.nome} - {recompensa.pontos_necessarios} pontos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {recompensaSelecionada && (() => {
                const r = recompensas.find(x => x.id === recompensaSelecionada);
                return r ? (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-medium">{r.nome}</h4>
                    {r.descricao && (
                      <p className="text-sm text-muted-foreground">{r.descricao}</p>
                    )}
                    <div className="text-sm">
                      <p>Pontos necessários: <strong>{r.pontos_necessarios}</strong></p>
                      <p>Validade: <strong>{r.validade_dias} dias</strong></p>
                    </div>
                  </div>
                ) : null;
              })()}

              <Button 
                onClick={handleResgate} 
                disabled={!recompensaSelecionada || loading}
                className="w-full"
              >
                {loading ? 'Processando...' : 'Resgatar e Enviar WhatsApp'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
