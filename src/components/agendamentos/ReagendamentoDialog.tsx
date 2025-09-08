import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Agendamento } from '@/types/agendamento';
import { toast } from 'sonner';

interface ReagendamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: Agendamento | null;
  onReagendar: (agendamentoId: string, novoData: string, novoHora: string) => Promise<boolean>;
  verificarConflito: (agendamento: any, excluirId?: string) => boolean;
}

export default function ReagendamentoDialog({
  open,
  onOpenChange,
  agendamento,
  onReagendar,
  verificarConflito,
}: ReagendamentoDialogProps) {
  const [novaData, setNovaData] = useState('');
  const [novaHora, setNovaHora] = useState('');
  const [loading, setLoading] = useState(false);

  if (!agendamento) return null;

  const formatarData = (data: string) => {
    return format(new Date(data + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR });
  };

  const formatarHora = (hora: string) => {
    return hora.slice(0, 5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaData || !novaHora) {
      toast.error('Preencha a nova data e horário');
      return;
    }

    // Verificar se é diferente do agendamento atual
    if (novaData === agendamento.data && novaHora === agendamento.hora) {
      toast.error('A nova data e horário devem ser diferentes do atual');
      return;
    }

    // Verificar conflito de horário
    const agendamentoTeste = {
      data: novaData,
      hora: novaHora,
      duracao: agendamento.duracao,
    };

    if (verificarConflito(agendamentoTeste, agendamento.id)) {
      toast.error('Já existe um agendamento neste horário');
      return;
    }

    setLoading(true);
    
    try {
      const sucesso = await onReagendar(agendamento.id, novaData, novaHora);
      
      if (sucesso) {
        toast.success('Agendamento reagendado com sucesso!');
        onOpenChange(false);
        setNovaData('');
        setNovaHora('');
      } else {
        toast.error('Erro ao reagendar agendamento');
      }
    } catch (error) {
      toast.error('Erro ao reagendar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNovaData('');
    setNovaHora('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Reagendar Agendamento
          </DialogTitle>
          <DialogDescription>
            Altere a data e horário do agendamento selecionado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações atuais do agendamento */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">{agendamento.clienteNome}</h4>
                  <Badge className="bg-blue-500 text-white">
                    <Calendar className="h-3 w-3 mr-1" />
                    Agendado
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatarData(agendamento.data)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatarHora(agendamento.hora)}</span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">Serviço:</span> {agendamento.servicoNome}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campos para nova data e horário */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nova-data" className="text-sm font-medium">
                Nova Data
              </Label>
              <Input
                id="nova-data"
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nova-hora" className="text-sm font-medium">
                Nova Hora
              </Label>
              <Input
                id="nova-hora"
                type="time"
                value={novaHora}
                onChange={(e) => setNovaHora(e.target.value)}
                step="300" // 5 minutos
                required
              />
            </div>
          </div>

          {/* Preview da nova data/hora */}
          {novaData && novaHora && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <RefreshCw className="h-4 w-4" />
                  <span className="font-medium">Novo agendamento:</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-green-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatarData(novaData)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatarHora(novaHora)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
              disabled={loading || !novaData || !novaHora}
              className="bg-gradient-to-r from-primary to-lilac-primary"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Reagendando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reagendar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}