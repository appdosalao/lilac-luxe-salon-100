import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { Lancamento } from "@/types/lancamento";
import { useSupabaseCompras } from "@/hooks/useSupabaseCompras";
import { useSupabaseVendas } from "@/hooks/useSupabaseVendas";
import { useMemo } from "react";

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
    </div>
  );
}