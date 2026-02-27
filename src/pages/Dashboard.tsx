import React, { useMemo, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, Plus, Users, UserPlus, TrendingUp, Sparkles, PiggyBank } from "lucide-react";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { agendamentosFiltrados } = useAgendamentos();
  const { lancamentos } = useLancamentos();
  const { usuario, checkSubscription } = useSupabaseAuth();

  // Detectar retorno de pagamento bem-sucedido
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      // Limpar query param
      setSearchParams({});
      
      // Forçar verificação de assinatura múltiplas vezes
      toast.success('🎉 Pagamento confirmado! Verificando assinatura...');
      setTimeout(() => checkSubscription(), 1000);
      setTimeout(() => checkSubscription(), 3000);
      setTimeout(() => checkSubscription(), 6000);
    }
  }, [searchParams, setSearchParams, checkSubscription]);

  // Data atual
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const dataHoje = hoje.toISOString().split('T')[0];

  // Agendamentos hoje
  const agendamentosHoje = useMemo(() => {
    return agendamentosFiltrados.filter(ag => 
      ag.data === dataHoje && ag.status !== 'cancelado'
    );
  }, [agendamentosFiltrados, dataHoje]);

  // Total recebido hoje
  const totalRecebidoHoje = useMemo(() => {
    const agendamentosConcluidos = agendamentosFiltrados.filter(ag => 
      ag.data === dataHoje && ag.status === 'concluido'
    );
    return agendamentosConcluidos.reduce((total, ag) => total + ag.valor, 0);
  }, [agendamentosFiltrados, dataHoje]);

  // Próximo cliente a ser atendido hoje
  const proximoCliente = useMemo(() => {
    const agora = new Date();
    const horaAtual = agora.toTimeString().slice(0, 5);
    
    const proximosAgendamentos = agendamentosHoje
      .filter(ag => ag.hora > horaAtual && ag.status === 'agendado')
      .sort((a, b) => a.hora.localeCompare(b.hora));
    
    return proximosAgendamentos[0] || null;
  }, [agendamentosHoje]);

  // Agendamentos do próximo dia
  const agendamentosProximoDia = useMemo(() => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataAmanha = amanha.toISOString().split('T')[0];
    
    return agendamentosFiltrados
      .filter(ag => ag.data === dataAmanha && ag.status === 'agendado')
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [agendamentosFiltrados]);

  // Controle de período do gráfico
  const [periodo, setPeriodo] = useState<7 | 30 | 90>(7);

  // Dados para gráfico por período
  const dadosPeriodo = useMemo(() => {
    const pontos: { label: string; valor: number; iso: string }[] = [];
    for (let i = periodo - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const totalDia = lancamentos
        .filter(l => l.data.toISOString().split('T')[0] === dStr && l.tipo === 'entrada')
        .reduce((total, l) => total + l.valor, 0);
      const label =
        periodo === 7
          ? d.toLocaleDateString('pt-BR', { weekday: 'short' })
          : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      pontos.push({ label, valor: totalDia, iso: dStr });
    }
    return pontos;
  }, [lancamentos, periodo]);

  const totalPeriodo = useMemo(
    () => dadosPeriodo.reduce((s, d) => s + d.valor, 0),
    [dadosPeriodo]
  );
  const mediaPeriodo = useMemo(
    () => (dadosPeriodo.length ? totalPeriodo / dadosPeriodo.length : 0),
    [totalPeriodo, dadosPeriodo.length]
  );

  const dadosGrafico = useMemo(
    () => dadosPeriodo.map(d => ({ dia: d.label, valor: d.valor, isHoje: d.iso === dataHoje })),
    [dadosPeriodo, dataHoje]
  );

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const concluidosHoje = useMemo(() => {
    return agendamentosFiltrados.filter(ag => ag.data === dataHoje && ag.status === 'concluido');
  }, [agendamentosFiltrados, dataHoje]);

  const ticketMedioHoje = useMemo(() => {
    const qtd = concluidosHoje.length;
    if (qtd === 0) return 0;
    return totalRecebidoHoje / qtd;
  }, [concluidosHoje, totalRecebidoHoje]);

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const entradasMes = useMemo(() => {
    return lancamentos
      .filter(l => l.tipo === 'entrada' && l.data >= inicioMes)
      .reduce((s, l) => s + l.valor, 0);
  }, [lancamentos, inicioMes]);
  const saidasMes = useMemo(() => {
    return lancamentos
      .filter(l => l.tipo === 'saida' && l.data >= inicioMes)
      .reduce((s, l) => s + l.valor, 0);
  }, [lancamentos, inicioMes]);
  const lucroMes = entradasMes - saidasMes;

  const clientesUnicosHoje = useMemo(() => {
    const set = new Set(agendamentosHoje.map(a => a.clienteNome));
    return set.size;
  }, [agendamentosHoje]);

  const carregandoDados =
    agendamentosFiltrados.length === 0 && lancamentos.length === 0;

  return (
    <div className="space-responsive-lg">
      <InstallPrompt variant="card" />
      
      
      {/* Cabeçalho de boas-vindas */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary to-lilac-light p-responsive text-primary-foreground shadow-md">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-responsive-2xl sm:text-responsive-3xl font-bold">
                Olá, {usuario?.nome_completo?.split(' ')[0] || 'Profissional'}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize">{dataFormatada}</Badge>
              </div>
            </div>
          </div>
          <p className="text-responsive-sm opacity-80">
            Tenha um dia produtivo e cheio de sucesso!
          </p>
        </div>
        <div className="absolute -right-4 sm:-right-8 -top-4 sm:-top-8 h-16 w-16 sm:h-32 sm:w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 sm:-bottom-12 -left-6 sm:-left-12 h-20 w-20 sm:h-40 sm:w-40 rounded-full bg-white/5" />
      </div>

      {/* Cards de Resumo */}
      <div className="grid-responsive-3">
        <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-responsive-sm">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">
              Agendamentos Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-responsive-sm pt-0">
            {carregandoDados ? (
              <Skeleton className="h-7 w-16 rounded-md" />
            ) : (
              <div className="text-responsive-xl font-bold text-foreground">{agendamentosHoje.length}</div>
            )}
            <p className="text-responsive-xs text-muted-foreground">
              {agendamentosHoje.length === 0 ? 'Nenhum agendamento hoje' : 'clientes agendados'}
            </p>
          </CardContent>
          <div className="absolute -right-2 -top-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary/10 to-transparent" />
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-responsive-sm">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">
              Total Recebido Hoje
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-responsive-sm pt-0">
            {carregandoDados ? (
              <Skeleton className="h-7 w-24 rounded-md" />
            ) : (
              <div className="text-responsive-xl font-bold text-green-600">{formatarMoeda(totalRecebidoHoje)}</div>
            )}
            <p className="text-responsive-xs text-muted-foreground">
              Serviços concluídos
            </p>
          </CardContent>
          <div className="absolute -right-2 -top-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-green-500/10 to-transparent" />
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm sm:col-span-1 col-span-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-responsive-sm">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">
              Agendamentos de Amanhã
            </CardTitle>
            <Clock className="h-4 w-4 text-lilac-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-responsive-sm pt-0">
            {agendamentosProximoDia.length > 0 ? (
              <div className="space-y-1">
                <div className="text-responsive-lg font-bold text-foreground">
                  {agendamentosProximoDia.length} agendamento{agendamentosProximoDia.length > 1 ? 's' : ''}
                </div>
                <div className="space-y-1 max-h-16 overflow-y-auto">
                  {agendamentosProximoDia.slice(0, 3).map((agendamento, index) => (
                    <p key={agendamento.id} className="text-responsive-xs text-muted-foreground truncate">
                      {agendamento.hora} - {agendamento.clienteNome}
                    </p>
                  ))}
                  {agendamentosProximoDia.length > 3 && (
                    <p className="text-responsive-xs text-muted-foreground">
                      +{agendamentosProximoDia.length - 3} mais
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-responsive-lg font-bold text-foreground">Sem agendamentos</div>
                <p className="text-responsive-xs text-muted-foreground">para amanhã</p>
              </div>
            )}
          </CardContent>
          <div className="absolute -right-2 -top-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-lilac-primary/10 to-transparent" />
        </Card>
      </div>

      <div className="grid-responsive-3 mt-3">
        <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-responsive-sm">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Ticket Médio Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-responsive-sm pt-0">
            {carregandoDados ? (
              <Skeleton className="h-7 w-20 rounded-md" />
            ) : (
              <div className="text-responsive-xl font-bold">{formatarMoeda(ticketMedioHoje)}</div>
            )}
            <p className="text-responsive-xs text-muted-foreground">Por atendimento concluído</p>
          </CardContent>
          <div className="absolute -right-2 -top-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary/10 to-transparent" />
        </Card>
        <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-responsive-sm">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Entradas no Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-responsive-sm pt-0">
            {carregandoDados ? (
              <Skeleton className="h-7 w-24 rounded-md" />
            ) : (
              <div className="text-responsive-xl font-bold text-green-600">{formatarMoeda(entradasMes)}</div>
            )}
            <p className="text-responsive-xs text-muted-foreground">Receitas totais</p>
          </CardContent>
          <div className="absolute -right-2 -top-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-green-500/10 to-transparent" />
        </Card>
        <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-responsive-sm">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Lucro no Mês</CardTitle>
            <PiggyBank className="h-4 w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-responsive-sm pt-0">
            {carregandoDados ? (
              <Skeleton className="h-7 w-24 rounded-md" />
            ) : (
              <div className="text-responsive-xl font-bold">{formatarMoeda(lucroMes)}</div>
            )}
            <p className="text-responsive-xs text-muted-foreground">Entradas – Saídas</p>
          </CardContent>
          <div className="absolute -right-2 -top-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary/10 to-transparent" />
        </Card>
      </div>

      <div className="grid-responsive-3 mt-3">
        <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-responsive-sm">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Clientes Hoje</CardTitle>
            <Users className="h-4 w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-responsive-sm pt-0">
            <div className="text-responsive-xl font-bold">{clientesUnicosHoje}</div>
            <p className="text-responsive-xs text-muted-foreground">Únicos do dia</p>
          </CardContent>
          <div className="absolute -right-2 -top-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary/10 to-transparent" />
        </Card>
        <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-responsive-sm">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Saídas no Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-responsive-sm pt-0">
            <div className="text-responsive-xl font-bold text-destructive">{formatarMoeda(saidasMes)}</div>
            <p className="text-responsive-xs text-muted-foreground">Despesas totais</p>
          </CardContent>
          <div className="absolute -right-2 -top-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-red-500/10 to-transparent" />
        </Card>
      </div>

      {/* Atalhos Rápidos */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm rounded-2xl">
        <CardHeader className="p-responsive">
          <CardTitle className="flex items-center gap-2 text-responsive-lg">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            Ações Rápidas
          </CardTitle>
          <CardDescription className="text-responsive-sm">
            Acesse rapidamente as funcionalidades mais usadas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-responsive pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <Button 
              onClick={() => navigate('/agendamentos')}
              className="btn-touch h-16 sm:h-20 flex-col gap-2 bg-gradient-to-br from-primary to-lilac-primary text-white text-responsive-xs sm:text-responsive-sm hover:brightness-110"
              size="lg"
            >
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Novo Agendamento</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/clientes')}
              className="btn-touch h-16 sm:h-20 flex-col gap-2 bg-gradient-to-br from-lilac-primary to-pink-accent text-white text-responsive-xs sm:text-responsive-sm hover:brightness-110"
              size="lg"
            >
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Novo Cliente</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/financeiro')}
              className="btn-touch h-16 sm:h-20 flex-col gap-2 bg-gradient-to-br from-pink-accent to-lavender text-white text-responsive-xs sm:text-responsive-sm hover:brightness-110"
              size="lg"
            >
              <PiggyBank className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Nova Entrada/Saída</span>
            </Button>
            <Button 
              onClick={() => navigate('/servicos')}
              className="btn-touch h-16 sm:h-20 flex-col gap-2 bg-gradient-to-br from-purple-500 to-purple-400 text-white text-responsive-xs sm:text-responsive-sm hover:brightness-110"
              size="lg"
            >
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Serviços</span>
            </Button>
            <Button 
              onClick={() => navigate('/produtos')}
              className="btn-touch h-16 sm:h-20 flex-col gap-2 bg-gradient-to-br from-indigo-500 to-indigo-400 text-white text-responsive-xs sm:text-responsive-sm hover:brightness-110"
              size="lg"
            >
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Produtos</span>
            </Button>
            <Button 
              onClick={() => navigate('/marketing')}
              className="btn-touch h-16 sm:h-20 flex-col gap-2 bg-gradient-to-br from-rose-500 to-rose-400 text-white text-responsive-xs sm:text-responsive-sm hover:brightness-110"
              size="lg"
            >
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Marketing</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Semanal */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader className="p-responsive">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-responsive-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              Faturamento – últimos {periodo} dias
            </CardTitle>
            <div className="flex gap-1 bg-muted/40 p-1 rounded-lg">
              {[7, 30, 90].map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={periodo === p ? "default" : "ghost"}
                  onClick={() => setPeriodo(p as 7 | 30 | 90)}
                  className="h-8 px-3"
                >
                  {p}d
                </Button>
              ))}
            </div>
          </div>
          <CardDescription className="text-responsive-sm">
            Acompanhe seu desempenho semanal
          </CardDescription>
          <div className="mt-2 text-muted-foreground text-xs sm:text-sm">
            <span>Total: {formatarMoeda(totalPeriodo)}</span>
            <span className="mx-2">•</span>
            <span>Média diária: {formatarMoeda(mediaPeriodo)}</span>
          </div>
        </CardHeader>
        <CardContent className="p-responsive pt-0">
          <div className="h-48 sm:h-64 overflow-responsive">
            <ResponsiveContainer width="100%" height="100%" minWidth={300}>
              <BarChart data={dadosGrafico}>
                <defs>
                  <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="dia" 
                  axisLine={false}
                  tickLine={false}
                  className="text-muted-foreground text-[10px] sm:text-xs"
                  tick={{ fontSize: 10 }}
                  interval={periodo > 7 ? 'preserveStartEnd' : 0}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-muted-foreground text-xs"
                  tickFormatter={(value) => `R$ ${value}`}
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip 
                  formatter={(value) => {
                    const v = Number(value);
                    const delta = mediaPeriodo > 0 ? ((v - mediaPeriodo) / mediaPeriodo) * 100 : 0;
                    const sinal = delta >= 0 ? '+' : '';
                    return [formatarMoeda(v), `Faturamento (${sinal}${delta.toFixed(0)}% vs média)`];
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <ReferenceLine
                  y={mediaPeriodo}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Média',
                    position: 'right',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 12,
                  }}
                />
                <Bar 
                  dataKey="valor" 
                  fill="url(#fillPrimary)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                >
                  {dadosGrafico.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isHoje ? 'hsl(var(--primary))' : 'url(#fillPrimary)'}
                      stroke={entry.isHoje ? 'hsl(var(--primary))' : undefined}
                      strokeWidth={entry.isHoje ? 1 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Próximo Cliente */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader className="p-responsive">
          <CardTitle className="flex items-center gap-2 text-responsive-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            Próximo Cliente
          </CardTitle>
          <CardDescription className="text-responsive-sm">
            Seu próximo atendimento de hoje
          </CardDescription>
        </CardHeader>
        <CardContent className="p-responsive pt-0">
          {proximoCliente ? (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-lilac-light/5 border border-primary/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-lilac-primary flex-shrink-0">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-responsive-lg font-bold text-foreground truncate">
                  {proximoCliente.clienteNome}
                </h3>
                <p className="text-responsive-sm text-muted-foreground">
                  {proximoCliente.hora} - {proximoCliente.servicoNome}
                </p>
                <p className="text-responsive-xs text-muted-foreground">
                  Valor: {formatarMoeda(proximoCliente.valor)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-responsive-lg font-medium text-muted-foreground">
                Sem próximos atendimentos hoje
              </p>
              <p className="text-responsive-xs text-muted-foreground">
                Você pode descansar ou aproveitar para outras atividades
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivação */}
      {agendamentosHoje.length > 0 && (
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-lilac-light/5 shadow-sm">
          <CardContent className="p-responsive">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-lilac-primary flex-shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-responsive-sm">
                  Você já atendeu {agendamentosFiltrados.filter(ag => ag.data === dataHoje && ag.status === 'concluido').length} de {agendamentosHoje.length} clientes hoje!
                </p>
                <p className="text-responsive-xs text-muted-foreground">
                  Continue assim, você está indo muito bem! 💪
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
