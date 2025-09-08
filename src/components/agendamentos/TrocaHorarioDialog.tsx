import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, ArrowLeftRight, User, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Agendamento } from '@/types/agendamento';
import { toast } from 'sonner';

interface TrocaHorarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: Agendamento | null;
  agendamentosDisponiveis: Agendamento[];
  onTrocarHorarios: (agendamento1Id: string, agendamento2Id: string) => Promise<boolean>;
}

export default function TrocaHorarioDialog({
  open,
  onOpenChange,
  agendamento,
  agendamentosDisponiveis,
  onTrocarHorarios,
}: TrocaHorarioDialogProps) {
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!agendamento) return null;

  const formatarData = (data: string) => {
    return format(new Date(data + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR });
  };

  const formatarHora = (hora: string) => {
    return hora.slice(0, 5);
  };

  const formatarDuracao = (duracao: number) => {
    const horas = Math.floor(duracao / 60);
    const minutos = duracao % 60;
    
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${minutos}min`;
    }
  };

  // Filtrar agendamentos disponíveis (excluir o atual e apenas agendados)
  // Também verificar se as durações são compatíveis ou se não há conflitos
  const agendamentosParaTroca = agendamentosDisponiveis.filter(
    ag => ag.id !== agendamento.id && ag.status === 'agendado'
  );

  const agendamentoParaTrocar = agendamentosParaTroca.find(
    ag => ag.id === agendamentoSelecionado
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agendamentoSelecionado) {
      toast.error('Selecione um agendamento para trocar');
      return;
    }

    setLoading(true);
    
    try {
      const sucesso = await onTrocarHorarios(agendamento.id, agendamentoSelecionado);
      
      if (sucesso) {
        toast.success('Horários trocados com sucesso!');
        onOpenChange(false);
        setAgendamentoSelecionado('');
      } else {
        toast.error('Erro ao trocar horários');
      }
    } catch (error) {
      toast.error('Erro ao trocar horários');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAgendamentoSelecionado('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Trocar Horários
          </DialogTitle>
          <DialogDescription>
            Selecione outro agendamento para trocar os horários
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agendamento atual */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Agendamento atual:</Label>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-lilac-light/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{agendamento.clienteNome}</h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Scissors className="h-3 w-3" />
                        <span>{agendamento.servicoNome}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatarData(agendamento.data)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatarHora(agendamento.hora)} - {formatarDuracao(agendamento.duracao)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seleção do agendamento para trocar */}
          <div className="space-y-2">
            <Label htmlFor="agendamento-troca" className="text-sm font-medium">
              Trocar com:
            </Label>
            <Select
              value={agendamentoSelecionado}
              onValueChange={setAgendamentoSelecionado}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um agendamento" />
              </SelectTrigger>
              <SelectContent>
                {agendamentosParaTroca.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhum agendamento disponível para troca
                  </div>
                ) : (
                  agendamentosParaTroca.map((ag) => (
                    <SelectItem key={ag.id} value={ag.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ag.clienteNome}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-sm">{formatarData(ag.data)} {formatarHora(ag.hora)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatarDuracao(ag.duracao)}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Preview da troca */}
          {agendamentoParaTrocar && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <ArrowLeftRight className="h-6 w-6 text-primary" />
              </div>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-700 text-center">
                      Preview da troca
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Agendamento 1 vai para horário 2 */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-green-600">
                          {agendamento.clienteNome} vai para:
                        </div>
                        <div className="text-sm text-green-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatarData(agendamentoParaTrocar.data)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatarHora(agendamentoParaTrocar.hora)} - {formatarDuracao(agendamentoParaTrocar.duracao)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Agendamento 2 vai para horário 1 */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-green-600">
                          {agendamentoParaTrocar.clienteNome} vai para:
                        </div>
                        <div className="text-sm text-green-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatarData(agendamento.data)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatarHora(agendamento.hora)} - {formatarDuracao(agendamento.duracao)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !agendamentoSelecionado}
              className="bg-gradient-to-r from-primary to-lilac-primary"
            >
              {loading ? (
                <>
                  <ArrowLeftRight className="mr-2 h-4 w-4 animate-spin" />
                  Trocando...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Trocar Horários
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}