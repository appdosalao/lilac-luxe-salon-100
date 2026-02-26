import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, Receipt, AlertTriangle, FileText, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useContasFixas } from "@/hooks/useContasFixas";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Lancamento, NovoLancamento } from "@/types/lancamento";
import { ContaFixa, NovaContaFixa } from "@/types/contaFixa";
import ResumoFinanceiro from "@/components/financeiro/ResumoFinanceiro";
import LancamentosList from "@/components/financeiro/LancamentosList";
import { LancamentosListMobile } from "@/components/financeiro/LancamentosListMobile";
import { ContasFixasListMobile } from "@/components/financeiro/ContasFixasListMobile";
import LancamentoForm from "@/components/financeiro/LancamentoForm";
import GraficoFinanceiro from "@/components/financeiro/GraficoFinanceiro";
import TabelaPagamentosClientes from "@/components/financeiro/TabelaPagamentosClientes";
import ContasFixasList from "@/components/financeiro/ContasFixasList";
import ContaFixaForm from "@/components/financeiro/ContaFixaForm";
import ContasReceber from "@/components/financeiro/ContasReceber";
import RelatoriosAvancados from "@/components/financeiro/RelatoriosAvancados";
import AvisosVencimento from "@/components/financeiro/AvisosVencimento";
import MovimentacoesProdutos from "@/components/financeiro/MovimentacoesProdutos";

type ViewMode = 'list' | 'form';
type FormType = 'lancamento' | 'conta_fixa';

export default function Financeiro() {
  const { isMobile } = useBreakpoint();
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

  // TODO: Integrar com useSupabaseAgendamentos quando necessário
  const agendamentos: any[] = [];
  
  const { 
    contasFixas, 
    categorias: categoriasContasFixas, 
    criarContaFixa, 
    atualizarContaFixa, 
    removerContaFixa, 
    pagarContaFixa,
    toggleAtiva,
    criarCategoria,
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
            categorias={categorias.map(c => c.nome)}
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
            onCreateCategoria={async (nome: string, cor?: string) => {
              await criarCategoria({ nome, tipo: 'despesa', cor });
            }}
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
        onPagarConta={(contaId: string) => pagarContaFixa(contaId)}
      />

      {/* Resumo Financeiro */}
      <ResumoFinanceiro resumo={resumoFinanceiro} />

      {/* Abas do Sistema Financeiro */}
      <Tabs defaultValue="lancamentos" className="space-responsive-lg">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto w-max min-w-full md:w-full md:grid md:grid-cols-7 gap-1 p-1">
            <TabsTrigger 
              value="lancamentos" 
              className="text-responsive-xs whitespace-nowrap min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Receipt className="mr-1 h-4 w-4 md:hidden" />
              Lançamentos
            </TabsTrigger>
            <TabsTrigger 
              value="contas-fixas" 
              className="text-responsive-xs whitespace-nowrap min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <AlertTriangle className="mr-1 h-4 w-4 md:hidden" />
              Contas Fixas
            </TabsTrigger>
            <TabsTrigger 
              value="produtos" 
              className="text-responsive-xs whitespace-nowrap min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <FileText className="mr-1 h-4 w-4 md:hidden" />
              Produtos
            </TabsTrigger>
            <TabsTrigger 
              value="contas-receber" 
              className="text-responsive-xs whitespace-nowrap min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Users className="mr-1 h-4 w-4 md:hidden" />
              A Receber
            </TabsTrigger>
            <TabsTrigger 
              value="pagamentos" 
              className="text-responsive-xs whitespace-nowrap min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Receipt className="mr-1 h-4 w-4 md:hidden" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger 
              value="graficos" 
              className="text-responsive-xs whitespace-nowrap min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <TrendingUp className="mr-1 h-4 w-4 md:hidden" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger 
              value="relatorios" 
              className="text-responsive-xs whitespace-nowrap min-h-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <FileText className="mr-1 h-4 w-4 md:hidden" />
              Relatórios
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="md:hidden" />
        </ScrollArea>

        <TabsContent value="lancamentos" className="space-responsive-lg animate-fade-in">
          <div className="flex-responsive flex-responsive-row-sm items-start justify-between gap-4">
            <h2 className="text-responsive-xl font-semibold">Lançamentos Financeiros</h2>
            <Button 
              onClick={handleNovoLancamento}
              className="bg-gradient-to-r from-primary to-lilac-primary btn-touch flex-shrink-0 hover-scale"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Lançamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
          
          {isMobile ? (
            <LancamentosListMobile
              lancamentos={lancamentos}
              onEdit={handleEditarLancamento}
              onDelete={removerLancamento}
            />
          ) : (
            <LancamentosList
              lancamentos={lancamentos}
              filtros={filtros}
              categorias={categorias.map(c => c.nome)}
              onFiltrosChange={setFiltros}
              onEdit={handleEditarLancamento}
              onDelete={removerLancamento}
            />
          )}
        </TabsContent>

        <TabsContent value="contas-fixas" className="space-responsive-lg animate-fade-in">
          <div className="flex-responsive flex-responsive-row-sm items-start justify-between gap-4">
            <h2 className="text-responsive-xl font-semibold">Contas Fixas Mensais</h2>
            <Button 
              onClick={handleNovaContaFixa}
              className="bg-gradient-to-r from-primary to-lilac-primary btn-touch flex-shrink-0 hover-scale"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Conta Fixa</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
          
          {isMobile ? (
            <ContasFixasListMobile
              contas={contasFixas}
              onEdit={(conta) => {
                setContaEditando(conta);
                setFormType('conta_fixa');
                setViewMode('form');
              }}
              onDelete={removerContaFixa}
              onPagar={pagarContaFixa}
              onToggleAtiva={toggleAtiva}
            />
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="produtos" className="space-responsive-lg animate-fade-in">
          <h2 className="text-responsive-xl font-semibold mb-4">Movimentações de Produtos</h2>
          <MovimentacoesProdutos />
        </TabsContent>

        <TabsContent value="contas-receber" className="space-responsive-lg animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-6 w-6 flex-shrink-0" />
            <h2 className="text-responsive-xl font-semibold">Contas a Receber</h2>
          </div>
          
          <ContasReceber agendamentos={agendamentos} />
        </TabsContent>

        <TabsContent value="pagamentos" className="space-responsive-lg animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-6 w-6 flex-shrink-0" />
            <h2 className="text-responsive-xl font-semibold">Pagamentos dos Clientes</h2>
          </div>
          
          <TabelaPagamentosClientes agendamentos={agendamentos} />
        </TabsContent>

        <TabsContent value="graficos" className="space-responsive-lg animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 flex-shrink-0" />
            <h2 className="text-responsive-xl font-semibold">Gráficos e Análises</h2>
          </div>
          
          <GraficoFinanceiro lancamentos={lancamentos} />
        </TabsContent>

        <TabsContent value="relatorios" className="space-responsive-lg animate-fade-in">
          <RelatoriosAvancados />
        </TabsContent>
      </Tabs>
    </div>
  );
}