import React from 'react';

console.log("AgendamentoOnline.tsx - React check:", React ? 'React available' : 'React is null');

export default function AgendamentoOnline() {
  console.log("AgendamentoOnline component rendering");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
            Agendamento Online
          </h1>
          <div className="text-center text-gray-600">
            <p className="mb-4">Sistema de agendamento funcionando!</p>
            <p className="text-sm">React carregado com sucesso</p>
          </div>
        </div>
      </div>
    </div>
  );
}