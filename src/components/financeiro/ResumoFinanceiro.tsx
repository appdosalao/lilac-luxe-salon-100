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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex-shrink-0">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-responsive-lg font-bold text-green-600 truncate">
              {formatarValor(resumo.totalEntradas)}
            </p>
            <p className="text-responsive-sm text-muted-foreground">Entradas do Mês</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm card-responsive">
        <CardContent className="flex items-center gap-4 p-responsive-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex-shrink-0">
            <TrendingDown className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-responsive-lg font-bold text-red-600 truncate">
              {formatarValor(resumo.totalSaidas)}
            </p>
            <p className="text-responsive-sm text-muted-foreground">Saídas do Mês</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm card-responsive">
        <CardContent className="flex items-center gap-4 p-responsive-sm">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br flex-shrink-0 ${
            resumo.lucro >= 0 
              ? 'from-primary to-lilac-primary' 
              : 'from-red-500 to-red-600'
          }`}>
            {resumo.lucro >= 0 ? (
              <PiggyBank className="h-6 w-6 text-white" />
            ) : (
              <DollarSign className="h-6 w-6 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-responsive-lg font-bold truncate ${
              resumo.lucro >= 0 ? 'text-primary' : 'text-red-600'
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex-shrink-0">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-responsive-lg font-bold text-orange-600 truncate">
              {formatarValor(resumo.valorEmAberto)}
            </p>
            <p className="text-responsive-sm text-muted-foreground">Valor em Aberto</p>
          </div>
        </CardContent>
      </Card>

      {/* Contas a Pagar */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm card-responsive">
        <CardContent className="flex items-center gap-4 p-responsive-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-responsive-lg font-bold text-red-600 truncate">
              {formatarValor(resumo.contasAPagar)}
            </p>
            <p className="text-responsive-sm text-muted-foreground">Contas a Pagar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}