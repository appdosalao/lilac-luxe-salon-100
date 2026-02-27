import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Plus } from "lucide-react";
import { useServicos } from "@/hooks/useServicos";
import ServicosList from "@/components/servicos/ServicosList";
import ServicoForm from "@/components/servicos/ServicoForm";
import { Servico } from "@/types/servico";

type VisualizacaoAtual = 'lista' | 'formulario';

export default function Servicos() {
  const {
    servicos,
    filtros,
    setFiltros,
    criarServico,
    atualizarServico,
    excluirServico,
  } = useServicos();

  const [visualizacaoAtual, setVisualizacaoAtual] = useState<VisualizacaoAtual>('lista');
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);

  const handleNovoServico = () => {
    setServicoSelecionado(null);
    setVisualizacaoAtual('formulario');
  };

  const handleEditarServico = (servico: Servico) => {
    setServicoSelecionado(servico);
    setVisualizacaoAtual('formulario');
  };

  const handleSubmitFormulario = (data: any) => {
    const sucesso = servicoSelecionado
      ? atualizarServico(servicoSelecionado.id, data)
      : criarServico(data);

    if (sucesso) {
      setVisualizacaoAtual('lista');
      setServicoSelecionado(null);
    }
  };

  const handleVoltarParaLista = () => {
    setVisualizacaoAtual('lista');
    setServicoSelecionado(null);
  };

  if (visualizacaoAtual === 'formulario') {
    return (
      <div className="space-y-8">
        <ServicoForm
          servico={servicoSelecionado || undefined}
          onSubmit={handleSubmitFormulario}
          onCancel={handleVoltarParaLista}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 p-3 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">Serviços</h1>
          <p className="text-xs sm:text-base text-muted-foreground">
            Gerencie todos os serviços oferecidos pelo seu salão
          </p>
        </div>
        <Button 
          onClick={handleNovoServico}
          className="bg-gradient-to-r from-primary to-lilac-primary shadow-lg hover:shadow-xl transition-all duration-300 btn-touch"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
            <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-lilac-light">
              <Scissors className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">{servicos.length}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
            <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-lilac-primary to-pink-accent">
              <Scissors className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">
                R$ {servicos.length > 0 ? Math.min(...servicos.map(s => s.valor)).toFixed(2) : '0,00'}
              </p>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Menor Valor</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm col-span-2 sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
            <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-accent to-lavender">
              <Scissors className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">
                R$ {servicos.length > 0 ? Math.max(...servicos.map(s => s.valor)).toFixed(2) : '0,00'}
              </p>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Maior Valor</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Serviços */}
      <ServicosList
        servicos={servicos}
        filtros={filtros}
        onFiltrosChange={setFiltros}
        onEdit={handleEditarServico}
        onDelete={excluirServico}
      />
    </div>
  );
}