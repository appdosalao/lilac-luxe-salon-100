import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Gift, Users, TrendingUp, Star, Edit, Trash2, MoreVertical, Calendar, DollarSign, Award } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProgramaFidelidadeDialog } from "./ProgramaFidelidadeDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import { Progress } from "@/components/ui/progress";

export function ProgramasFidelidade() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [programaToDelete, setProgramaToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: programas, isLoading } = useQuery({
    queryKey: ['programas-fidelidade'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programas_fidelidade')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-fidelidade'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pontos_fidelidade')
        .select('pontos_totais, pontos_disponiveis, pontos_resgatados, cliente_id');
      
      if (error) throw error;
      
      const totalPontos = data?.reduce((sum, p) => sum + p.pontos_totais, 0) || 0;
      const pontosDisponiveis = data?.reduce((sum, p) => sum + p.pontos_disponiveis, 0) || 0;
      const pontosResgatados = data?.reduce((sum, p) => sum + p.pontos_resgatados, 0) || 0;
      const clientesAtivos = new Set(data?.map(p => p.cliente_id)).size;
      
      return { totalPontos, pontosDisponiveis, pontosResgatados, clientesAtivos };
    }
  });

  const deletarPrograma = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('programas_fidelidade')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programas-fidelidade'] });
      toast({
        title: "Programa excluído",
        description: "Programa de fidelidade removido com sucesso",
      });
      setProgramaToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o programa",
        variant: "destructive",
      });
    }
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('programas_fidelidade')
        .update({ ativo })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programas-fidelidade'] });
      toast({
        title: "Status atualizado",
        description: "Programa atualizado com sucesso",
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.totalPontos || 0}</div>
            <p className="text-xs text-muted-foreground">pontos distribuídos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Disponíveis</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.pontosDisponiveis || 0}</div>
            <p className="text-xs text-muted-foreground">prontos para resgate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.clientesAtivos || 0}</div>
            <p className="text-xs text-muted-foreground">no programa</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Resgatados</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.pontosResgatados || 0}</div>
            <p className="text-xs text-muted-foreground">utilizados por clientes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Programas de Fidelidade</CardTitle>
            <CardDescription>Crie e gerencie seus programas de pontos</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Programa
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : programas && programas.length > 0 ? (
            <div className="space-y-4">
              {programas.map((programa) => (
                <Card key={programa.id} className="border-l-4" style={{
                  borderLeftColor: programa.ativo ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Star className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{programa.nome}</CardTitle>
                            {programa.descricao && (
                              <CardDescription className="mt-1">{programa.descricao}</CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={programa.ativo ? "default" : "secondary"}>
                          {programa.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleAtivo.mutate({ 
                              id: programa.id, 
                              ativo: !programa.ativo 
                            })}>
                              {programa.ativo ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setProgramaToDelete(programa.id)}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pontos por R$</p>
                          <p className="text-sm font-semibold">{programa.pontos_por_real}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Valor do Ponto</p>
                          <p className="text-sm font-semibold">R$ {programa.valor_ponto}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Mín. Resgate</p>
                          <p className="text-sm font-semibold">{programa.pontos_minimos_resgate} pts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Início</p>
                          <p className="text-sm font-semibold">
                            {new Date(programa.data_inicio).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {programa.data_fim && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Data de Término:</span>
                          <span className="font-medium">
                            {new Date(programa.data_fim).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum programa de fidelidade criado ainda
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Programa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ProgramaFidelidadeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      
      <AlertDialog open={!!programaToDelete} onOpenChange={() => setProgramaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este programa de fidelidade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => programaToDelete && deletarPrograma.mutate(programaToDelete)}
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
