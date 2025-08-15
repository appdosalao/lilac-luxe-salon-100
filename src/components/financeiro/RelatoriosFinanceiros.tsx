import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar } from 'lucide-react';
import { Lancamento } from '@/types/lancamento';
import { ContaFixa } from '@/types/contaFixa';
import { Agendamento } from '@/types/agendamento';

interface RelatoriosFinanceirosProps {
  lancamentos: Lancamento[];
  contasFixas: ContaFixa[];
  agendamentos: Agendamento[];
}

export default function RelatoriosFinanceiros({ 
  lancamentos, 
  contasFixas, 
  agendamentos 
}: RelatoriosFinanceirosProps) {
  
  const calcularEstatisticasMensais = () => {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    // Lançamentos do mês
    const lancamentosDoMes = lancamentos.filter(l => {
      const dataLancamento = new Date(l.data);
      return dataLancamento.getMonth() === mesAtual && 
             dataLancamento.getFullYear() === anoAtual;
    });

    const receitas = lancamentosDoMes
      .filter(l => l.tipo === 'entrada')
      .reduce((total, l) => total + l.valor, 0);

    const despesas = lancamentosDoMes
      .filter(l => l.tipo === 'saida')
      .reduce((total, l) => total + l.valor, 0);

    // Contas fixas pagas no mês
    const contasFixasPagas = contasFixas
      .filter(c => c.status === 'pago')
      .reduce((total, c) => total + c.valor, 0);

    // Valor em aberto (agendamentos fiados/parciais)
    const valorEmAberto = agendamentos
      .filter(a => a.statusPagamento === 'em_aberto' || a.statusPagamento === 'parcial')
      .reduce((total, a) => total + (a.valorDevido || 0), 0);

    return {
      receitas,
      despesas: despesas + contasFixasPagas,
      lucro: receitas - (despesas + contasFixasPagas),
      valorEmAberto,
      totalTransacoes: lancamentosDoMes.length,
    };
  };

  const calcularEstatisticasServicos = () => {
    const servicosContador = agendamentos
      .filter(a => a.status === 'concluido')
      .reduce((acc, agendamento) => {
        if (!acc[agendamento.servicoNome]) {
          acc[agendamento.servicoNome] = { quantidade: 0, valor: 0 };
        }
        acc[agendamento.servicoNome].quantidade++;
        acc[agendamento.servicoNome].valor += agendamento.valorPago;
        return acc;
      }, {} as Record<string, { quantidade: number; valor: number }>);

    return Object.entries(servicosContador)
      .map(([nome, dados]) => ({ nome, ...dados }))
      .sort((a, b) => b.quantidade - a.quantidade);
  };

  const exportarPDF = () => {
    // Simular exportação PDF
    const dadosRelatorio = {
      ...calcularEstatisticasMensais(),
      servicosMaisVendidos: calcularEstatisticasServicos(),
      dataGeracao: new Date().toLocaleString('pt-BR'),
    };

    console.log('Dados do relatório para PDF:', dadosRelatorio);
    
    // Aqui você implementaria a exportação PDF real
    alert('Funcionalidade de exportação PDF em desenvolvimento');
  };

  const exportarExcel = () => {
    // Simular exportação Excel
    const dadosRelatorio = calcularEstatisticasMensais();
    
    console.log('Dados do relatório para Excel:', dadosRelatorio);
    
    // Aqui você implementaria a exportação Excel real
    alert('Funcionalidade de exportação Excel em desenvolvimento');
  };

  const estatisticas = calcularEstatisticasMensais();
  const servicosMaisVendidos = calcularEstatisticasServicos();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Relatório Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Receitas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(estatisticas.receitas)}</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Despesas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(estatisticas.despesas)}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Lucro</p>
              <p className={`text-2xl font-bold ${estatisticas.lucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(estatisticas.lucro)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Em Aberto</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(estatisticas.valorEmAberto)}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={exportarPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={exportarExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Serviços Mais Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {servicosMaisVendidos.slice(0, 5).map((servico, index) => (
              <div key={servico.nome} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{servico.nome}</p>
                    <p className="text-sm text-muted-foreground">{servico.quantidade} agendamentos</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">{formatCurrency(servico.valor)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumo de Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{estatisticas.totalTransacoes}</p>
            <p className="text-muted-foreground">Transações este mês</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}