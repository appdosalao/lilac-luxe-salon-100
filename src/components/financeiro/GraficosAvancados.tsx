import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DadosRelatorio } from "@/types/relatorio";

interface GraficosAvancadosProps {
  dados: DadosRelatorio;
}

const CORES = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#ff0000', '#00ffff', '#ff00ff', '#ffff00', '#000080'
];

export default function GraficosAvancados({ dados }: GraficosAvancadosProps) {
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Dados para o gráfico de resumo
  const dadosResumo = [
    {
      categoria: 'Entradas',
      valor: dados.totalEntradas,
      cor: '#10b981'
    },
    {
      categoria: 'Saídas',
      valor: dados.totalSaidas,
      cor: '#ef4444'
    },
    {
      categoria: 'Lucro',
      valor: dados.lucroLiquido,
      cor: dados.lucroLiquido >= 0 ? '#3b82f6' : '#ef4444'
    }
  ];

  // Dados para gráfico de pizza de categorias
  const dadosPizzaCategorias = dados.categoriasMaisLucrativas.slice(0, 5).map((cat, index) => ({
    name: cat.categoria,
    value: Math.abs(cat.lucro),
    lucro: cat.lucro,
    percentual: cat.percentual
  }));

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro - Gráfico de Barras */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosResumo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis tickFormatter={formatarValor} />
              <Tooltip formatter={(value) => formatarValor(Number(value))} />
              <Legend />
              <Bar dataKey="valor" fill="#8884d8">
                {dadosResumo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução dos Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dados.evolucaoMensal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis tickFormatter={formatarValor} />
              <Tooltip formatter={(value) => formatarValor(Number(value))} />
              <Legend />
              <Area
                type="monotone"
                dataKey="entradas"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Entradas"
              />
              <Area
                type="monotone"
                dataKey="saidas"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Saídas"
              />
              <Line
                type="monotone"
                dataKey="lucro"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Lucro"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorias Mais Lucrativas */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias Mais Lucrativas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizzaCategorias}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentual }) => `${name}: ${percentual.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosPizzaCategorias.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatarValor(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Serviços Mais Vendidos */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dados.servicosMaisVendidos}
                layout="horizontal"
                margin={{ left: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatarValor} />
                <YAxis dataKey="nome" type="category" width={100} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'valorTotal' ? formatarValor(Number(value)) : value,
                    name === 'valorTotal' ? 'Valor Total' : 'Quantidade'
                  ]}
                />
                <Legend />
                <Bar dataKey="valorTotal" fill="#3b82f6" name="Valor Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Contas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {formatarValor(dados.agendamentosPagos)}
              </div>
              <div className="text-sm text-green-600">Agendamentos Pagos</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {formatarValor(dados.agendamentosAbertos)}
              </div>
              <div className="text-sm text-orange-600">Agendamentos em Aberto</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {formatarValor(dados.contasFixasPagas)}
              </div>
              <div className="text-sm text-blue-600">Contas Fixas Pagas</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {formatarValor(dados.contasFixasAbertas)}
              </div>
              <div className="text-sm text-red-600">Contas Fixas em Aberto</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}