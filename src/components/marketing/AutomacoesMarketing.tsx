import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Zap, PlayCircle, PauseCircle, Activity, Clock, Trash2, MoreVertical, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AutomacaoDialog } from "./AutomacaoDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AutomacoesMarketing() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [automacaoToDelete, setAutomacaoToDelete] = useState<string | null>(null);
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

  const deletarAutomacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automacoes_marketing')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automacoes-marketing'] });
      toast({
        title: "Automação excluída",
        description: "Automação removida com sucesso",
      });
      setAutomacaoToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a automação",
        variant: "destructive",
      });
    }
  });

  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-automacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automacoes_marketing')
        .select('ativo, total_execucoes');
      
      if (error) throw error;
      
      const totalAutomacoes = data?.length || 0;
      const automacoesAtivas = data?.filter(a => a.ativo).length || 0;
      const totalExecucoes = data?.reduce((sum, a) => sum + (a.total_execucoes || 0), 0) || 0;
      
      return { totalAutomacoes, automacoesAtivas, totalExecucoes };
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Automações</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.totalAutomacoes || 0}</div>
            <p className="text-xs text-muted-foreground">criadas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automações Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.automacoesAtivas || 0}</div>
            <p className="text-xs text-muted-foreground">em execução</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.totalExecucoes || 0}</div>
            <p className="text-xs text-muted-foreground">automações processadas</p>
          </CardContent>
        </Card>
      </div>
      
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
                <Card key={automacao.id} className="border-l-4" style={{
                  borderLeftColor: automacao.ativo ? 'hsl(var(--success))' : 'hsl(var(--muted))'
                }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{automacao.nome}</CardTitle>
                              <Badge variant={automacao.ativo ? "default" : "secondary"}>
                                {automacao.ativo ? "Ativa" : "Inativa"}
                              </Badge>
                            </div>
                            {automacao.descricao && (
                              <CardDescription className="mt-1">{automacao.descricao}</CardDescription>
                            )}
                          </div>
                        </div>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => setAutomacaoToDelete(automacao.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Zap className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gatilho</p>
                        <p className="text-sm font-semibold">
                          {gatilhoMap[automacao.gatilho as keyof typeof gatilhoMap]}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total de Execuções</p>
                          <p className="text-sm font-semibold">{automacao.total_execucoes || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Última Execução</p>
                          <p className="text-sm font-semibold">
                            {automacao.ultima_execucao
                              ? new Date(automacao.ultima_execucao).toLocaleDateString('pt-BR')
                              : "Nunca"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {automacao.acoes && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground mb-2">Ação configurada</p>
                        <div className="text-sm">
                          <Badge variant="outline">
                            {(automacao.acoes as any).tipo === 'email' && 'E-mail'}
                            {(automacao.acoes as any).tipo === 'sms' && 'SMS'}
                            {(automacao.acoes as any).tipo === 'whatsapp' && 'WhatsApp'}
                            {(automacao.acoes as any).tipo === 'notificacao' && 'Notificação'}
                          </Badge>
                        </div>
                      </div>
                    )}
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
      
      <AlertDialog open={!!automacaoToDelete} onOpenChange={() => setAutomacaoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta automação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => automacaoToDelete && deletarAutomacao.mutate(automacaoToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
