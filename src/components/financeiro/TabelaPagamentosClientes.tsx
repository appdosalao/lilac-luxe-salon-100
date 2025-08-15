import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  MessageCircle, 
  Calendar,
  User,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Agendamento } from "@/types/agendamento";
import { toast } from "@/hooks/use-toast";

interface TabelaPagamentosClientesProps {
  agendamentos: Agendamento[];
}

export default function TabelaPagamentosClientes({ agendamentos }: TabelaPagamentosClientesProps) {
  const [busca, setBusca] = useState("");

  // Filtrar apenas agendamentos que tenham valores pendentes ou concluídos
  const agendamentosComPagamento = agendamentos.filter(agendamento => 
    (agendamento.status === 'concluido' || agendamento.valorPago > 0) &&
    agendamento.clienteNome.toLowerCase().includes(busca.toLowerCase())
  );

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handleEnviarCobranca = (agendamento: Agendamento) => {
    const telefone = ""; // TODO: Pegar telefone do cliente
    const mensagem = `Olá ${agendamento.clienteNome}! 

Você tem um saldo devedor de ${formatarValor(agendamento.valorDevido || 0)} referente ao serviço ${agendamento.servicoNome} realizado em ${format(new Date(agendamento.data), "dd/MM/yyyy", { locale: ptBR })}.

${agendamento.dataPrevistaPagamento ? `Data prevista para pagamento: ${format(new Date(agendamento.dataPrevistaPagamento), "dd/MM/yyyy", { locale: ptBR })}` : ''}

Por favor, entre em contato para acertarmos o pagamento. Obrigado!`;

    const whatsappUrl = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp aberto",
      description: "Mensagem de cobrança preparada no WhatsApp.",
    });
  };

  const getStatusBadge = (agendamento: Agendamento) => {
    if (agendamento.statusPagamento === 'pago') {
      return <Badge variant="default" className="bg-green-500">Pago</Badge>;
    } else if (agendamento.statusPagamento === 'parcial') {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Parcial</Badge>;
    } else {
      return <Badge variant="destructive">Em Aberto</Badge>;
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Pagamentos dos Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Busca */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabela */}
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Saldo Devedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendamentosComPagamento.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum pagamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                agendamentosComPagamento.map((agendamento) => (
                  <TableRow key={agendamento.id}>
                    <TableCell className="font-medium">
                      {agendamento.clienteNome}
                    </TableCell>
                    <TableCell>{agendamento.servicoNome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(agendamento.data), "dd/MM/yy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatarValor(agendamento.valor)}
                    </TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      {formatarValor(agendamento.valorPago)}
                    </TableCell>
                    <TableCell className={`font-semibold ${
                      (agendamento.valorDevido || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatarValor(agendamento.valorDevido || 0)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(agendamento)}
                    </TableCell>
                    <TableCell>
                      {agendamento.dataPrevistaPagamento ? (
                        <div className="flex items-center gap-1 text-sm">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          {format(new Date(agendamento.dataPrevistaPagamento), "dd/MM/yy", { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(agendamento.valorDevido || 0) > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEnviarCobranca(agendamento)}
                          className="flex items-center gap-1"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Cobrar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Resumo */}
        {agendamentosComPagamento.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold text-primary">
                  {new Set(agendamentosComPagamento.map(a => a.clienteId)).size}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatarValor(agendamentosComPagamento.reduce((total, a) => total + a.valorPago, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Total Devedor</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatarValor(agendamentosComPagamento.reduce((total, a) => total + (a.valorDevido || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}