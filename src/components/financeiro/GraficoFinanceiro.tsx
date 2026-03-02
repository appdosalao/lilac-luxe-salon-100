import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { Lancamento } from "@/types/lancamento";
import { useSupabaseCompras } from "@/hooks/useSupabaseCompras";
import { useSupabaseVendas } from "@/hooks/useSupabaseVendas";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GraficoFinanceiroProps {
  lancamentos: Lancamento[];
}

export default function GraficoFinanceiro({ lancamentos }: GraficoFinanceiroProps) {
  const { compras } = useSupabaseCompras();
  const { vendas } = useSupabaseVendas();
  
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const lancamentosDoMes = lancamentos.filter(l => {
    const dataLancamento = new Date(l.data);
    return dataLancamento.getMonth() === mesAtual && 
           dataLancamento.getFullYear() === anoAtual;
  });

  // Incluir compras e vendas nos totais
  const comprasDoMes = useMemo(() => {
    return compras.filter(c => {
      const dataCompra = new Date(c.data_compra);
      return dataCompra.getMonth() === mesAtual && 
             dataCompra.getFullYear() === anoAtual;
    });
  }, [compras, mesAtual, anoAtual]);

  const vendasDoMes = useMemo(() => {
    return vendas.filter(v => {
      const dataVenda = new Date(v.data_venda);
      return dataVenda.getMonth() === mesAtual && 
             dataVenda.getFullYear() === anoAtual;
    });
  }, [vendas, mesAtual, anoAtual]);

  const totalCompras = comprasDoMes.reduce((sum, c) => sum + c.valor_total, 0);
  const totalVendas = vendasDoMes.reduce((sum, v) => sum + v.valor_total, 0);

  const totalEntradas = lancamentosDoMes
    .filter(l => l.tipo === 'entrada')
    .reduce((total, l) => total + l.valor, 0) + totalVendas;

  const totalSaidas = lancamentosDoMes
    .filter(l => l.tipo === 'saida')
    .reduce((total, l) => total + l.valor, 0) + totalCompras;

  const dadosPizza = [
    { name: 'Entradas', value: totalEntradas, fill: '#22c55e' },
    { name: 'Saídas', value: totalSaidas, fill: '#ef4444' },
  ];

  // Dados para gráfico de barras por categoria (incluindo produtos)
  const categorias = lancamentosDoMes.reduce((acc, l) => {
    const categoria = l.categoria || 'Sem categoria';
    if (!acc[categoria]) {
      acc[categoria] = { entradas: 0, saidas: 0 };
    }
    if (l.tipo === 'entrada') {
      acc[categoria].entradas += l.valor;
    } else {
      acc[categoria].saidas += l.valor;
    }
    return acc;
  }, {} as Record<string, { entradas: number; saidas: number }>);

  // Adicionar vendas de produtos
  if (totalVendas > 0) {
    if (!categorias['Venda de Produtos']) {
      categorias['Venda de Produtos'] = { entradas: 0, saidas: 0 };
    }
    categorias['Venda de Produtos'].entradas += totalVendas;
  }

  // Adicionar compras de produtos
  if (totalCompras > 0) {
    if (!categorias['Compra de Produtos']) {
      categorias['Compra de Produtos'] = { entradas: 0, saidas: 0 };
    }
    categorias['Compra de Produtos'].saidas += totalCompras;
  }

  const dadosBarras = Object.entries(categorias).map(([categoria, dados]) => ({
    categoria,
    entradas: dados.entradas,
    saidas: dados.saidas,
  }));

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const temDados = totalEntradas > 0 || totalSaidas > 0;

  // Top produtos (por valor) no mês
  const [produtoNomes, setProdutoNomes] = useState<Record<string, string>>({});
  const itensMes = useMemo(() => {
    return vendasDoMes.flatMap(v => v.itens_venda || []);
  }, [vendasDoMes]);
  const agregadosProdutos = useMemo(() => {
    const agg: Record<string, { id: string; quantidade: number; valor: number }> = {};
    itensMes.forEach((i) => {
      const id = i.produto_id;
      if (!agg[id]) agg[id] = { id, quantidade: 0, valor: 0 };
      agg[id].quantidade += Number(i.quantidade || 0);
      agg[id].valor += Number(i.valor_total || 0);
    });
    return Object.values(agg).sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [itensMes]);
  useEffect(() => {
    const carregarNomes = async () => {
      const ids = agregadosProdutos.map(a => a.id);
      if (ids.length === 0) return;
      const { data } = await supabase
        .from('produtos')
        .select('id,nome')
        .in('id', ids);
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => { map[p.id] = p.nome; });
      setProdutoNomes(map);
    };
    carregarNomes();
  }, [agregadosProdutos]);
  const dadosTopProdutos = agregadosProdutos.map(a => ({
    produto: produtoNomes[a.id] || a.id.slice(0, 6),
    quantidade: a.quantidade,
    valor: a.valor,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfico de Pizza */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Entradas vs Saídas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!temDados ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-3 animate-fade-in">
              <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-base font-medium text-foreground">Sem dados para exibir</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione lançamentos para visualizar o gráfico
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatarValor(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={800}
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatarValor(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Barras por Categoria */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dadosBarras.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-3 animate-fade-in">
              <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-base font-medium text-foreground">Sem categorias para exibir</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Organize seus lançamentos em categorias
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosBarras}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="categoria" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatarValor(Number(value))} />
                <Legend />
                <Bar dataKey="entradas" fill="#22c55e" name="Entradas" animationDuration={800} />
                <Bar dataKey="saidas" fill="#ef4444" name="Saídas" animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Produtos (Valor) */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Produtos (mês)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dadosTopProdutos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-3 animate-fade-in">
              <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-base font-medium text-foreground">Sem vendas de produtos neste mês</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosTopProdutos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="produto" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value, name) => name === 'valor' ? formatarValor(Number(value)) : value} />
                <Legend />
                <Bar dataKey="valor" fill="#7c3aed" name="Valor" animationDuration={800} />
                <Bar dataKey="quantidade" fill="#06b6d4" name="Quantidade" animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
