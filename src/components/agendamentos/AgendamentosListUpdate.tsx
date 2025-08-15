// Patch temporário para adicionar indicadores visuais de cronograma
// Este código será integrado ao componente principal

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Agendamento } from '@/types/agendamento';

interface AgendamentoVisualsProps {
  agendamento: Agendamento;
  children: React.ReactNode;
}

export const AgendamentoVisuals: React.FC<AgendamentoVisualsProps> = ({ agendamento, children }) => {
  return (
    <div className="relative">
      {children}
      {agendamento.origem === 'cronograma' && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
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
      cardStyle: 'border-purple-200 bg-purple-50/30',
      iconColor: 'text-purple-600',
    };
  }
  return {
    cardStyle: '',
    iconColor: '',
  };
};