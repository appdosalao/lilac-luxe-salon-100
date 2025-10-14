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
    <div className="grid-responsive-5">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm card-responsive">
        <CardContent className="flex items-center gap-4 p-responsive-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success flex-shrink-0">
            <TrendingUp className="h-6 w-6 text-success-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-responsive-lg font-bold text-success truncate">
              {formatarValor(resumo.totalEntradas)}
            </p>
            <p className="text-responsive-sm text-muted-foreground">Entradas do Mês</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm card-responsive">
        <CardContent className="flex items-center gap-4 p-responsive-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive flex-shrink-0">
            <TrendingDown className="h-6 w-6 text-destructive-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-responsive-lg font-bold text-destructive truncate">
              {formatarValor(resumo.totalSaidas)}
            </p>
            <p className="text-responsive-sm text-muted-foreground">Saídas do Mês</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm card-responsive">
        <CardContent className="flex items-center gap-4 p-responsive-sm">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${
            resumo.lucro >= 0 
              ? 'bg-primary' 
              : 'bg-destructive'
          }`}>
            {resumo.lucro >= 0 ? (
              <PiggyBank className="h-6 w-6 text-primary-foreground" />
            ) : (
              <DollarSign className="h-6 w-6 text-destructive-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-responsive-lg font-bold truncate ${
              resumo.lucro >= 0 ? 'text-primary' : 'text-destructive'
            }`}>
              {formatarValor(resumo.lucro)}
            </p>
            <p className="text-responsive-sm text-muted-foreground">
              {resumo.lucro >= 0 ? 'Lucro do Mês' : 'Prejuízo do Mês'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Valor em Aberto */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm card-responsive">
        <CardContent className="flex items-center gap-4 p-responsive-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning flex-shrink-0">
            <Clock className="h-6 w-6 text-warning-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-responsive-lg font-bold text-warning truncate">
              {formatarValor(resumo.valorEmAberto)}
            </p>
            <p className="text-responsive-sm text-muted-foreground">Valor em Aberto</p>
          </div>
        </CardContent>
      </Card>

      {/* Contas a Pagar */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm card-responsive">
        <CardContent className="flex items-center gap-4 p-responsive-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-destructive-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-responsive-lg font-bold text-destructive truncate">
              {formatarValor(resumo.contasAPagar)}
            </p>
            <p className="text-responsive-sm text-muted-foreground">Contas a Pagar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}