import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cronograma } from "@/types/cronograma";
import { useCronogramas } from "@/hooks/useCronogramas";
import { useSupabaseClientes } from "@/hooks/useSupabaseClientes";
import { useServicos } from "@/hooks/useServicos";
import { toast } from "sonner";

interface CronogramaFormProps {
  cronograma?: Cronograma;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CronogramaForm({ cronograma, onSuccess, onCancel }: CronogramaFormProps) {
  const [formData, setFormData] = useState({
    clienteId: cronograma?.clienteId || '',
    servicoId: cronograma?.servicoId || '',
    titulo: cronograma?.titulo || '',
    descricao: cronograma?.descricao || '',
    diaSemana: cronograma?.diaSemana || 1, // Segunda-feira
    horaInicio: cronograma?.horaInicio || '09:00',
    horaFim: cronograma?.horaFim || '10:00',
    recorrencia: cronograma?.recorrencia || 'semanal',
    dataInicio: cronograma?.dataInicio || '',
    dataFim: cronograma?.dataFim || '',
    ativo: cronograma?.ativo ?? true,
    observacoes: cronograma?.observacoes || '',
  });

  const { createCronograma, updateCronograma, loading } = useCronogramas();
  const { clientes } = useSupabaseClientes();
  const { todosServicos: servicos } = useServicos();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clienteId || !formData.servicoId || !formData.titulo || !formData.dataInicio) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const cliente = clientes.find(c => c.id === formData.clienteId);
    const servico = servicos.find(s => s.id === formData.servicoId);

    if (!cliente || !servico) {
      toast.error('Cliente ou serviço não encontrado.');
      return;
    }
    
    try {
      const cronogramaData = {
        clienteId: formData.clienteId,
        servicoId: formData.servicoId,
        titulo: formData.titulo,
        descricao: formData.descricao,
        diaSemana: formData.diaSemana,
        horaInicio: formData.horaInicio,
        horaFim: formData.horaFim,
        recorrencia: formData.recorrencia,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim,
        ativo: formData.ativo,
        observacoes: formData.observacoes,
      };

      if (cronograma) {
        await updateCronograma(cronograma.id, cronogramaData);
        toast.success('Cronograma atualizado com sucesso!');
      } else {
        await createCronograma(cronogramaData);
        toast.success('Cronograma criado com sucesso!');
      }
      onSuccess?.();
    } catch (error) {
      toast.error('Ocorreu um erro ao salvar o cronograma.');
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const diasSemana = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {cronograma ? 'Editar Cronograma' : 'Novo Cronograma'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Ex: Retorno mensal da Maria"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clienteId">Cliente *</Label>
              <Select value={formData.clienteId} onValueChange={(value) => handleChange('clienteId', value)}>
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
              <Label htmlFor="servicoId">Serviço *</Label>
              <Select value={formData.servicoId} onValueChange={(value) => handleChange('servicoId', value)}>
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

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Descreva o cronograma..."
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="diaSemana">Dia da Semana *</Label>
              <Select value={formData.diaSemana.toString()} onValueChange={(value) => handleChange('diaSemana', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {diasSemana.map((dia) => (
                    <SelectItem key={dia.value} value={dia.value.toString()}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recorrencia">Recorrência *</Label>
              <Select value={formData.recorrencia} onValueChange={(value) => handleChange('recorrencia', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a recorrência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Horário de Início *</Label>
              <Input
                id="horaInicio"
                type="time"
                value={formData.horaInicio}
                onChange={(e) => handleChange('horaInicio', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horaFim">Horário de Fim *</Label>
              <Input
                id="horaFim"
                type="time"
                value={formData.horaFim}
                onChange={(e) => handleChange('horaFim', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={formData.dataInicio}
                onChange={(e) => handleChange('dataInicio', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={formData.dataFim}
                onChange={(e) => handleChange('dataFim', e.target.value)}
                min={formData.dataInicio}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Observações sobre o cronograma..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (cronograma ? 'Atualizar' : 'Criar')}
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