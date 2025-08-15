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
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'venceHoje':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'venceEmBreve':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
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
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Bell className="h-5 w-5" />
            Avisos de Vencimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-green-600 font-medium">Parabéns!</p>
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
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Atenção:</strong> Você tem {contasVencidas.length + contasVenceHoje.length} conta(s) 
            que requer(em) pagamento imediato!
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de Contas Vencendo em Breve */}
      {contasVenceEmBreve.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <Bell className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Você tem {contasVenceEmBreve.length} conta(s) vencendo nos próximos dias.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Contas Vencendo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Contas Vencendo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contasVencendo.map((conta) => (
              <div key={conta.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{conta.nome}</h3>
                    <Badge className={getSituacaoColor(conta.situacao)}>
                      {getSituacaoTexto(conta)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(conta.dataVencimento)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(conta.valor)}
                    </span>
                    <span>Categoria: {conta.categoria}</span>
                  </div>
                </div>
                <Button
                  onClick={() => onPagarConta(conta.id)}
                  className={
                    conta.situacao === 'vencido' || conta.situacao === 'venceHoje'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }
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