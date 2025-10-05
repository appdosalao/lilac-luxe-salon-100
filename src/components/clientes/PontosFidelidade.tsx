import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, TrendingUp, Award, History } from "lucide-react";
import { useProgramaFidelidade } from "@/hooks/useProgramaFidelidade";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PontosFidelidadeProps {
  clienteId: string;
}

export function PontosFidelidade({ clienteId }: PontosFidelidadeProps) {
  const { user } = useSupabaseAuth();
  const { programaAtivo, resgatarPontos } = useProgramaFidelidade();
  const [resgateOpen, setResgateOpen] = useState(false);
  const [pontosParaResgatar, setPontosParaResgatar] = useState("");

  const { data: pontos } = useQuery({
    queryKey: ['pontos-fidelidade', clienteId],
    queryFn: async () => {
      if (!user || !programaAtivo) return null;

      const { data, error } = await supabase
        .from('pontos_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .eq('cliente_id', clienteId)
        .eq('programa_id', programaAtivo.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user && !!programaAtivo
  });

  const { data: historico } = useQuery({
    queryKey: ['historico-pontos', clienteId],
    queryFn: async () => {
      if (!user || !programaAtivo) return [];

      const { data, error } = await supabase
        .from('historico_pontos')
        .select('*')
        .eq('user_id', user.id)
        .eq('cliente_id', clienteId)
        .eq('programa_id', programaAtivo.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!programaAtivo
  });

  if (!programaAtivo) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Nenhum programa de fidelidade ativo
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleResgatar = async () => {
    const pontos = parseInt(pontosParaResgatar);
    if (isNaN(pontos) || pontos <= 0) return;

    await resgatarPontos.mutateAsync({
      clienteId,
      pontosResgatados: pontos
    });

    setResgateOpen(false);
    setPontosParaResgatar("");
  };

  const valorPotencial = pontos?.pontos_disponiveis 
    ? (pontos.pontos_disponiveis * programaAtivo.valor_ponto).toFixed(2)
    : "0.00";

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Programa de Fidelidade
          </CardTitle>
          <CardDescription>{programaAtivo.nome}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pontos ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-primary">{pontos.pontos_disponiveis}</p>
                  <p className="text-xs text-muted-foreground">Disponíveis</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-accent/50">
                  <Gift className="h-4 w-4 text-foreground mx-auto mb-1" />
                  <p className="text-2xl font-bold">{pontos.pontos_totais}</p>
                  <p className="text-xs text-muted-foreground">Total Ganhos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <Award className="h-4 w-4 text-foreground mx-auto mb-1" />
                  <p className="text-2xl font-bold">{pontos.pontos_resgatados}</p>
                  <p className="text-xs text-muted-foreground">Resgatados</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm text-muted-foreground">Valor em pontos</p>
                  <p className="text-lg font-bold text-primary">R$ {valorPotencial}</p>
                </div>
                <Button 
                  onClick={() => setResgateOpen(true)}
                  disabled={pontos.pontos_disponiveis < programaAtivo.pontos_minimos_resgate}
                  size="sm"
                >
                  Resgatar
                </Button>
              </div>

              {historico && historico.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <History className="h-4 w-4" />
                    Histórico Recente
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {historico.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-background/50">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          <p>{item.descricao}</p>
                        </div>
                        <Badge variant={item.tipo === 'ganho' ? 'default' : 'secondary'}>
                          {item.tipo === 'ganho' ? '+' : ''}{item.pontos}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Cliente ainda não possui pontos
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pontos serão adicionados automaticamente após pagamentos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={resgateOpen} onOpenChange={setResgateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resgatar Pontos</DialogTitle>
            <DialogDescription>
              Mínimo de {programaAtivo.pontos_minimos_resgate} pontos para resgate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pontos">Quantidade de Pontos</Label>
              <Input
                id="pontos"
                type="number"
                value={pontosParaResgatar}
                onChange={(e) => setPontosParaResgatar(e.target.value)}
                placeholder={`Mínimo ${programaAtivo.pontos_minimos_resgate}`}
                min={programaAtivo.pontos_minimos_resgate}
                max={pontos?.pontos_disponiveis || 0}
              />
              {pontosParaResgatar && (
                <p className="text-sm text-muted-foreground mt-1">
                  Desconto: R$ {(parseInt(pontosParaResgatar) * programaAtivo.valor_ponto).toFixed(2)}
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setResgateOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleResgatar}
                disabled={!pontosParaResgatar || parseInt(pontosParaResgatar) < programaAtivo.pontos_minimos_resgate}
              >
                Resgatar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
