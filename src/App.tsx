import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import only essential components to avoid bundling conflicts
import AgendamentoOnline from "./pages/AgendamentoOnline";

console.log("App.tsx - React check:", React ? 'React available' : 'React is null');

function App() {
  console.log("App component rendering");
  
  return (
    <BrowserRouter>
      <div id="app-container">
        <Routes>
          {/* Start with minimal routes to test React bundling */}
          <Route path="/agendamento-online" element={<AgendamentoOnline />} />
          <Route path="/agendar" element={<AgendamentoOnline />} />
          <Route path="/" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold">Sistema Funcionando</h1>
                <p>React está carregado corretamente</p>
                <a href="/agendamento-online" className="text-blue-500 underline">
                  Ir para Agendamento Online
                </a>
              </div>
            </div>
          } />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <h1 className="text-xl">Página não encontrada</h1>
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;