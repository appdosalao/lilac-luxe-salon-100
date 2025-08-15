import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, TrendingUp } from "lucide-react";
import { Cliente, ClienteFormData } from "@/types/cliente";
import { useClientes } from "@/hooks/useClientes";
import ClienteForm from "@/components/clientes/ClienteForm";
import ClientesList from "@/components/clientes/ClientesList";
import ClienteDetalhes from "@/components/clientes/ClienteDetalhes";

export default function Clientes() {
  const { clientes, criarCliente, atualizarCliente, excluirCliente, loading } = useClientes();
  const [clienteSelecionada, setClienteSelecionada] = useState<Cliente | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);

  const handleAddCliente = async (data: ClienteFormData) => {
    await criarCliente(data);
  };

  const handleEditCliente = async (clienteAtualizada: Cliente) => {
    await atualizarCliente(clienteAtualizada.id, clienteAtualizada);
    if (clienteSelecionada?.id === clienteAtualizada.id) {
      setClienteSelecionada(clienteAtualizada);
    }
  };

  const handleDeleteCliente = async (id: string) => {
    await excluirCliente(id);
    if (clienteSelecionada?.id === id) {
      setClienteSelecionada(null);
      setDetalhesOpen(false);
    }
  };

  const handleViewDetails = (cliente: Cliente) => {
    setClienteSelecionada(cliente);
    setDetalhesOpen(true);
  };

  const clientesAtivas = clientes.length;
  const novasEsteMes = clientes.filter(cliente => {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const ultimaVisita = typeof cliente.ultimaVisita === 'string' 
      ? new Date(cliente.ultimaVisita) 
      : cliente.ultimaVisita;
    return ultimaVisita >= inicioMes;
  }).length;

  const totalServicos = clientes.reduce((total, cliente) => 
    total + (cliente.historicoServicos?.length || 0), 0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro e histórico das suas clientes
          </p>
        </div>
        <ClienteForm onSubmit={handleAddCliente} />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-lilac-light">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clientesAtivas}</p>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-lilac-primary to-pink-accent">
              <UserPlus className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{novasEsteMes}</p>
              <p className="text-sm text-muted-foreground">Visitas Este Mês</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-accent to-lavender">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalServicos}</p>
              <p className="text-sm text-muted-foreground">Total de Serviços</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clientes */}
      <ClientesList
        clientes={clientes}
        onEdit={handleEditCliente}
        onDelete={handleDeleteCliente}
        onViewDetails={handleViewDetails}
      />

      {/* Modal de Detalhes */}
      <ClienteDetalhes
        cliente={clienteSelecionada}
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        onEdit={handleEditCliente}
      />
    </div>
  );
}