import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit, Trash2, Play, Pause, CheckCircle } from "lucide-react";
import { useCronogramas } from "@/hooks/useCronogramas";
import { useSupabaseClientes } from "@/hooks/useSupabaseClientes";
import { useServicos } from "@/hooks/useServicos";
import { toast } from "sonner";
import CronogramaForm from "./CronogramaForm";

export default function CronogramasList() {
  const [editingCronograma, setEditingCronograma] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const { cronogramas, loading, deleteCronograma, createMultipleAgendamentos } = useCronogramas();
  const { clientes } = useSupabaseClientes();
  const { todosServicos: servicos } = useServicos();

  const handleDelete = async (id: string) => {
    try {
      await deleteCronograma(id);
      toast.success('Cronograma removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover cronograma.');
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

  const getStatusBadge = (ativo: boolean) => {
    if (ativo) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
    }
    return <Badge variant="secondary"><Pause className="w-3 h-3 mr-1" />Inativo</Badge>;
  };

  const getRecorrenciaText = (recorrencia: string) => {
    switch (recorrencia) {
      case 'semanal':
        return 'Semanal';
      case 'quinzenal':
        return 'Quinzenal';
      case 'mensal':
        return 'Mensal';
      default:
        return recorrencia;
    }
  };

  const getDiaSemanaText = (diaSemana: number) => {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[diaSemana] || 'Não definido';
  };

  const getProximoRetorno = (cronograma: any) => {
    const dataInicio = new Date(cronograma.dataInicio);
    const hoje = new Date();
    
    let intervalo = 7; // padrão semanal
    if (cronograma.recorrencia === 'quinzenal') intervalo = 14;
    else if (cronograma.recorrencia === 'mensal') intervalo = 30;

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
          {cronogramas.map((cronograma) => {
            const cliente = clientes.find(c => c.id === cronograma.clienteId);
            const servico = servicos.find(s => s.id === cronograma.servicoId);
            
            return (
              <Card key={cronograma.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cronograma.titulo}</CardTitle>
                    {getStatusBadge(cronograma.ativo)}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {cliente?.nome || 'Cliente não encontrado'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serviço:</span>
                      <span className="font-medium">{servico?.nome || 'Serviço não encontrado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Próximo retorno:</span>
                      <span className="font-medium">{getProximoRetorno(cronograma)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dia da semana:</span>
                      <span>{getDiaSemanaText(cronograma.diaSemana)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recorrência:</span>
                      <span>{getRecorrenciaText(cronograma.recorrencia)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horário:</span>
                      <span>{cronograma.horaInicio} - {cronograma.horaFim}</span>
                    </div>
                  </div>

                  {cronograma.observacoes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Obs:</span>
                      <p className="text-foreground mt-1">{cronograma.observacoes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3">
                    {cronograma.ativo && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => createMultipleAgendamentos(cronograma.id)}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Gerar Agendamentos
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
                            onClick={() => handleDelete(cronograma.id)}
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
            );
          })}
        </div>
      )}
    </div>
  );
}