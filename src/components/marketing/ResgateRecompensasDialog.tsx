import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Star, Sparkles, CheckCircle2 } from "lucide-react";

interface ResgateRecompensasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  clienteNome: string;
  pontosDisponiveis: number;
  programaId: string;
  valorPonto: number;
}

interface Recompensa {
  id: string;
  nome: string;
  descricao: string;
  pontos_necessarios: number;
  tipo: 'desconto' | 'servico' | 'produto';
  valor?: number;
}

export function ResgateRecompensasDialog({
  open,
  onOpenChange,
  clienteId,
  clienteNome,
  pontosDisponiveis,
  programaId,
  valorPonto
}: ResgateRecompensasDialogProps) {
  const [recompensaSelecionada, setRecompensaSelecionada] = useState<Recompensa | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Recompensas padrão baseadas no valor do ponto
  const recompensasDisponiveis: Recompensa[] = [
    {
      id: '1',
      nome: 'Desconto de 10%',
      descricao: 'Desconto de 10% no próximo serviço',
      pontos_necessarios: 100,
      tipo: 'desconto',
      valor: 10
    },
    {
      id: '2',
      nome: 'Desconto de 20%',
      descricao: 'Desconto de 20% no próximo serviço',
      pontos_necessarios: 200,
      tipo: 'desconto',
      valor: 20
    },
    {
      id: '3',
      nome: 'Serviço Gratuito',
      descricao: 'Um serviço de até R$ 50 gratuito',
      pontos_necessarios: 500,
      tipo: 'servico',
      valor: 50
    },
    {
      id: '4',
      nome: 'Kit de Produtos',
      descricao: 'Kit especial de produtos para casa',
      pontos_necessarios: 300,
      tipo: 'produto'
    },
    {
      id: '5',
      nome: 'Desconto VIP 30%',
      descricao: 'Desconto de 30% + atendimento prioritário',
      pontos_necessarios: 1000,
      tipo: 'desconto',
      valor: 30
    }
  ];

  const resgatarRecompensa = useMutation({
    mutationFn: async (recompensa: Recompensa) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar pontos atuais
      const { data: pontosAtuais } = await supabase
        .from('pontos_fidelidade')
        .select('pontos_resgatados')
        .eq('cliente_id', clienteId)
        .eq('programa_id', programaId)
        .single();

      // Atualizar pontos do cliente
      const { error: updateError } = await supabase
        .from('pontos_fidelidade')
        .update({
          pontos_disponiveis: pontosDisponiveis - recompensa.pontos_necessarios,
          pontos_resgatados: (pontosAtuais?.pontos_resgatados || 0) + recompensa.pontos_necessarios
        })
        .eq('cliente_id', clienteId)
        .eq('programa_id', programaId);

      if (updateError) throw updateError;

      // Registrar no histórico
      const { error: historicoError } = await supabase
        .from('historico_pontos')
        .insert({
          user_id: user.id,
          cliente_id: clienteId,
          programa_id: programaId,
          pontos: -recompensa.pontos_necessarios,
          tipo: 'resgate',
          descricao: `Resgate: ${recompensa.nome}`
        });

      if (historicoError) throw historicoError;

      return recompensa;
    },
    onSuccess: (recompensa) => {
      queryClient.invalidateQueries({ queryKey: ['ranking-fidelidade'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-fidelidade'] });
      queryClient.invalidateQueries({ queryKey: ['pontos-cliente'] });
      
      toast({
        title: "🎉 Recompensa Resgatada!",
        description: `${clienteNome} resgatou: ${recompensa.nome}`,
      });
      
      onOpenChange(false);
      setRecompensaSelecionada(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível resgatar a recompensa",
        variant: "destructive",
      });
    }
  });

  const handleResgate = () => {
    if (recompensaSelecionada) {
      resgatarRecompensa.mutate(recompensaSelecionada);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'desconto': return '💰';
      case 'servico': return '✨';
      case 'produto': return '🎁';
      default: return '⭐';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Resgatar Recompensas
          </DialogTitle>
          <DialogDescription>
            {clienteNome} tem <span className="font-bold text-primary">{pontosDisponiveis} pontos</span> disponíveis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {recompensasDisponiveis.map((recompensa) => {
            const podeResgatar = pontosDisponiveis >= recompensa.pontos_necessarios;
            const isSelected = recompensaSelecionada?.id === recompensa.id;

            return (
              <Card
                key={recompensa.id}
                className={`p-4 cursor-pointer transition-all ${
                  podeResgatar ? 'hover:border-primary' : 'opacity-50'
                } ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => podeResgatar && setRecompensaSelecionada(recompensa)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{getTipoIcon(recompensa.tipo)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {recompensa.nome}
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </h3>
                        <p className="text-sm text-muted-foreground">{recompensa.descricao}</p>
                      </div>
                      <Badge variant={podeResgatar ? "default" : "secondary"}>
                        {recompensa.pontos_necessarios} pts
                      </Badge>
                    </div>
                    
                    {!podeResgatar && (
                      <div className="text-xs text-muted-foreground">
                        Faltam {recompensa.pontos_necessarios - pontosDisponiveis} pontos
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleResgate}
            disabled={!recompensaSelecionada || resgatarRecompensa.isPending}
          >
            {resgatarRecompensa.isPending ? "Resgatando..." : "Confirmar Resgate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
