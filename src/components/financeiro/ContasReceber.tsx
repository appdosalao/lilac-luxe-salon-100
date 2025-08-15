import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { MessageCircle, Search, DollarSign } from 'lucide-react';
import { Agendamento } from '@/types/agendamento';

interface ContasReceberProps {
  agendamentos: Agendamento[];
}

export default function ContasReceber({ agendamentos }: ContasReceberProps) {
  const [busca, setBusca] = useState('');

  // Filtrar agendamentos com saldo devedor
  const contasReceber = agendamentos.filter(agendamento => 
    (agendamento.statusPagamento === 'em_aberto' || agendamento.statusPagamento === 'parcial') &&
    agendamento.valorDevido > 0
  ).filter(agendamento =>
    agendamento.clienteNome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalReceber = contasReceber.reduce((total, agendamento) => total + agendamento.valorDevido, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const enviarCobrancaWhatsApp = (agendamento: Agendamento) => {
    const mensagem = `Olá ${agendamento.clienteNome}! 
    
Você tem um saldo pendente de ${formatCurrency(agendamento.valorDevido)} referente ao serviço de ${agendamento.servicoNome} realizado em ${formatDate(agendamento.data)}.

Para facilitar o pagamento, entre em contato conosco.

Obrigado!`;

    const telefone = ''; // Você pode pegar do cadastro do cliente
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Estatística */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total a Receber</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalReceber)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas a Receber */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Valor Devedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasReceber.map((agendamento) => (
                  <TableRow key={agendamento.id}>
                    <TableCell className="font-medium">{agendamento.clienteNome}</TableCell>
                    <TableCell>{agendamento.servicoNome}</TableCell>
                    <TableCell>{formatDate(agendamento.data)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(agendamento.valor)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(agendamento.valorPago)}</TableCell>
                    <TableCell className="font-mono font-bold text-orange-600">
                      {formatCurrency(agendamento.valorDevido)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          agendamento.statusPagamento === 'em_aberto' 
                            ? 'border-red-500 text-red-700' 
                            : 'border-orange-500 text-orange-700'
                        }
                      >
                        {agendamento.statusPagamento === 'em_aberto' ? 'Em Aberto' : 'Parcial'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enviarCobrancaWhatsApp(agendamento)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {contasReceber.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {busca ? 'Nenhum cliente encontrado' : 'Nenhuma conta a receber no momento'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}