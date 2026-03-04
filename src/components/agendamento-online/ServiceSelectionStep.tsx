import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertCircle } from 'lucide-react';
import { AgendamentoOnlineData, HorarioDisponivel, FormErrors } from '@/types/agendamento-online';

interface ServiceSelectionStepProps {
  formData: AgendamentoOnlineData;
  errors: FormErrors;
  servicos: any[];
  dataMinima: string;
  dataMaxima: string;
  isDataDisponivel: (data: string) => boolean;
  handleInputChange: (field: string, value: string) => void;
  horariosDisponiveis: HorarioDisponivel[];
  servicoSelecionado: any;
}

export function ServiceSelectionStep({
  formData,
  errors,
  servicos,
  dataMinima,
  dataMaxima,
  isDataDisponivel,
  handleInputChange,
  horariosDisponiveis,
  servicoSelecionado
}: ServiceSelectionStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Agendamento
      </h3>

      <div>
        <Label htmlFor="servico_id">Serviço *</Label>
        <Select onValueChange={(value) => handleInputChange('servico_id', value)}>
          <SelectTrigger className={errors.servico_id ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione um serviço" />
          </SelectTrigger>
          <SelectContent>
            {servicos.map((servico) => (
              <SelectItem key={servico.id} value={servico.id}>
                {servico.nome} - R$ {servico.valor.toFixed(2)} ({servico.duracao}min)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.servico_id && (
          <span className="text-sm text-destructive">{errors.servico_id}</span>
        )}
      </div>

      <div>
        <Label htmlFor="data">Data *</Label>
        <Input
          id="data"
          type="date"
          min={dataMinima}
          max={dataMaxima}
          value={formData.data}
          onChange={(e) => handleInputChange('data', e.target.value)}
          className={errors.data ? 'border-destructive' : ''}
        />
        {errors.data && (
          <span className="text-sm text-destructive">{errors.data}</span>
        )}
        {formData.data && !isDataDisponivel(formData.data) && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta data não está disponível para agendamentos. Escolha outro dia.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div>
        <Label htmlFor="horario">Horário *</Label>
        <Select
          onValueChange={(value) => handleInputChange('horario', value)}
          disabled={!formData.servico_id || !formData.data || !isDataDisponivel(formData.data)}
        >
          <SelectTrigger className={errors.horario ? 'border-destructive' : ''}>
            <SelectValue placeholder={
              !formData.servico_id || !formData.data
                ? "Selecione um serviço e data primeiro"
                : !isDataDisponivel(formData.data)
                ? "Data indisponível"
                : horariosDisponiveis.length === 0
                ? "Nenhum horário disponível"
                : "Selecione um horário"
            } />
          </SelectTrigger>
          <SelectContent>
            {horariosDisponiveis.length > 0 ? (
              horariosDisponiveis.map((horario) => (
                <SelectItem
                  key={horario.horario}
                  value={horario.horario}
                  disabled={!horario.disponivel}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{horario.horario}</span>
                    {!horario.disponivel && (
                      <span className="text-xs text-muted-foreground ml-2">(Ocupado)</span>
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                Nenhum horário disponível
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {errors.horario && (
          <span className="text-sm text-destructive">{errors.horario}</span>
        )}
        {servicoSelecionado && (
          <p className="text-sm text-muted-foreground mt-1">
            Duração do serviço: {servicoSelecionado.duracao} minutos
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => handleInputChange('observacoes', e.target.value)}
          placeholder="Alguma observação ou preferência?"
          rows={3}
        />
      </div>
    </div>
  );
}
