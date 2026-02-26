// Patch temporário para adicionar indicadores visuais de cronograma
// Este código será integrado ao componente principal

import { Badge } from '@/components/ui/badge';
import { Agendamento } from '@/types/agendamento';

interface AgendamentoVisualsProps {
  agendamento: Agendamento;
  children: React.ReactNode;
}

export const AgendamentoVisuals = ({ agendamento, children }: AgendamentoVisualsProps) => {
  return (
    <div className="relative">
      {children}
      {agendamento.origem === 'cronograma' && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            💜 Cronograma
          </Badge>
        </div>
      )}
      {agendamento.confirmado === false && (
        <div className="absolute bottom-2 right-2">
          <Badge variant="outline" className="text-xs">
            Aguardando confirmação
          </Badge>
        </div>
      )}
    </div>
  );
};

// Função para determinar os estilos de acordo com a origem
export const getOrigemStyles = (origem?: string) => {
  if (origem === 'cronograma') {
    return {
      cardStyle: 'border-primary/20 bg-primary/5',
      iconColor: 'text-primary',
    };
  }
  return {
    cardStyle: '',
    iconColor: '',
  };
};