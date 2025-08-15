import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Calendar, Clock, User, Filter } from "lucide-react";
import { useRetornos } from "@/hooks/useCronogramas";
import { useToast } from "@/hooks/use-toast";

// Mock data para clientes - será substituído pela integração Supabase
const mockClientes = [
  { id_cliente: '1', nome_completo: 'Maria Silva' },
  { id_cliente: '2', nome_completo: 'Ana Santos' },
];

// Mock data para cronogramas - será substituído pela integração Supabase
const mockCronogramasData = [
  { id_cronograma: '1', nome: 'Hidratação Quinzenal' },
  { id_cronograma: '2', nome: 'Cauterização Mensal' },
];

export default function RetornosList() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  
  const { retornos, marcarRetornoRealizado, cancelarRetorno, loading } = useRetornos();
  const { toast } = useToast();

  const getClienteNome = (idCliente: string) => {
    return mockClientes.find(c => c.id_cliente === idCliente)?.nome_completo || 'Cliente não encontrado';
  };

  const getCronogramaNome = (idCronograma: string) => {
    return mockCronogramasData.find(c => c.id_cronograma === idCronograma)?.nome || 'Cronograma não encontrado';
  };

  const handleMarcarRealizado = async (idRetorno: string) => {
    try {
      await marcarRetornoRealizado(idRetorno);
      toast({
        title: "Retorno marcado como realizado",
        description: "O próximo retorno será automaticamente agendado.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao marcar o retorno como realizado.",
        variant: "destructive",
      });
    }
  };

  const handleCancelarRetorno = async (idRetorno: string) => {
    try {
      await cancelarRetorno(idRetorno);
      toast({
        title: "Retorno cancelado",
        description: "O retorno foi cancelado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao cancelar o retorno.",
        variant: "destructive",
      });
    }
  };

  const filteredRetornos = retornos.filter(retorno => {
    const statusMatch = statusFilter === 'all' || retorno.status === statusFilter;
    const clienteMatch = clienteFilter === 'all' || retorno.id_cliente === clienteFilter;
    return statusMatch && clienteMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendente':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'Realizado':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Realizado</Badge>;
      case 'Cancelado':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Retornos dos Clientes</h2>
          <p className="text-muted-foreground">
            Acompanhe e gerencie os retornos programados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Realizado">Realizado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {mockClientes.map(cliente => (
                    <SelectItem key={cliente.id_cliente} value={cliente.id_cliente}>
                      {cliente.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Retornos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Retornos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRetornos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum retorno encontrado</h3>
              <p className="text-muted-foreground text-center">
                Não há retornos que correspondam aos filtros selecionados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cronograma</TableHead>
                  <TableHead>Data do Retorno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRetornos.map((retorno) => (
                  <TableRow key={retorno.id_retorno}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {getClienteNome(retorno.id_cliente)}
                      </div>
                    </TableCell>
                    <TableCell>{getCronogramaNome(retorno.id_cronograma)}</TableCell>
                    <TableCell>
                      {format(new Date(retorno.data_retorno), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getStatusBadge(retorno.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {retorno.status === 'Pendente' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleMarcarRealizado(retorno.id_retorno)}
                              disabled={loading}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Realizado
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelarRetorno(retorno.id_retorno)}
                              disabled={loading}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}