import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, Calendar, DollarSign } from 'lucide-react';
import { ContaFixa } from '@/types/contaFixa';

interface AvisosVencimentoProps {
  contasFixas: ContaFixa[];
  onPagarConta: (contaId: string) => void;
}

export default function AvisosVencimento({ contasFixas, onPagarConta }: AvisosVencimentoProps) {
  
  const getContasVencendo = () => {
    const hoje = new Date();
    const proximosSeteDias = new Date();
    proximosSeteDias.setDate(hoje.getDate() + 7);
    
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    return contasFixas.filter(conta => {
      if (conta.status === 'pago') return false;
      
      // Calcular a data de vencimento no mês atual
      const dataVencimento = new Date(anoAtual, mesAtual - 1, conta.dataVencimento);
      
      // Se já passou do vencimento no mês atual, considerar o próximo mês
      if (dataVencimento < hoje) {
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }
      
      return dataVencimento <= proximosSeteDias;
    }).map(conta => {
      const dataVencimento = new Date(anoAtual, mesAtual - 1, conta.dataVencimento);
      if (dataVencimento < hoje) {
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }
      
      const diasParaVencimento = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...conta,
        dataVencimento,
        diasParaVencimento,
        situacao: diasParaVencimento < 0 ? 'vencido' : 
                 diasParaVencimento === 0 ? 'venceHoje' : 
                 diasParaVencimento <= 3 ? 'venceEmBreve' : 'normal'
      };
    }).sort((a, b) => a.diasParaVencimento - b.diasParaVencimento);
  };

  const contasVencendo = getContasVencendo();
  const contasVencidas = contasVencendo.filter(c => c.situacao === 'vencido');
  const contasVenceHoje = contasVencendo.filter(c => c.situacao === 'venceHoje');
  const contasVenceEmBreve = contasVencendo.filter(c => c.situacao === 'venceEmBreve');

  // Emitir notificação sonora para contas críticas
  useEffect(() => {
    if (contasVencidas.length > 0 || contasVenceHoje.length > 0) {
      // Verificar se o usuário permite notificações
      if (Notification.permission === 'granted') {
        new Notification('Atenção: Contas Vencendo!', {
          body: `Você tem ${contasVencidas.length + contasVenceHoje.length} conta(s) que requer(em) atenção imediata.`,
          icon: '/icons/icon-192x192.png'
        });
      }
      
      // Som de alerta (se disponível)
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignorar erro se não conseguir tocar o som
        });
      } catch (error) {
        // Ignorar erro de áudio
      }
    }
  }, [contasVencidas.length, contasVenceHoje.length]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'vencido':
        return 'bg-destructive/10 text-destructive';
      case 'venceHoje':
        return 'bg-warning/10 text-warning';
      case 'venceEmBreve':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-info/10 text-info';
    }
  };

  const getSituacaoTexto = (conta: any) => {
    switch (conta.situacao) {
      case 'vencido':
        return `Venceu há ${Math.abs(conta.diasParaVencimento)} dia(s)`;
      case 'venceHoje':
        return 'Vence hoje';
      case 'venceEmBreve':
        return `Vence em ${conta.diasParaVencimento} dia(s)`;
      default:
        return `Vence em ${conta.diasParaVencimento} dia(s)`;
    }
  };

  if (contasVencendo.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <Bell className="h-5 w-5" />
            Avisos de Vencimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-success font-medium">Parabéns!</p>
            <p className="text-muted-foreground">Não há contas vencendo nos próximos 7 dias.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alertas Críticos */}
      {(contasVencidas.length > 0 || contasVenceHoje.length > 0) && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Atenção:</strong> Você tem {contasVencidas.length + contasVenceHoje.length} conta(s) 
            que requer(em) pagamento imediato!
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de Contas Vencendo em Breve */}
      {contasVenceEmBreve.length > 0 && (
        <Alert className="border-warning/20 bg-warning/10">
          <Bell className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            Você tem {contasVenceEmBreve.length} conta(s) vencendo nos próximos dias.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Contas Vencendo */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bell className="h-5 w-5" />
            Contas Vencendo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {contasVencendo.map((conta) => (
              <div key={conta.id} className="flex flex-col gap-3 p-3 border border-border/50 rounded-lg bg-background/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{conta.nome}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {conta.categoria || 'Sem categoria'}
                    </p>
                  </div>
                  <Badge className={`flex-shrink-0 ${getSituacaoColor(conta.situacao)}`}>
                    {getSituacaoTexto(conta)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(conta.dataVencimento)}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatCurrency(conta.valor)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => onPagarConta(conta.id)}
                  className={`w-full h-9 text-xs sm:text-sm btn-touch ${
                    conta.situacao === 'vencido' || conta.situacao === 'venceHoje'
                      ? 'bg-destructive hover:bg-destructive/90'
                      : 'bg-success hover:bg-success/90'
                  }`}
                >
                  Pagar Agora
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}