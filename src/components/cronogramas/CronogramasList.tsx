import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit, Trash2, Play, Pause, CheckCircle } from "lucide-react";
import { useCronogramas } from "@/hooks/useCronogramas";
import { useDatabase } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import CronogramaForm from "./CronogramaForm";
import CronogramaComAgendamentos from "./CronogramaComAgendamentos";

export default function CronogramasList() {
  const [editingCronograma, setEditingCronograma] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [activatingCronograma, setActivatingCronograma] = useState<any>(null);
  const [showActivationDialog, setShowActivationDialog] = useState(false);

  const { cronogramas, loading, deleteCronograma } = useCronogramas();
  const { clientes, servicos, agendamentos, createMultipleAgendamentos } = useDatabase();
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
      await createMultipleAgendamentos(agendamentos);
      setShowActivationDialog(false);
      setActivatingCronograma(null);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lista de Cronogramas</h2>
          <p className="text-muted-foreground">
            Gerencie cronogramas de retorno dos seus clientes
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCronograma(null)}>
              Novo Cronograma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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
              clientes={clientes.map(c => ({ id: c.id, nome: c.nomeCompleto }))}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cronogramas.map((cronograma) => (
            <Card key={cronograma.id_cronograma} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{cronograma.cliente_nome}</CardTitle>
                  {getStatusBadge(cronograma.status)}
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {cronograma.tipo_servico}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próximo retorno:</span>
                    <span className="font-medium">{getProximoRetorno(cronograma)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração:</span>
                    <span>{cronograma.duracao_minutos} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recorrência:</span>
                    <span>{getRecorrenciaText(cronograma)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário:</span>
                    <span>{cronograma.hora_inicio}</span>
                  </div>
                </div>

                {cronograma.observacoes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Obs:</span>
                    <p className="text-foreground mt-1">{cronograma.observacoes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  {cronograma.status === 'ativo' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAtivarCronograma(cronograma)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Ativar
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCronograma(cronograma);
                      setShowForm(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este cronograma? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(cronograma.id_cronograma)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}