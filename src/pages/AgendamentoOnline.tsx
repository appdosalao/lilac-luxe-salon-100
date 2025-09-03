import React from 'react';
import { AgendamentoOnlineForm } from '@/components/agendamento-online/AgendamentoOnlineForm';

export default function AgendamentoOnline() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto">
        <AgendamentoOnlineForm />
      </div>
    </div>
  );
}