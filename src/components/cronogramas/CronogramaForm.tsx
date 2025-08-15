import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cronograma } from "@/types/cronograma";
import { useCronogramas } from "@/hooks/useCronogramas";
import { useDatabase } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";

interface CronogramaFormProps {
  cronograma?: Cronograma;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CronogramaForm({ cronograma, onSuccess, onCancel }: CronogramaFormProps) {
  const [formData, setFormData] = useState({
    cliente_id: cronograma?.cliente_id || '',
    servico_id: cronograma?.servico_id || '',
    data_inicio: cronograma?.data_inicio || '',
    hora_inicio: cronograma?.hora_inicio || '09:00',
    recorrencia: cronograma?.recorrencia || 'Semanal' as const,
    intervalo_dias: cronograma?.intervalo_dias || undefined,
    observacoes: cronograma?.observacoes || '',
    status: cronograma?.status || 'ativo' as const,
  });

  const { createCronograma, updateCronograma, loading } = useCronogramas();
  const { clientes, servicos } = useDatabase();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id || !formData.servico_id || !formData.data_inicio) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const cliente = clientes.find(c => c.id === formData.cliente_id);
    const servico = servicos.find(s => s.id === formData.servico_id);

    if (!cliente || !servico) {
      toast({
        title: "Erro",
        description: "Cliente ou serviço não encontrado.",
        variant: "destructive",
      });
      return;
    }

    // Calcular intervalo em dias baseado na recorrência
    let intervalo_dias = formData.intervalo_dias;
    if (formData.recorrencia === 'Semanal') intervalo_dias = 7;
    else if (formData.recorrencia === 'Quinzenal') intervalo_dias = 14;
    else if (formData.recorrencia === 'Mensal') intervalo_dias = 30;
    
    try {
      const cronogramaData = {
        cliente_id: formData.cliente_id,
        cliente_nome: cliente.nomeCompleto,
        servico_id: formData.servico_id,
        tipo_servico: servico.nome,
        data_inicio: formData.data_inicio,
        hora_inicio: formData.hora_inicio,
        duracao_minutos: servico.duracao,
        recorrencia: formData.recorrencia,
        intervalo_dias,
        observacoes: formData.observacoes,
        status: formData.status,
      };

      if (cronograma) {
        await updateCronograma(cronograma.id_cronograma, cronogramaData);
        toast({
          title: "Cronograma atualizado",
          description: "O cronograma foi atualizado com sucesso.",
        });
      } else {
        await createCronograma(cronogramaData);
        toast({
          title: "Cronograma criado",
          description: "O cronograma foi criado com sucesso.",
        });
      }
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o cronograma.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {cronograma ? 'Editar Cronograma' : 'Novo Cronograma'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <Select value={formData.cliente_id} onValueChange={(value) => handleChange('cliente_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.filter(cliente => cliente.id && cliente.id.trim() !== '').map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nomeCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico_id">Serviço *</Label>
              <Select value={formData.servico_id} onValueChange={(value) => handleChange('servico_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.filter(servico => servico.id && servico.id.trim() !== '').map((servico) => (
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
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => handleChange('data_inicio', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Horário de Início *</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => handleChange('hora_inicio', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recorrencia">Recorrência *</Label>
              <Select value={formData.recorrencia} onValueChange={(value) => handleChange('recorrencia', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a recorrência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semanal">Semanal (7 dias)</SelectItem>
                  <SelectItem value="Quinzenal">Quinzenal (14 dias)</SelectItem>
                  <SelectItem value="Mensal">Mensal (30 dias)</SelectItem>
                  <SelectItem value="Personalizada">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.recorrencia === 'Personalizada' && (
              <div className="space-y-2">
                <Label htmlFor="intervalo_dias">Intervalo (dias)</Label>
                <Input
                  id="intervalo_dias"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.intervalo_dias || ''}
                  onChange={(e) => handleChange('intervalo_dias', parseInt(e.target.value) || undefined)}
                  placeholder="Ex: 21 dias"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
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