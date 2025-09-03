import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Safe component that checks React availability
const SafeAgendamentoOnlineForm = () => {
  // Check if React and hooks are available
  if (!React || typeof React.useState !== 'function') {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2 text-destructive">Sistema Indisponível</CardTitle>
          <CardDescription>
            O sistema está carregando. Tente novamente em alguns segundos.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Recarregar Página
          </button>
        </CardContent>
      </Card>
    );
  }

  // Dynamically import and render the form only when React is available
  try {
    const { AgendamentoOnlineForm } = require('@/components/agendamento-online/AgendamentoOnlineForm');
    return React.createElement(AgendamentoOnlineForm);
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">Carregando...</CardTitle>
          <CardDescription>
            Preparando o formulário de agendamento
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
};

export default function AgendamentoOnline() {
  // Base safety check before rendering anything
  if (!React) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto">
        <SafeAgendamentoOnlineForm />
      </div>
    </div>
  );
}