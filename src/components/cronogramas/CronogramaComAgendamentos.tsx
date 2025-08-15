import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Clock, Users } from "lucide-react";
import { Cronograma } from "@/types/cronograma";
import { Agendamento } from "@/types/agendamento";
import { toast } from "@/hooks/use-toast";
import { useIntegracaoCronograma } from "@/hooks/useIntegracaoCronograma";

interface CronogramaComAgendamentosProps {
  cronograma?: Cronograma;
  clientes: Array<{ id: string; nome: string }>;
  servicos: Array<{ id: string; nome: string; duracao: number; valor: number }>;
  agendamentosExistentes: Agendamento[];
  onGerarAgendamentos: (agendamentos: Agendamento[]) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CronogramaComAgendamentos({
  cronograma,
  clientes,
  servicos,
  agendamentosExistentes,
  onGerarAgendamentos,
  onSuccess,
  onCancel,
}: CronogramaComAgendamentosProps) {
  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [numeroSessoes, setNumeroSessoes] = useState(4);
  const [loading, setLoading] = useState(false);

  const { gerarAgendamentosCronograma } = useIntegracaoCronograma();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cronograma || !clienteId || !servicoId || !dataInicio) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const cliente = clientes.find(c => c.id === clienteId);
    const servico = servicos.find(s => s.id === servicoId);

    if (!cliente || !servico) {
      toast({
        title: "Erro",
        description: "Cliente ou serviço não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const dadosAgendamento = {
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        servicoId: servico.id,
        servicoNome: servico.nome,
        data: dataInicio,
        duracao: servico.duracao,
        valor: servico.valor,
        cronogramaId: cronograma.id_cronograma,
      };

      const agendamentosGerados = gerarAgendamentosCronograma(
        cronograma,
        dadosAgendamento,
        dataInicio,
        numeroSessoes,
        agendamentosExistentes
      );

      onGerarAgendamentos(agendamentosGerados);
      
      toast({
        title: "Cronograma ativado",
        description: `${agendamentosGerados.length} agendamentos foram criados automaticamente.`,
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar agendamentos do cronograma.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Ativar Cronograma: {cronograma?.tipo_servico}
        </CardTitle>
        <CardDescription>
          Configure os detalhes para gerar agendamentos automáticos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico">Serviço *</Label>
              <Select value={servicoId} onValueChange={setServicoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.map((servico) => (
                    <SelectItem key={servico.id} value={servico.id}>
                      {servico.nome} - {servico.duracao}min - R$ {servico.valor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroSessoes">Número de Sessões</Label>
              <Input
                id="numeroSessoes"
                type="number"
                min="1"
                max="20"
                value={numeroSessoes}
                onChange={(e) => setNumeroSessoes(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {cronograma && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Resumo do Cronograma
              </h4>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Intervalo:</strong> A cada {cronograma.intervalo_dias} dias
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Descrição:</strong> {cronograma.observacoes || "Sem observações"}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Sessões:</strong> {numeroSessoes} agendamentos serão criados
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Gerar Agendamentos
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}