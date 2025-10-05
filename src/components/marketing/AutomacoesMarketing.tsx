import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Zap, PlayCircle, PauseCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AutomacaoDialog } from "./AutomacaoDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export function AutomacoesMarketing() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: automacoes, isLoading } = useQuery({
    queryKey: ['automacoes-marketing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automacoes_marketing')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const toggleAutomacao = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('automacoes_marketing')
        .update({ ativo })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automacoes-marketing'] });
      toast({
        title: "Automação atualizada",
        description: "Status alterado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a automação",
        variant: "destructive",
      });
    }
  });

  const gatilhoMap = {
    novo_agendamento: "Novo Agendamento",
    agendamento_confirmado: "Agendamento Confirmado",
    agendamento_cancelado: "Agendamento Cancelado",
    aniversario: "Aniversário do Cliente",
    ausencia_dias: "Cliente Ausente",
    primeira_visita: "Primeira Visita",
    fidelidade_nivel: "Novo Nível de Fidelidade"
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Automações de Marketing</CardTitle>
            <CardDescription>Configure ações automáticas baseadas em eventos</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Automação
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : automacoes && automacoes.length > 0 ? (
            <div className="space-y-4">
              {automacoes.map((automacao) => (
                <Card key={automacao.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{automacao.nome}</CardTitle>
                          <Badge variant={automacao.ativo ? "default" : "secondary"}>
                            {automacao.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        {automacao.descricao && (
                          <CardDescription>{automacao.descricao}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={automacao.ativo}
                          onCheckedChange={(checked) => 
                            toggleAutomacao.mutate({ id: automacao.id, ativo: checked })
                          }
                        />
                        {automacao.ativo ? (
                          <PlayCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <PauseCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Gatilho:</span>
                        <span className="font-medium">
                          {gatilhoMap[automacao.gatilho as keyof typeof gatilhoMap]}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total de Execuções</p>
                          <p className="font-medium">{automacao.total_execucoes || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Última Execução</p>
                          <p className="font-medium">
                            {automacao.ultima_execucao
                              ? new Date(automacao.ultima_execucao).toLocaleDateString()
                              : "Nunca executada"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma automação criada ainda
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Automação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AutomacaoDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
