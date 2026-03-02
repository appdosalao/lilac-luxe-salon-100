import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, TrendingUp, TrendingDown, DollarSign, FileText } from "lucide-react";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useContasFixas } from "@/hooks/useContasFixas";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useRelatoriosFinanceiros } from "@/hooks/useRelatoriosFinanceiros";
import FiltrosRelatorio from "./FiltrosRelatorio";
import GraficosAvancados from "./GraficosAvancados";
import TabelaDetalhada from "./TabelaDetalhada";
import { exportRelatorioJSON, exportRelatorioCSV, exportRelatorioPDF, exportVendasPorProdutoCSV, exportVendasPorProdutoPDF, exportDespesasUsoCSV, exportDespesasUsoPDF } from "@/lib/export";
import type { RelatorioExportacao } from "@/types/relatorio";
import { supabase } from "@/integrations/supabase/client";
import { useConfigAgendamentoOnline } from "@/hooks/useConfigAgendamentoOnline";
import { useEffect, useState } from "react";

export default function RelatoriosAvancados() {
  const { lancamentos } = useLancamentos();
  const { contasFixas } = useContasFixas();
  const { agendamentos } = useAgendamentos();
  
  const {
    filtros,
    setFiltros,
    dadosRelatorio,
    intervaloData,
    dadosFiltrados
  } = useRelatoriosFinanceiros(lancamentos, contasFixas, agendamentos);

  const { config: configOnline } = useConfigAgendamentoOnline();
  const brand = { salonName: configOnline?.nome_salao, logoUrl: configOnline?.logo_url || undefined };
  const [usoTotals, setUsoTotals] = useState<{ prof: number; pessoal: number }>({ prof: 0, pessoal: 0 });
  useEffect(() => {
    const loadUsoTotals = async () => {
      const inicioISO = new Date(intervaloData.inicio.getTime()).toISOString().slice(0, 10);
      const fimISO = new Date(intervaloData.fim.getTime()).toISOString().slice(0, 10);
      const { data } = await supabase
        .from('lancamentos')
        .select('categoria, valor')
        .gte('data', inicioISO)
        .lte('data', fimISO)
        .in('categoria', ['Uso Profissional', 'Uso Pessoal']);
      const prof = (data || []).filter((l: any) => l.categoria === 'Uso Profissional').reduce((s, l: any) => s + Number(l.valor || 0), 0);
      const pessoal = (data || []).filter((l: any) => l.categoria === 'Uso Pessoal').reduce((s, l: any) => s + Number(l.valor || 0), 0);
      setUsoTotals({ prof, pessoal });
    };
    loadUsoTotals();
  }, [intervaloData]);

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPeriodo = () => {
    const inicio = format(intervaloData.inicio, 'dd/MM/yyyy', { locale: ptBR });
    const fim = format(intervaloData.fim, 'dd/MM/yyyy', { locale: ptBR });
    return `${inicio} a ${fim}`;
  };

  const exportarRelatorioCompleto = () => {
    const relatorio: RelatorioExportacao = {
      titulo: "Relatório Financeiro",
      periodo: formatarPeriodo(),
      dadosResumo: dadosRelatorio,
      dadosDetalhados: {
        lancamentos: dadosFiltrados.lancamentos,
        contasFixas: dadosFiltrados.contasFixas,
        agendamentos: dadosFiltrados.agendamentos,
      },
      geradoEm: new Date(),
    };
    exportRelatorioJSON(relatorio);
    exportRelatorioCSV(relatorio);
    exportRelatorioPDF(relatorio, brand);
  };

  const exportarVendasPorProduto = async () => {
    const inicioISO = new Date(intervaloData.inicio.getTime()).toISOString().slice(0, 10);
    const fimISO = new Date(intervaloData.fim.getTime()).toISOString().slice(0, 10);
    const { data: vendas } = await supabase
      .from('vendas_produtos')
      .select('id, valor_total, data_venda')
      .gte('data_venda', inicioISO)
      .lte('data_venda', fimISO);
    const ids = (vendas || []).map(v => v.id);
    let itens: any[] = [];
    if (ids.length > 0) {
      const { data: itensData } = await supabase
        .from('itens_venda')
        .select('venda_id, produto_id, quantidade, valor_total')
        .in('venda_id', ids);
      itens = itensData || [];
    }
    const produtoIds = [...new Set(itens.map(i => i.produto_id))];
    let produtos: any[] = [];
    if (produtoIds.length > 0) {
      const { data: prods } = await supabase
        .from('produtos')
        .select('id,nome')
        .in('id', produtoIds);
      produtos = prods || [];
    }
    const nomeMap: Record<string, string> = {};
    produtos.forEach(p => { nomeMap[p.id] = p.nome; });
    const agregados: Record<string, { produto: string; quantidade: number; valor_total: number }> = {};
    itens.forEach(i => {
      const nome = nomeMap[i.produto_id] || 'Produto';
      if (!agregados[i.produto_id]) {
        agregados[i.produto_id] = { produto: nome, quantidade: 0, valor_total: 0 };
      }
      agregados[i.produto_id].quantidade += Number(i.quantidade || 0);
      agregados[i.produto_id].valor_total += Number(i.valor_total || 0);
    });
    const rows = Object.values(agregados).sort((a, b) => b.valor_total - a.valor_total);
    exportVendasPorProdutoCSV(rows, `vendas-por-produto-${formatarPeriodo().replace(/\s+/g,'_')}.csv`);
    exportVendasPorProdutoPDF(rows, formatarPeriodo(), brand);
  };

  const exportarDespesasDeUso = async () => {
    const inicioISO = new Date(intervaloData.inicio.getTime()).toISOString().slice(0, 10);
    const fimISO = new Date(intervaloData.fim.getTime()).toISOString().slice(0, 10);
    const { data } = await supabase
      .from('lancamentos')
      .select('data, categoria, valor, descricao')
      .gte('data', inicioISO)
      .lte('data', fimISO)
      .in('categoria', ['Uso Profissional', 'Uso Pessoal']);
    const rows = (data || []).map((l: any) => ({
      data: new Date(l.data).toLocaleDateString('pt-BR'),
      categoria: l.categoria,
      valor: Number(l.valor),
      descricao: l.descricao
    }));
    exportDespesasUsoCSV(rows, `despesas-uso-${formatarPeriodo().replace(/\s+/g, '_')}.csv`);
    exportDespesasUsoPDF(rows, formatarPeriodo(), brand);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h2>
          <p className="text-muted-foreground">
            Análise detalhada do período: {formatarPeriodo()}
          </p>
        </div>
        <Button onClick={exportarRelatorioCompleto} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório Completo
        </Button>
        <Button onClick={exportarVendasPorProduto} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Vendas por Produto
        </Button>
        <Button onClick={exportarDespesasDeUso} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Despesas de Uso
        </Button>
      </div>

      {/* Cards de Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success">
              <TrendingUp className="h-6 w-6 text-success-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-success">
                {formatarValor(dadosRelatorio.totalEntradas)}
              </p>
              <p className="text-sm text-muted-foreground">Total de Entradas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive">
              <TrendingDown className="h-6 w-6 text-destructive-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-destructive">
                {formatarValor(dadosRelatorio.totalSaidas)}
              </p>
              <p className="text-sm text-muted-foreground">Total de Saídas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              dadosRelatorio.lucroLiquido >= 0 
                ? 'bg-info' 
                : 'bg-destructive'
            }`}>
              <DollarSign className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-2xl font-bold ${
                dadosRelatorio.lucroLiquido >= 0 ? 'text-info' : 'text-destructive'
              }`}>
                {formatarValor(dadosRelatorio.lucroLiquido)}
              </p>
              <p className="text-sm text-muted-foreground">
                {dadosRelatorio.lucroLiquido >= 0 ? 'Lucro Líquido' : 'Prejuízo'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning">
              <FileText className="h-6 w-6 text-warning-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-warning">
                {formatarValor(dadosRelatorio.contasAPagar)}
              </p>
              <p className="text-sm text-muted-foreground">Contas a Pagar</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-primary">
                {formatarValor(usoTotals.prof)}
              </p>
              <p className="text-sm text-muted-foreground">Uso Profissional</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <FileText className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-secondary">
                {formatarValor(usoTotals.pessoal)}
              </p>
              <p className="text-sm text-muted-foreground">Uso Pessoal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Indicadores de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">
                {dadosRelatorio.lucroLiquido > 0 
                  ? ((dadosRelatorio.lucroLiquido / dadosRelatorio.totalEntradas) * 100).toFixed(1)
                  : '0.0'
                }%
              </div>
              <div className="text-sm text-muted-foreground">Margem de Lucro</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">
                {dadosRelatorio.servicosMaisVendidos.length}
              </div>
              <div className="text-sm text-muted-foreground">Serviços Ativos</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">
                {formatarValor(dadosRelatorio.agendamentosAbertos)}
              </div>
              <div className="text-sm text-muted-foreground">Pendente Recebimento</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">
                {dadosRelatorio.categoriasMaisLucrativas.length}
              </div>
              <div className="text-sm text-muted-foreground">Categorias Ativas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas dos Relatórios */}
      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="detalhado">Dados Detalhados</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <FiltrosRelatorio 
                filtros={filtros} 
                onFiltrosChange={setFiltros}
              />
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              {/* Resumo das Categorias */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Categorias Mais Lucrativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dadosRelatorio.categoriasMaisLucrativas.slice(0, 5).map((categoria, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                          <span className="font-medium">{categoria.categoria}</span>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${categoria.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatarValor(categoria.lucro)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {categoria.percentual.toFixed(1)}% do total
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resumo dos Serviços */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Serviços Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dadosRelatorio.servicosMaisVendidos.slice(0, 5).map((servico, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{servico.quantidade}x</Badge>
                          <span className="font-medium">{servico.nome}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-success">
                            {formatarValor(servico.valorTotal)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {servico.percentual.toFixed(1)}% do faturamento
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="graficos">
          <GraficosAvancados dados={dadosRelatorio} />
        </TabsContent>

        <TabsContent value="detalhado">
          <TabelaDetalhada 
            dados={dadosRelatorio} 
            dadosDetalhados={dadosFiltrados}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
