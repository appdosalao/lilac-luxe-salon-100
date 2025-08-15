import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRetornos } from '@/hooks/useCronogramas';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Calendar } from 'lucide-react';

export default function ResolverRetornos() {
  const { retornos, marcarRetornoRealizado, cancelarRetorno } = useRetornos();
  const { clientes } = useAgendamentos();
  const { toast } = useToast();

  const retornosAtrasados = retornos.filter(retorno => {
    if (retorno.status !== 'Pendente') return false;
    const dataRetorno = new Date(retorno.data_retorno);
    const hoje = new Date();
    return dataRetorno < hoje;
  });

  const calcularDiasAtraso = (dataRetorno: string) => {
    const data = new Date(dataRetorno);
    const hoje = new Date();
    return Math.floor((hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleMarcarRealizado = async (idRetorno: string) => {
    try {
      await marcarRetornoRealizado(idRetorno);
      toast({
        title: "Retorno marcado como realizado",
        description: "O retorno foi atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao marcar retorno",
        description: "Não foi possível atualizar o retorno.",
        variant: "destructive"
      });
    }
  };

  const handleCancelar = async (idRetorno: string) => {
    try {
      await cancelarRetorno(idRetorno);
      toast({
        title: "Retorno cancelado",
        description: "O retorno foi cancelado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao cancelar retorno",
        description: "Não foi possível cancelar o retorno.",
        variant: "destructive"
      });
    }
  };

  const getClienteNome = (idCliente: string) => {
    const cliente = clientes.find(c => c.id === idCliente);
    return cliente?.nomeCompleto || 'Cliente não encontrado';
  };

  if (retornosAtrasados.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Retornos em Dia
          </CardTitle>
          <CardDescription>
            Não há retornos atrasados no sistema.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold">Resolver Retornos Atrasados</h3>
        <Badge variant="secondary">{retornosAtrasados.length} pendentes</Badge>
      </div>

      {retornosAtrasados.map((retorno) => (
        <Card key={retorno.id_retorno}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {getClienteNome(retorno.id_cliente)}
                </CardTitle>
                <CardDescription>
                  Data prevista: {new Date(retorno.data_retorno).toLocaleDateString('pt-BR')}
                  <Badge variant="destructive" className="ml-2">
                    {calcularDiasAtraso(retorno.data_retorno)} dias de atraso
                  </Badge>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarcarRealizado(retorno.id_retorno)}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Marcar como Realizado
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelar(retorno.id_retorno)}
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}