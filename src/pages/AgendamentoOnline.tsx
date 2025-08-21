import * as React from 'react';

const { Suspense } = React;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Lazy load do formulário para evitar problemas de carregamento
const AgendamentoOnlineForm = React.lazy(() => 
  import('@/components/agendamento-online/AgendamentoOnlineForm').then(module => ({
    default: module.AgendamentoOnlineForm
  }))
);

export default function AgendamentoOnline() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto">
        <Suspense 
          fallback={
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
          }
        >
          <AgendamentoOnlineForm />
        </Suspense>
      </div>
    </div>
  );
}