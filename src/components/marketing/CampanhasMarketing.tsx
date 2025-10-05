import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Send, Users, BarChart3, TrendingUp, MousePointerClick, Mail, Eye, Trash2, Play, MoreVertical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampanhaDialog } from "./CampanhaDialog";
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

export function CampanhasMarketing() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [campanhaToDelete, setCampanhaToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campanhas, isLoading } = useQuery({
    queryKey: ['campanhas-marketing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campanhas_marketing')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const statusMap = {
    rascunho: { label: "Rascunho", variant: "secondary" as const },
    agendada: { label: "Agendada", variant: "default" as const },
    enviando: { label: "Enviando", variant: "default" as const },
    concluida: { label: "Concluída", variant: "outline" as const },
    cancelada: { label: "Cancelada", variant: "destructive" as const }
  };

  const tipoMap = {
    email: "E-mail",
    sms: "SMS",
    whatsapp: "WhatsApp",
    notificacao: "Notificação"
  };

  const deletarCampanha = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campanhas_marketing')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas-marketing'] });
      toast({
        title: "Campanha excluída",
        description: "Campanha removida com sucesso",
      });
      setCampanhaToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a campanha",
        variant: "destructive",
      });
    }
  });

  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-campanhas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campanhas_marketing')
        .select('status, total_enviados, total_destinatarios, metricas');
      
      if (error) throw error;
      
      const totalCampanhas = data?.length || 0;
      const campanhasAtivas = data?.filter(c => c.status === 'enviando' || c.status === 'agendada').length || 0;
      const totalEnviados = data?.reduce((sum, c) => sum + (c.total_enviados || 0), 0) || 0;
      const taxaAbertura = data?.reduce((sum, c) => {
        const metricas = c.metricas as any;
        return sum + (metricas?.aberturas || 0);
      }, 0) || 0;
      
      return { totalCampanhas, campanhasAtivas, totalEnviados, taxaAbertura };
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.totalCampanhas || 0}</div>
            <p className="text-xs text-muted-foreground">criadas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.campanhasAtivas || 0}</div>
            <p className="text-xs text-muted-foreground">em andamento</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.totalEnviados || 0}</div>
            <p className="text-xs text-muted-foreground">mensagens</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aberturas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.taxaAbertura || 0}</div>
            <p className="text-xs text-muted-foreground">aberturas</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Campanhas de Marketing</CardTitle>
            <CardDescription>Crie e gerencie campanhas para seus clientes</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Campanha
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : campanhas && campanhas.length > 0 ? (
            <div className="space-y-4">
              {campanhas.map((campanha) => {
                const metricas = campanha.metricas as any;
                const taxaEnvio = campanha.total_destinatarios 
                  ? ((campanha.total_enviados || 0) / campanha.total_destinatarios) * 100 
                  : 0;
                const taxaAbertura = campanha.total_enviados && metricas?.aberturas
                  ? (metricas.aberturas / campanha.total_enviados) * 100
                  : 0;
                  
                return (
                  <Card key={campanha.id} className="border-l-4" style={{
                    borderLeftColor: campanha.status === 'concluida' 
                      ? 'hsl(var(--primary))' 
                      : campanha.status === 'enviando'
                      ? 'hsl(var(--success))'
                      : 'hsl(var(--muted))'
                  }}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Send className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{campanha.nome}</CardTitle>
                                <Badge variant={statusMap[campanha.status as keyof typeof statusMap]?.variant}>
                                  {statusMap[campanha.status as keyof typeof statusMap]?.label}
                                </Badge>
                              </div>
                              {campanha.descricao && (
                                <CardDescription className="mt-1">{campanha.descricao}</CardDescription>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => setCampanhaToDelete(campanha.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Tipo</p>
                            <p className="text-sm font-semibold">{tipoMap[campanha.tipo as keyof typeof tipoMap]}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Destinatários</p>
                            <p className="text-sm font-semibold">{campanha.total_destinatarios || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Enviados</p>
                            <p className="text-sm font-semibold">{campanha.total_enviados || 0}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Data</p>
                          <p className="text-sm font-semibold">
                            {campanha.data_envio 
                              ? new Date(campanha.data_envio).toLocaleDateString('pt-BR')
                              : campanha.data_agendamento
                              ? new Date(campanha.data_agendamento).toLocaleDateString('pt-BR')
                              : "-"}
                          </p>
                        </div>
                      </div>
                      
                      {campanha.total_destinatarios > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso de Envio</span>
                            <span className="font-medium">{taxaEnvio.toFixed(1)}%</span>
                          </div>
                          <Progress value={taxaEnvio} className="h-2" />
                        </div>
                      )}
                      
                      {campanha.status === 'concluida' && metricas && (
                        <div className="border-t pt-4 space-y-3">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Métricas de Desempenho
                          </p>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Aberturas</p>
                              </div>
                              <p className="text-lg font-bold">{metricas.aberturas || 0}</p>
                              {taxaAbertura > 0 && (
                                <p className="text-xs text-muted-foreground">{taxaAbertura.toFixed(1)}%</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Cliques</p>
                              </div>
                              <p className="text-lg font-bold">{metricas.cliques || 0}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Conversões</p>
                              </div>
                              <p className="text-lg font-bold">{metricas.conversoes || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Send className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma campanha criada ainda
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Campanha
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CampanhaDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      
      <AlertDialog open={!!campanhaToDelete} onOpenChange={() => setCampanhaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => campanhaToDelete && deletarCampanha.mutate(campanhaToDelete)}
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
