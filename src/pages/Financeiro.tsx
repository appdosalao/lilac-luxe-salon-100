import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Receipt, AlertTriangle, FileText, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useDatabase } from "@/hooks/useDatabase";
import { useContasFixas } from "@/hooks/useContasFixas";
import { Lancamento, NovoLancamento } from "@/types/lancamento";
import { ContaFixa, NovaContaFixa } from "@/types/contaFixa";
import ResumoFinanceiro from "@/components/financeiro/ResumoFinanceiro";
import LancamentosList from "@/components/financeiro/LancamentosList";
import LancamentoForm from "@/components/financeiro/LancamentoForm";
import GraficoFinanceiro from "@/components/financeiro/GraficoFinanceiro";
import TabelaPagamentosClientes from "@/components/financeiro/TabelaPagamentosClientes";
import ContasFixasList from "@/components/financeiro/ContasFixasList";
import ContaFixaForm from "@/components/financeiro/ContaFixaForm";
import ContasReceber from "@/components/financeiro/ContasReceber";
import RelatoriosFinanceiros from "@/components/financeiro/RelatoriosFinanceiros";
import AvisosVencimento from "@/components/financeiro/AvisosVencimento";

type ViewMode = 'list' | 'form';
type FormType = 'lancamento' | 'conta_fixa';

export default function Financeiro() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [formType, setFormType] = useState<FormType>('lancamento');
  const [lancamentoEditando, setLancamentoEditando] = useState<Lancamento | undefined>();
  const [contaEditando, setContaEditando] = useState<ContaFixa | undefined>();
  
  const {
    lancamentos,
    resumoFinanceiro,
    categorias,
    filtros,
    setFiltros,
    adicionarLancamento,
    atualizarLancamento,
    removerLancamento,
  } = useLancamentos();

  const { agendamentos } = useDatabase();
  const { 
    contasFixas, 
    categorias: categoriasContasFixas, 
    criarContaFixa, 
    atualizarContaFixa, 
    removerContaFixa, 
    pagarContaFixa,
    toggleAtiva,
    estatisticas: estatisticasContasFixas 
  } = useContasFixas();

  const handleNovoLancamento = () => {
    setLancamentoEditando(undefined);
    setFormType('lancamento');
    setViewMode('form');
  };

  const handleNovaContaFixa = () => {
    setContaEditando(undefined);
    setFormType('conta_fixa');
    setViewMode('form');
  };

  const handleEditarLancamento = (lancamento: Lancamento) => {
    setLancamentoEditando(lancamento);
    setViewMode('form');
  };

  const handleSubmitLancamento = async (data: NovoLancamento) => {
    if (lancamentoEditando) {
      await atualizarLancamento(lancamentoEditando.id, data);
    } else {
      await adicionarLancamento(data);
    }
    setViewMode('list');
    setLancamentoEditando(undefined);
  };

  const handleSubmitContaFixa = async (data: NovaContaFixa) => {
    if (contaEditando) {
      await atualizarContaFixa(contaEditando.id, data);
    } else {
      await criarContaFixa(data);
    }
    setViewMode('list');
    setContaEditando(undefined);
  };

  const handleCancelarForm = () => {
    setViewMode('list');
    setLancamentoEditando(undefined);
    setContaEditando(undefined);
  };

  if (viewMode === 'form') {
    if (formType === 'lancamento') {
      return (
        <div className="space-y-6">
          <LancamentoForm
            lancamento={lancamentoEditando}
            categorias={categorias}
            onSubmit={handleSubmitLancamento}
            onCancel={handleCancelarForm}
          />
        </div>
      );
    } else {
      return (
        <div className="space-y-6">
          <ContaFixaForm
            conta={contaEditando}
            categorias={categoriasContasFixas}
            onSubmit={handleSubmitContaFixa}
            onCancel={handleCancelarForm}
          />
        </div>
      );
    }
  }

  return (
    <div className="space-responsive-lg">
      {/* Header */}
      <div className="flex-responsive flex-responsive-row-md items-start justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-responsive-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-responsive-base text-muted-foreground mt-2">
            Controle completo das finanças do seu salão
          </p>
        </div>
      </div>

      {/* Avisos de Vencimento */}
      <AvisosVencimento 
        contasFixas={contasFixas} 
        onPagarConta={pagarContaFixa}
      />

      {/* Resumo Financeiro */}
      <ResumoFinanceiro resumo={resumoFinanceiro} />

      {/* Abas do Sistema Financeiro */}
      <Tabs defaultValue="lancamentos" className="space-responsive-lg">
        <div className="overflow-responsive">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
            <TabsTrigger value="lancamentos" className="text-responsive-xs">
              Lançamentos
            </TabsTrigger>
            <TabsTrigger value="contas-fixas" className="text-responsive-xs">
              Contas Fixas
            </TabsTrigger>
            <TabsTrigger value="contas-receber" className="text-responsive-xs">
              A Receber
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="text-responsive-xs">
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="graficos" className="text-responsive-xs">
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="text-responsive-xs">
              Relatórios
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lancamentos" className="space-responsive-lg">
          <div className="flex-responsive flex-responsive-row-sm items-start justify-between gap-4">
            <h2 className="text-responsive-xl font-semibold">Lançamentos Financeiros</h2>
            <Button 
              onClick={handleNovoLancamento}
              className="bg-gradient-to-r from-primary to-lilac-primary btn-touch flex-shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Lançamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
          
          <LancamentosList
            lancamentos={lancamentos}
            filtros={filtros}
            categorias={categorias}
            onFiltrosChange={setFiltros}
            onEdit={handleEditarLancamento}
            onDelete={removerLancamento}
          />
        </TabsContent>

        <TabsContent value="contas-fixas" className="space-responsive-lg">
          <div className="flex-responsive flex-responsive-row-sm items-start justify-between gap-4">
            <h2 className="text-responsive-xl font-semibold">Contas Fixas Mensais</h2>
            <Button 
              onClick={handleNovaContaFixa}
              className="bg-gradient-to-r from-primary to-lilac-primary btn-touch flex-shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Conta Fixa</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
          
          <ContasFixasList
            contas={contasFixas}
            categorias={categoriasContasFixas}
            onEdit={(conta) => {
              setContaEditando(conta);
              setFormType('conta_fixa');
              setViewMode('form');
            }}
            onDelete={removerContaFixa}
            onPagar={pagarContaFixa}
            onToggleAtiva={toggleAtiva}
          />
        </TabsContent>

        <TabsContent value="contas-receber" className="space-responsive-lg">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-6 w-6 flex-shrink-0" />
            <h2 className="text-responsive-xl font-semibold">Contas a Receber</h2>
          </div>
          
          <ContasReceber agendamentos={agendamentos} />
        </TabsContent>

        <TabsContent value="pagamentos" className="space-responsive-lg">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-6 w-6 flex-shrink-0" />
            <h2 className="text-responsive-xl font-semibold">Pagamentos dos Clientes</h2>
          </div>
          
          <TabelaPagamentosClientes agendamentos={agendamentos} />
        </TabsContent>

        <TabsContent value="graficos" className="space-responsive-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 flex-shrink-0" />
            <h2 className="text-responsive-xl font-semibold">Gráficos e Análises</h2>
          </div>
          
          <GraficoFinanceiro lancamentos={lancamentos} />
        </TabsContent>

        <TabsContent value="relatorios" className="space-responsive-lg">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-6 w-6 flex-shrink-0" />
            <h2 className="text-responsive-xl font-semibold">Relatórios Financeiros</h2>
          </div>
          
          <RelatoriosFinanceiros 
            lancamentos={lancamentos}
            contasFixas={contasFixas}
            agendamentos={agendamentos}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}