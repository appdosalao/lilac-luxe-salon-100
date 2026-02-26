import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Eye } from "lucide-react";
import { DadosRelatorio } from "@/types/relatorio";
import { Lancamento } from "@/types/lancamento";
import { ContaFixa } from "@/types/contaFixa";
import { Agendamento } from "@/types/agendamento";

interface TabelaDetalhadaProps {
  dados: DadosRelatorio;
  dadosDetalhados: {
    lancamentos: Lancamento[];
    contasFixas: ContaFixa[];
    agendamentos: Agendamento[];
  };
}

export default function TabelaDetalhada({ dados, dadosDetalhados }: TabelaDetalhadaProps) {
  const [paginaLancamentos, setPaginaLancamentos] = useState(1);
  const [paginaContas, setPaginaContas] = useState(1);
  const [paginaAgendamentos, setPaginaAgendamentos] = useState(1);
  
  const itensPorPagina = 10;

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string | Date) => {
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", label: string }> = {
      'pago': { variant: 'default', label: 'Pago' },
      'em_aberto': { variant: 'destructive', label: 'Em Aberto' },
      'pendente': { variant: 'outline', label: 'Pendente' },
      'agendado': { variant: 'secondary', label: 'Agendado' },
      'concluido': { variant: 'default', label: 'Concluído' },
      'cancelado': { variant: 'destructive', label: 'Cancelado' }
    };

    const config = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportarPDF = () => {
    // Implementar exportação para PDF
    console.log('Exportando relatório para PDF...');
  };

  const exportarExcel = () => {
    // Implementar exportação para Excel
    console.log('Exportando relatório para Excel...');
  };

  // Paginação para lançamentos
  const lancamentosPaginados = dadosDetalhados.lancamentos.slice(
    (paginaLancamentos - 1) * itensPorPagina,
    paginaLancamentos * itensPorPagina
  );

  // Paginação para contas fixas
  const contasPaginadas = dadosDetalhados.contasFixas.slice(
    (paginaContas - 1) * itensPorPagina,
    paginaContas * itensPorPagina
  );

  // Paginação para agendamentos
  const agendamentosPaginados = dadosDetalhados.agendamentos.slice(
    (paginaAgendamentos - 1) * itensPorPagina,
    paginaAgendamentos * itensPorPagina
  );

  return (
    <div className="space-y-6">
      {/* Resumo das Categorias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Análise por Categorias</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportarPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportarExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Participação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.categoriasMaisLucrativas.map((categoria, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{categoria.categoria}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatarValor(categoria.entradas)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatarValor(categoria.saidas)}
                  </TableCell>
                  <TableCell className={`text-right ${categoria.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatarValor(categoria.lucro)}
                  </TableCell>
                  <TableCell className="text-right">
                    {categoria.percentual.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Serviços Mais Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Participação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.servicosMaisVendidos.map((servico, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{servico.nome}</TableCell>
                  <TableCell className="text-right">{servico.quantidade}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatarValor(servico.valorTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {servico.percentual.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dados Detalhados */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lancamentos">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lancamentos">
                Lançamentos ({dadosDetalhados.lancamentos.length})
              </TabsTrigger>
              <TabsTrigger value="agendamentos">
                Agendamentos ({dadosDetalhados.agendamentos.length})
              </TabsTrigger>
              <TabsTrigger value="contas">
                Contas Fixas ({dadosDetalhados.contasFixas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lancamentos" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentosPaginados.map((lancamento) => (
                    <TableRow key={lancamento.id}>
                      <TableCell>{formatarData(lancamento.data)}</TableCell>
                      <TableCell>{lancamento.descricao}</TableCell>
                      <TableCell>{lancamento.categoria || 'Sem categoria'}</TableCell>
                      <TableCell>
                        <Badge variant={lancamento.tipo === 'entrada' ? 'default' : 'destructive'}>
                          {lancamento.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right ${lancamento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatarValor(lancamento.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="agendamentos" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agendamentosPaginados.map((agendamento) => (
                    <TableRow key={agendamento.id}>
                      <TableCell>{formatarData(agendamento.data)}</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>{getStatusBadge(agendamento.status || 'agendado')}</TableCell>
                      <TableCell>{getStatusBadge(agendamento.statusPagamento || 'em_aberto')}</TableCell>
                      <TableCell className="text-right">
                        {formatarValor(agendamento.valor)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatarValor(agendamento.valorPago || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="contas" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasPaginadas.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.nome}</TableCell>
                      <TableCell>{conta.categoria}</TableCell>
                      <TableCell>
                        {conta.proximoVencimento ? formatarData(conta.proximoVencimento) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(conta.status)}</TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatarValor(conta.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}