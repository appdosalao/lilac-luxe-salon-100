import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Package, 
  Calendar, 
  DollarSign,
  RefreshCw,
  TrendingUp,
  Clock,
  XCircle,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EstatisticasProps {
  estatisticas: {
    totalClientes: number;
    totalServicos: number;
    totalAgendamentos: number;
    totalLancamentos: number;
    totalCronogramas: number;
    totalRetornos: number;
    agendamentosAtivos: number;
    agendamentosConcluidos: number;
    agendamentosCancelados: number;
    valorTotalReceitas: number;
    valorTotalDespesas: number;
    servicosNuncaUsados: number;
    clientesInativos: number;
  };
}

export function AuditoriaEstatisticas({ estatisticas }: EstatisticasProps) {
  const taxaCancelamento = estatisticas.totalAgendamentos > 0 
    ? (estatisticas.agendamentosCancelados / estatisticas.totalAgendamentos) * 100
    : 0;
  
  const taxaConclusao = estatisticas.totalAgendamentos > 0
    ? (estatisticas.agendamentosConcluidos / estatisticas.totalAgendamentos) * 100
    : 0;

  const lucro = estatisticas.valorTotalReceitas - estatisticas.valorTotalDespesas;
  const margemLucro = estatisticas.valorTotalReceitas > 0
    ? (lucro / estatisticas.valorTotalReceitas) * 100
    : 0;

  const taxaServicosUsados = estatisticas.totalServicos > 0
    ? ((estatisticas.totalServicos - estatisticas.servicosNuncaUsados) / estatisticas.totalServicos) * 100
    : 0;

  const taxaClientesAtivos = estatisticas.totalClientes > 0
    ? ((estatisticas.totalClientes - estatisticas.clientesInativos) / estatisticas.totalClientes) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conclusão
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {taxaConclusao.toFixed(1)}%
            </div>
            <Progress 
              value={taxaConclusao} 
              className="mt-2 h-2 [&>div]:bg-green-500" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {estatisticas.agendamentosConcluidos} de {estatisticas.totalAgendamentos} agendamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Cancelamento
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              taxaCancelamento > 20 ? "text-red-600 dark:text-red-400" : 
              taxaCancelamento > 10 ? "text-yellow-600 dark:text-yellow-400" : 
              "text-green-600 dark:text-green-400"
            )}>
              {taxaCancelamento.toFixed(1)}%
            </div>
            <Progress 
              value={taxaCancelamento} 
              className={cn(
                "mt-2 h-2",
                taxaCancelamento > 20 ? "[&>div]:bg-red-500" : 
                taxaCancelamento > 10 ? "[&>div]:bg-yellow-500" : 
                "[&>div]:bg-green-500"
              )}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {estatisticas.agendamentosCancelados} cancelamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Margem de Lucro
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              margemLucro >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {margemLucro.toFixed(1)}%
            </div>
            <Progress 
              value={Math.abs(margemLucro)} 
              className={cn(
                "mt-2 h-2",
                margemLucro >= 0 ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"
              )}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Lucro: R$ {lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              taxaClientesAtivos >= 70 ? "text-green-600 dark:text-green-400" : 
              taxaClientesAtivos >= 50 ? "text-yellow-600 dark:text-yellow-400" : 
              "text-red-600 dark:text-red-400"
            )}>
              {taxaClientesAtivos.toFixed(1)}%
            </div>
            <Progress 
              value={taxaClientesAtivos} 
              className={cn(
                "mt-2 h-2",
                taxaClientesAtivos >= 70 ? "[&>div]:bg-green-500" : 
                taxaClientesAtivos >= 50 ? "[&>div]:bg-yellow-500" : 
                "[&>div]:bg-red-500"
              )}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {estatisticas.totalClientes - estatisticas.clientesInativos} ativos de {estatisticas.totalClientes}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.totalClientes}</div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ativos (últimos 30 dias)</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {estatisticas.totalClientes - estatisticas.clientesInativos}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Inativos</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {estatisticas.clientesInativos}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.totalServicos}</div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilizados</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {estatisticas.totalServicos - estatisticas.servicosNuncaUsados}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nunca usados</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {estatisticas.servicosNuncaUsados}
                </span>
              </div>
            </div>
            <Progress 
              value={taxaServicosUsados} 
              className="mt-3 h-1.5" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.totalAgendamentos}</div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ativos</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {estatisticas.agendamentosAtivos}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Concluídos</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {estatisticas.agendamentosConcluidos}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cancelados</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {estatisticas.agendamentosCancelados}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financeiro</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.totalLancamentos}</div>
            <p className="text-xs text-muted-foreground mb-4">lançamentos</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Receitas</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  R$ {estatisticas.valorTotalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Despesas</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  R$ {estatisticas.valorTotalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cronogramas</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estatisticas.totalCronogramas}</div>
            <p className="text-xs text-muted-foreground mb-4">cronogramas ativos</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Retornos cadastrados</span>
              <span className="font-medium">{estatisticas.totalRetornos}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resumo</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              lucro >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              R$ {lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mb-4">resultado financeiro</p>
            <div className="flex items-center gap-2 text-sm">
              {lucro >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Lucro positivo</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">Prejuízo</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
