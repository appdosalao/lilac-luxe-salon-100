import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { Lancamento } from "@/types/lancamento";

interface GraficoFinanceiroProps {
  lancamentos: Lancamento[];
}

export default function GraficoFinanceiro({ lancamentos }: GraficoFinanceiroProps) {
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const lancamentosDoMes = lancamentos.filter(l => {
    const dataLancamento = new Date(l.data);
    return dataLancamento.getMonth() === mesAtual && 
           dataLancamento.getFullYear() === anoAtual;
  });

  const totalEntradas = lancamentosDoMes
    .filter(l => l.tipo === 'entrada')
    .reduce((total, l) => total + l.valor, 0);

  const totalSaidas = lancamentosDoMes
    .filter(l => l.tipo === 'saida')
    .reduce((total, l) => total + l.valor, 0);

  const dadosPizza = [
    { name: 'Entradas', value: totalEntradas, fill: '#22c55e' },
    { name: 'Saídas', value: totalSaidas, fill: '#ef4444' },
  ];

  // Dados para gráfico de barras por categoria
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfico de Pizza */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Entradas vs Saídas
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              >
                {dadosPizza.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatarValor(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras por Categoria */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              <Bar dataKey="entradas" fill="#22c55e" name="Entradas" />
              <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}