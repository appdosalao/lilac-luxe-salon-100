import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  porcentagemSaude: number;
  totalProblemas: number;
  problemasCriticos: number;
  problemasAltos: number;
  valorTotalReceitas: number;
  valorTotalDespesas: number;
  totalAgendamentos: number;
  agendamentosAtivos: number;
  agendamentosConcluidos: number;
}

export function AuditoriaSummaryCards({
  porcentagemSaude,
  totalProblemas,
  problemasCriticos,
  problemasAltos,
  valorTotalReceitas,
  valorTotalDespesas,
  totalAgendamentos,
  agendamentosAtivos,
  agendamentosConcluidos
}: SummaryCardsProps) {
  const lucro = valorTotalReceitas - valorTotalDespesas;
  const lucroPorcentagem = valorTotalReceitas > 0 
    ? ((lucro / valorTotalReceitas) * 100).toFixed(1) 
    : '0';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Saúde do Sistema */}
      <Card className={cn(
        "border-l-4",
        porcentagemSaude > 80 ? "border-l-green-500" : 
        porcentagemSaude > 60 ? "border-l-yellow-500" : "border-l-red-500"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saúde do Sistema</CardTitle>
          {porcentagemSaude > 80 ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : porcentagemSaude > 60 ? (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{porcentagemSaude.toFixed(0)}%</div>
          <Progress 
            value={porcentagemSaude} 
            className={cn(
              "mt-2 h-2",
              porcentagemSaude > 80 ? "[&>div]:bg-green-500" : 
              porcentagemSaude > 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {porcentagemSaude > 80 ? "Sistema saudável" : 
             porcentagemSaude > 60 ? "Atenção necessária" : "Ação imediata requerida"}
          </p>
        </CardContent>
      </Card>

      {/* Total de Problemas */}
      <Card className={cn(
        "border-l-4",
        totalProblemas === 0 ? "border-l-green-500" : 
        problemasCriticos > 0 ? "border-l-red-500" : "border-l-yellow-500"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Problemas Detectados</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProblemas}</div>
          <div className="flex gap-2 mt-2">
            {problemasCriticos > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {problemasCriticos} críticos
              </span>
            )}
            {problemasAltos > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                {problemasAltos} altos
              </span>
            )}
          </div>
          {totalProblemas === 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              ✓ Nenhum problema encontrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Financeiro */}
      <Card className={cn(
        "border-l-4",
        lucro >= 0 ? "border-l-green-500" : "border-l-red-500"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resultado Financeiro</CardTitle>
          {lucro >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold",
            lucro >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            R$ {lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Receitas:</span>
              <span className="text-green-600 dark:text-green-400">
                R$ {valorTotalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Despesas:</span>
              <span className="text-red-600 dark:text-red-400">
                R$ {valorTotalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agendamentos */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAgendamentos}</div>
          <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Ativos:</span>
              <span className="text-primary font-medium">{agendamentosAtivos}</span>
            </div>
            <div className="flex justify-between">
              <span>Concluídos:</span>
              <span className="text-green-600 dark:text-green-400">{agendamentosConcluidos}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
