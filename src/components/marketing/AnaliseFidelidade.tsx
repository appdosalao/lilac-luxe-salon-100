import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, Users, Award, Gift } from 'lucide-react';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface DadosAnalise {
  periodo: string;
  pontosDistribuidos: number;
  pontosResgatados: number;
  novosClientes: number;
  resgates: number;
}

interface DistribuicaoNiveis {
  nivel: string;
  quantidade: number;
  percentual: number;
}

export const AnaliseFidelidade = () => {
  const { user } = useSupabaseAuth();
  const [periodoPreset, setPeriodoPreset] = useState<string>('ano_atual');
  const [dataInicio, setDataInicio] = useState<Date>(startOfYear(new Date()));
  const [dataFim, setDataFim] = useState<Date>(endOfYear(new Date()));
  const [dadosTempo, setDadosTempo] = useState<DadosAnalise[]>([]);
  const [distribuicaoNiveis, setDistribuicaoNiveis] = useState<DistribuicaoNiveis[]>([]);
  const [loading, setLoading] = useState(false);
  const [classesColors, setClassesColors] = useState<Record<string, string>>({});

  const aplicarPreset = (preset: string) => {
    const hoje = new Date();
    switch (preset) {
      case 'ano_atual':
        setDataInicio(startOfYear(hoje));
        setDataFim(endOfYear(hoje));
        break;
      case 'ano_passado':
        const anoPassado = subYears(hoje, 1);
        setDataInicio(startOfYear(anoPassado));
        setDataFim(endOfYear(anoPassado));
        break;
      case 'mes_atual':
        setDataInicio(startOfMonth(hoje));
        setDataFim(endOfMonth(hoje));
        break;
      case 'ultimos_3_meses':
        setDataInicio(startOfMonth(subMonths(hoje, 2)));
        setDataFim(endOfMonth(hoje));
        break;
      case 'ultimos_6_meses':
        setDataInicio(startOfMonth(subMonths(hoje, 5)));
        setDataFim(endOfMonth(hoje));
        break;
      case 'ultimos_12_meses':
        setDataInicio(startOfMonth(subMonths(hoje, 11)));
        setDataFim(endOfMonth(hoje));
        break;
    }
    setPeriodoPreset(preset);
  };

  const carregarDados = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar classes para mapear cores
      const { data: classesData } = await supabase
        .from('classes_fidelidade')
        .select('nome, cor')
        .eq('user_id', user.id);

      const colorsMap: Record<string, string> = {};
      classesData?.forEach(c => {
        colorsMap[c.nome.toLowerCase()] = c.cor;
      });
      setClassesColors(colorsMap);

      // Buscar pontos por período
      const { data: pontos, error: erroP } = await supabase
        .from('pontos_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_ganho', dataInicio.toISOString())
        .lte('data_ganho', dataFim.toISOString())
        .order('data_ganho', { ascending: true });

      if (erroP) throw erroP;

      // Buscar resgates por período
      const { data: resgates, error: erroR } = await supabase
        .from('historico_resgates')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_resgate', dataInicio.toISOString())
        .lte('data_resgate', dataFim.toISOString())
        .order('data_resgate', { ascending: true });

      if (erroR) throw erroR;

      // Processar dados por mês
      const dadosPorMes = new Map<string, DadosAnalise>();

      pontos?.forEach((ponto: any) => {
        const mes = format(new Date(ponto.data_ganho), 'MMM/yy', { locale: ptBR });
        const atual = dadosPorMes.get(mes) || {
          periodo: mes,
          pontosDistribuidos: 0,
          pontosResgatados: 0,
          novosClientes: 0,
          resgates: 0
        };

        if (ponto.pontos > 0) {
          atual.pontosDistribuidos += ponto.pontos;
        } else {
          atual.pontosResgatados += Math.abs(ponto.pontos);
        }

        if (ponto.origem === 'agendamento') {
          atual.novosClientes += 1;
        }

        dadosPorMes.set(mes, atual);
      });

      resgates?.forEach((resgate: any) => {
        const mes = format(new Date(resgate.data_resgate), 'MMM/yy', { locale: ptBR });
        const atual = dadosPorMes.get(mes) || {
          periodo: mes,
          pontosDistribuidos: 0,
          pontosResgatados: 0,
          novosClientes: 0,
          resgates: 0
        };

        atual.resgates += 1;
        dadosPorMes.set(mes, atual);
      });

      setDadosTempo(Array.from(dadosPorMes.values()));

      // Buscar distribuição de níveis
      const { data: niveis, error: erroN } = await supabase
        .from('niveis_fidelidade')
        .select('nivel')
        .eq('user_id', user.id);

      if (erroN) throw erroN;

      const contagem = niveis?.reduce((acc: any, n: any) => {
        acc[n.nivel] = (acc[n.nivel] || 0) + 1;
        return acc;
      }, {}) || {};

      const total = Object.values(contagem).reduce((sum: any, val: any) => sum + val, 0) as number;

      const distribuicao = Object.entries(contagem).map(([nivel, qtd]: [string, any]) => ({
        nivel: nivel.charAt(0).toUpperCase() + nivel.slice(1),
        quantidade: qtd,
        percentual: Math.round((qtd / total) * 100)
      }));

      setDistribuicaoNiveis(distribuicao);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [user, dataInicio, dataFim]);

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Análise</CardTitle>
          <CardDescription>
            Selecione o período para visualizar os dados do programa de fidelidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Período Pré-definido</Label>
              <Select value={periodoPreset} onValueChange={aplicarPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ano_atual">Ano Atual</SelectItem>
                  <SelectItem value="ano_passado">Ano Passado</SelectItem>
                  <SelectItem value="mes_atual">Mês Atual</SelectItem>
                  <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
                  <SelectItem value="ultimos_6_meses">Últimos 6 Meses</SelectItem>
                  <SelectItem value="ultimos_12_meses">Últimos 12 Meses</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => {
                      if (date) {
                        setDataInicio(date);
                        setPeriodoPreset('personalizado');
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={(date) => {
                      if (date) {
                        setDataFim(date);
                        setPeriodoPreset('personalizado');
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button onClick={carregarDados} disabled={loading} className="w-full md:w-auto">
            Atualizar Análise
          </Button>
        </CardContent>
      </Card>

      {/* Gráfico de Pontos ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Evolução de Pontos</CardTitle>
          </div>
          <CardDescription>
            Pontos distribuídos e resgatados ao longo do período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosTempo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="pontosDistribuidos"
                stroke="#10b981"
                strokeWidth={2}
                name="Pontos Distribuídos"
              />
              <Line
                type="monotone"
                dataKey="pontosResgatados"
                stroke="#ef4444"
                strokeWidth={2}
                name="Pontos Resgatados"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Resgates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <CardTitle>Resgates por Período</CardTitle>
            </div>
            <CardDescription>
              Quantidade de resgates realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dadosTempo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="resgates" fill="#8b5cf6" name="Resgates" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Níveis */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>Distribuição de Níveis</CardTitle>
            </div>
            <CardDescription>
              Porcentagem de clientes por nível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distribuicaoNiveis}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nivel, percentual }) => `${nivel}: ${percentual}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {distribuicaoNiveis.map((entry, index) => {
                    const cor = classesColors[entry.nivel.toLowerCase()] || '#94a3b8';
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={cor}
                      />
                    );
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Novos Clientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Novos Participantes</CardTitle>
          </div>
          <CardDescription>
            Clientes que ganharam pontos pela primeira vez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosTempo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="novosClientes" fill="#3b82f6" name="Novos Clientes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
