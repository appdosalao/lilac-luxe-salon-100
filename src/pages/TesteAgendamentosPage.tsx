import React, { useState, useEffect } from 'react';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useAgendamentoOnlineService } from '@/hooks/useAgendamentoOnlineService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { toast } from 'sonner';

const TesteAgendamentosPage = () => {
  const [logs, setLogs] = useState<string[]>([]);
  
  // Hook Interno
  const { 
    todosAgendamentos, 
    clientes, 
    servicos: servicosInternos,
    criarAgendamento: criarAgendamentoInterno 
  } = useAgendamentos();

  // Hook Público
  const { 
    servicos: servicosPublicos, 
    carregarServicos: carregarServicosPublicos,
    calcularHorariosDisponiveis,
    criarAgendamento: criarAgendamentoPublico
  } = useAgendamentoOnlineService();

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
    console.log(`[TESTE] ${msg}`);
  };

  // --- Testes Internos ---

  const testarListagemInterna = () => {
    addLog(`--- TESTE INTERNO: LISTAGEM ---`);
    addLog(`Agendamentos carregados: ${todosAgendamentos?.length || 0}`);
    addLog(`Clientes carregados: ${clientes?.length || 0}`);
    addLog(`Serviços internos carregados: ${servicosInternos?.length || 0}`);
    
    if (todosAgendamentos?.length > 0) {
      addLog(`Primeiro agendamento: ${JSON.stringify(todosAgendamentos[0])}`);
    }
  };

  const testarCriacaoInterna = async () => {
    addLog(`--- TESTE INTERNO: CRIAÇÃO ---`);
    
    if (!clientes?.length || !servicosInternos?.length) {
      addLog(`ERRO: Precisa ter clientes e serviços cadastrados para testar.`);
      toast.error("Sem dados para teste interno");
      return;
    }

    const cliente = clientes[0];
    const servico = servicosInternos[0];
    const dataHoje = format(new Date(), 'yyyy-MM-dd');
    const horaTeste = '10:00'; // Hora fixa para teste

    addLog(`Tentando criar agendamento para Cliente: ${cliente.nome} (${cliente.id})`);
    addLog(`Serviço: ${servico.nome} (${servico.id})`);
    addLog(`Data: ${dataHoje} ${horaTeste}`);

    try {
      const novoAgendamento = {
        clienteId: cliente.id,
        servicoId: servico.id,
        data: dataHoje,
        hora: horaTeste,
        origem: 'manual',
        status: 'agendado',
        observacoes: 'Teste Automatizado Interno'
      };

      const result = await criarAgendamentoInterno(novoAgendamento);
      
      // O retorno pode variar dependendo da implementação, mas se não der erro, assumimos sucesso ou logamos o resultado
      addLog(`Resultado da criação: ${JSON.stringify(result)}`);
      toast.success("Teste de criação interna executado");
    } catch (error: any) {
      addLog(`ERRO ao criar agendamento interno: ${error.message}`);
      toast.error("Erro no teste interno");
    }
  };

  // --- Testes Públicos ---

  const testarListagemPublica = async () => {
    addLog(`--- TESTE PÚBLICO: LISTAGEM ---`);
    try {
      await carregarServicosPublicos();
      // O estado servicosPublicos será atualizado assincronamente, então logamos no próximo render ou aqui se possível
      addLog(`Função carregarServicosPublicos chamada.`);
    } catch (error: any) {
      addLog(`ERRO ao carregar serviços públicos: ${error.message}`);
    }
  };

  // Efeito para monitorar atualização dos serviços públicos
  useEffect(() => {
    if (servicosPublicos?.length > 0) {
      addLog(`Serviços públicos atualizados: ${servicosPublicos.length} encontrados.`);
    }
  }, [servicosPublicos]);

  const testarDisponibilidadePublica = async () => {
    addLog(`--- TESTE PÚBLICO: DISPONIBILIDADE ---`);
    
    if (!servicosPublicos?.length) {
      addLog(`ERRO: Carregue os serviços públicos primeiro.`);
      toast.error("Carregue serviços primeiro");
      return;
    }

    const servico = servicosPublicos[0];
    const dataHoje = format(new Date(), 'yyyy-MM-dd');

    addLog(`Verificando horários para: ${servico.nome} (${servico.id}) em ${dataHoje}`);

    try {
      const horarios = await calcularHorariosDisponiveis(servico.id, dataHoje);
      addLog(`Horários encontrados: ${horarios.length}`);
      if (horarios.length > 0) {
        addLog(`Exemplos: ${horarios.slice(0, 3).map(h => h.horario).join(', ')}...`);
      } else {
        addLog(`Nenhum horário disponível retornado.`);
      }
    } catch (error: any) {
      addLog(`ERRO ao verificar disponibilidade: ${error.message}`);
    }
  };

  const testarCriacaoPublica = async () => {
    addLog(`--- TESTE PÚBLICO: CRIAÇÃO ---`);

    if (!servicosPublicos?.length) {
      addLog(`ERRO: Carregue os serviços públicos primeiro.`);
      return;
    }

    const servico = servicosPublicos[0];
    const dataHoje = format(new Date(), 'yyyy-MM-dd');
    
    // Tenta pegar um horário válido primeiro
    let horarioTeste = '14:00';
    try {
      const horarios = await calcularHorariosDisponiveis(servico.id, dataHoje);
      if (horarios.length > 0) {
        horarioTeste = horarios[0].horario; // Pega o primeiro disponível
      } else {
        addLog(`AVISO: Nenhum horário disponível encontrado. Tentando forçar 14:00.`);
      }
    } catch (e) {
      addLog(`Erro ao buscar horário, usando fallback 14:00`);
    }

    addLog(`Tentando criar agendamento PÚBLICO em ${dataHoje} às ${horarioTeste}`);

    const dadosAgendamento = {
      servico_id: servico.id,
      data: dataHoje,
      horario: horarioTeste,
      nome_completo: "Teste Público Automatizado",
      telefone: "11999999999",
      email: "teste@exemplo.com",
      observacoes: "Criado via Painel de Teste"
    };

    try {
      const sucesso = await criarAgendamentoPublico(dadosAgendamento);
      if (sucesso) {
        addLog(`SUCESSO: Agendamento público criado!`);
        toast.success("Agendamento público criado");
      } else {
        addLog(`FALHA: criarAgendamento retornou false.`);
        toast.error("Falha na criação pública");
      }
    } catch (error: any) {
      addLog(`ERRO EXCEÇÃO na criação pública: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Painel de Teste de Integração</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coluna Esquerda: Hook Interno */}
        <Card>
          <CardHeader>
            <CardTitle>Hook Interno (useAgendamentos)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-md text-sm">
              <p>Status: {todosAgendamentos ? 'Carregado' : 'Carregando...'}</p>
              <p>Agendamentos: {todosAgendamentos?.length || 0}</p>
            </div>
            <Button onClick={testarListagemInterna} className="w-full">
              1. Testar Listagem (Log)
            </Button>
            <Button onClick={testarCriacaoInterna} variant="secondary" className="w-full">
              2. Testar Criação (Mock)
            </Button>
          </CardContent>
        </Card>

        {/* Coluna Direita: Hook Público */}
        <Card>
          <CardHeader>
            <CardTitle>Hook Público (useAgendamentoOnlineService)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 bg-muted rounded-md text-sm">
              <p>Serviços Públicos: {servicosPublicos?.length || 0}</p>
            </div>
            <Button onClick={testarListagemPublica} className="w-full">
              1. Carregar Serviços
            </Button>
            <Button onClick={testarDisponibilidadePublica} variant="outline" className="w-full">
              2. Verificar Disponibilidade (Hoje)
            </Button>
            <Button onClick={testarCriacaoPublica} variant="secondary" className="w-full">
              3. Testar Criação (Mock)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card className="h-96">
        <CardHeader>
          <CardTitle>Logs de Execução</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full rounded-md border p-4 font-mono text-sm">
            {logs.length === 0 ? (
              <span className="text-muted-foreground">Nenhum teste executado ainda...</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 border-b border-border/50 pb-1 last:border-0">
                  {log}
                </div>
              ))
            )}
          </ScrollArea>
          <Button onClick={() => setLogs([])} variant="ghost" size="sm" className="mt-2">
            Limpar Logs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TesteAgendamentosPage;
