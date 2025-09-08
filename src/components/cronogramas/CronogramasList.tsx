import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit, Trash2, Play, Pause, CheckCircle } from "lucide-react";
import { useCronogramas } from "@/hooks/useCronogramas";
import { useSupabaseClientes } from "@/hooks/useSupabaseClientes";
import { useServicos } from "@/hooks/useServicos";
import { useSupabaseAgendamentos } from "@/hooks/useSupabaseAgendamentos";
import { useToast } from "@/hooks/use-toast";
import CronogramaForm from "./CronogramaForm";
import CronogramaComAgendamentos from "./CronogramaComAgendamentos";

export default function CronogramasList() {
  const [editingCronograma, setEditingCronograma] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [activatingCronograma, setActivatingCronograma] = useState<any>(null);
  const [showActivationDialog, setShowActivationDialog] = useState(false);

  const { cronogramas, loading, deleteCronograma } = useCronogramas();
  const { clientes } = useSupabaseClientes();
  const { servicos } = useServicos();
  const { agendamentos, criarAgendamento } = useSupabaseAgendamentos();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteCronograma(id);
      toast({
        title: "Cronograma removido",
        description: "O cronograma foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover cronograma.",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCronograma(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCronograma(null);
  };

  const handleAtivarCronograma = (cronograma: any) => {
    setActivatingCronograma(cronograma);
    setShowActivationDialog(true);
  };

  const handleGerarAgendamentos = async (agendamentos: any[]) => {
    try {
      // Criar múltiplos agendamentos usando o hook do Supabase
      for (const agendamentoData of agendamentos) {
        await criarAgendamento(agendamentoData);
      }
      
      setShowActivationDialog(false);
      setActivatingCronograma(null);
      
      toast({
        title: "Cronograma ativado",
        description: `${agendamentos.length} agendamentos foram criados com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar agendamentos.",
        variant: "destructive",
      });
    }
  };

  const handleCancelAtivar = () => {
    setShowActivationDialog(false);
    setActivatingCronograma(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'cancelado':
        return <Badge variant="destructive"><Pause className="w-3 h-3 mr-1" />Cancelado</Badge>;
      case 'concluido':
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRecorrenciaText = (cronograma: any) => {
    if (cronograma.recorrencia === 'Personalizada' && cronograma.intervalo_dias) {
      return `A cada ${cronograma.intervalo_dias} dias`;
    }
    return cronograma.recorrencia;
  };

  const getProximoRetorno = (cronograma: any) => {
    const dataInicio = new Date(cronograma.data_inicio);
    const hoje = new Date();
    
    let intervalo = 7; // padrão semanal
    if (cronograma.recorrencia === 'Quinzenal') intervalo = 14;
    else if (cronograma.recorrencia === 'Mensal') intervalo = 30;
    else if (cronograma.recorrencia === 'Personalizada' && cronograma.intervalo_dias) {
      intervalo = cronograma.intervalo_dias;
    }

    // Encontrar a próxima data
    let proximaData = new Date(dataInicio);
    while (proximaData <= hoje) {
      proximaData.setDate(proximaData.getDate() + intervalo);
    }

    return proximaData.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return <div>Carregando cronogramas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Lista de Cronogramas</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie cronogramas de retorno dos seus clientes
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCronograma(null)} className="w-full sm:w-auto">
              Novo Cronograma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCronograma ? 'Editar Cronograma' : 'Novo Cronograma'}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes do cronograma de retorno
              </DialogDescription>
            </DialogHeader>
            <CronogramaForm
              cronograma={editingCronograma}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ativar Cronograma</DialogTitle>
            <DialogDescription>
              Configure os agendamentos automáticos para este cronograma
            </DialogDescription>
          </DialogHeader>
          {activatingCronograma && (
            <CronogramaComAgendamentos
              cronograma={activatingCronograma}
              clientes={clientes.map(c => ({ id: c.id, nome: c.nome }))}
              servicos={servicos}
              agendamentosExistentes={agendamentos}
              onGerarAgendamentos={handleGerarAgendamentos}
              onSuccess={() => setShowActivationDialog(false)}
              onCancel={handleCancelAtivar}
            />
          )}
        </DialogContent>
      </Dialog>

      {cronogramas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cronograma cadastrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro cronograma para automatizar retornos de clientes
            </p>
            <Button onClick={() => setShowForm(true)}>
              Criar Primeiro Cronograma
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {cronogramas.map((cronograma) => (
            <Card key={cronograma.id_cronograma} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-lg truncate">{cronograma.cliente_nome}</CardTitle>
                  {getStatusBadge(cronograma.status)}
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{cronograma.tipo_servico}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground">Próximo retorno:</span>
                    <span className="font-medium">{getProximoRetorno(cronograma)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground">Duração:</span>
                    <span>{cronograma.duracao_minutos} min</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground">Recorrência:</span>
                    <span className="break-words">{getRecorrenciaText(cronograma)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground">Horário:</span>
                    <span>{cronograma.hora_inicio}</span>
                  </div>
                </div>

                {cronograma.observacoes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Obs:</span>
                    <p className="text-foreground mt-1 break-words">{cronograma.observacoes}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-3">
                  {cronograma.status === 'ativo' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAtivarCronograma(cronograma)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Ativar</span>
                      <span className="sm:hidden">Ativar</span>
                    </Button>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCronograma(cronograma);
                        setShowForm(true);
                      }}
                      className="flex-1 sm:flex-initial"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="ml-1 sm:hidden">Editar</span>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1 sm:hidden">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4 max-w-sm sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este cronograma? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(cronograma.id_cronograma)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}