import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Clock, AlertCircle } from "lucide-react";
import { ResumoFinanceiro as ResumoType } from "@/types/lancamento";

interface ResumoFinanceiroProps {
  resumo: ResumoType;
}

export default function ResumoFinanceiro({ resumo }: ResumoFinanceiroProps) {
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5 animate-fade-in">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover-scale transition-all">
        <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-success flex-shrink-0">
            <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-success-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg sm:text-xl font-bold text-success truncate">
              {formatarValor(resumo.totalEntradas)}
            </p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Entradas</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover-scale transition-all">
        <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-destructive flex-shrink-0">
            <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 text-destructive-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg sm:text-xl font-bold text-destructive truncate">
              {formatarValor(resumo.totalSaidas)}
            </p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Saídas</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover-scale transition-all col-span-2 sm:col-span-1">
        <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className={`flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl flex-shrink-0 ${
            resumo.lucro >= 0 
              ? 'bg-primary' 
              : 'bg-destructive'
          }`}>
            {resumo.lucro >= 0 ? (
              <PiggyBank className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
            ) : (
              <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-destructive-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-lg sm:text-xl font-bold truncate ${
              resumo.lucro >= 0 ? 'text-primary' : 'text-destructive'
            }`}>
              {formatarValor(resumo.lucro)}
            </p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">
              {resumo.lucro >= 0 ? 'Lucro' : 'Prejuízo'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Valor em Aberto */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover-scale transition-all">
        <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-warning flex-shrink-0">
            <Clock className="h-4 w-4 sm:h-4 sm:w-4 text-warning-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg sm:text-xl font-bold text-warning truncate">
              {formatarValor(resumo.valorEmAberto)}
            </p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Em Aberto</p>
          </div>
        </CardContent>
      </Card>

      {/* Contas a Pagar */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover-scale transition-all">
        <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-destructive flex-shrink-0">
            <AlertCircle className="h-4 w-4 sm:h-4 sm:w-4 text-destructive-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg sm:text-xl font-bold text-destructive truncate">
              {formatarValor(resumo.contasAPagar)}
            </p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">A Pagar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}