import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Plus, Trash2, Save } from 'lucide-react';
import { useSupabaseConfiguracoes } from '@/hooks/useSupabaseConfiguracoes';
// import { DIAS_SEMANA } from '@/types/configuracao';
import { toast } from 'sonner';

const DIAS_SEMANA = [
  { id: 0, nome: 'Domingo', abrev: 'DOM' },
  { id: 1, nome: 'Segunda-feira', abrev: 'SEG' },
  { id: 2, nome: 'Terça-feira', abrev: 'TER' },
  { id: 3, nome: 'Quarta-feira', abrev: 'QUA' },
  { id: 4, nome: 'Quinta-feira', abrev: 'QUI' },
  { id: 5, nome: 'Sexta-feira', abrev: 'SEX' },
  { id: 6, nome: 'Sábado', abrev: 'SAB' },
];

interface HorarioFormData {
  dia_semana: number;
  ativo: boolean;
  horario_abertura: string;
  horario_fechamento: string;
  intervalo_inicio?: string;
  intervalo_fim?: string;
}

export function ConfiguracaoHorarios() {
  const { configuracaoHorarios, loading, salvarHorario, deletarHorario } = useSupabaseConfiguracoes();
  const [horariosForm, setHorariosForm] = useState<HorarioFormData[]>([]);

  // Inicializar formulário com dados existentes ou padrões
  useEffect(() => {
    if (configuracaoHorarios.length > 0) {
      setHorariosForm(configuracaoHorarios.map(h => ({
        dia_semana: h.dia_semana,
        ativo: h.ativo,
        horario_abertura: h.horario_abertura,
        horario_fechamento: h.horario_fechamento,
        intervalo_inicio: h.intervalo_inicio,
        intervalo_fim: h.intervalo_fim,
      })));
    } else {
      // Criar configurações padrão para todos os dias
      const horariosDefault = DIAS_SEMANA.map(dia => ({
        dia_semana: dia.id,
        ativo: dia.id >= 1 && dia.id <= 5, // Segunda a sexta ativo por padrão
        horario_abertura: '08:00',
        horario_fechamento: '18:00',
        intervalo_inicio: '12:00',
        intervalo_fim: '13:00',
      }));
      setHorariosForm(horariosDefault);
    }
  }, [configuracaoHorarios]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando configurações...</div>
        </CardContent>
      </Card>
    );
  }

  const handleDiaToggle = (diaSemana: number, ativo: boolean) => {
    setHorariosForm(prev => 
      prev.map(h => 
        h.dia_semana === diaSemana ? { ...h, ativo } : h
      )
    );
  };

  const handleHorarioChange = (diaSemana: number, campo: string, valor: string) => {
    setHorariosForm(prev => 
      prev.map(h => 
        h.dia_semana === diaSemana ? { ...h, [campo]: valor } : h
      )
    );
  };

  const salvarConfiguracao = async (diaSemana: number) => {
    const horario = horariosForm.find(h => h.dia_semana === diaSemana);
    if (!horario) return;

    try {
      if (horario.ativo && horario.horario_abertura >= horario.horario_fechamento) {
        toast.error('Horário de abertura deve ser menor que o de fechamento');
        return;
      }

      if (horario.intervalo_inicio && horario.intervalo_fim && 
          horario.intervalo_inicio >= horario.intervalo_fim) {
        toast.error('Horário de início do intervalo deve ser menor que o de fim');
        return;
      }

      await salvarHorario(horario);
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
    }
  };

  const salvarTodasConfiguracoes = async () => {
    try {
      for (const horario of horariosForm) {
        if (horario.ativo) {
          await salvarHorario(horario);
        }
      }
      toast.success('Todas as configurações foram salvas!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar algumas configurações');
    }
  };

  const getHorarioAtual = (diaSemana: number) => {
    return horariosForm.find(h => h.dia_semana === diaSemana);
  };

  return (
    <div className="space-y-6">
      {/* Resumo dos Dias Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumo dos Dias de Atendimento
          </CardTitle>
          <CardDescription>
            Visão geral dos dias em que você atenderá clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {DIAS_SEMANA.map((dia) => {
              const horario = getHorarioAtual(dia.id);
              const isAtivo = horario?.ativo || false;
              return (
                <Badge key={dia.id} variant={isAtivo ? "default" : "secondary"}>
                  {dia.abrev}
                  {isAtivo && horario && (
                    <span className="ml-1 text-xs opacity-75">
                      {horario.horario_abertura}-{horario.horario_fechamento}
                    </span>
                  )}
                </Badge>
              );
            })}
          </div>
          
          <Button onClick={salvarTodasConfiguracoes} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Salvar Todas as Configurações
          </Button>
        </CardContent>
      </Card>

      {/* Configuração Detalhada por Dia */}
      {DIAS_SEMANA.map((dia) => {
        const horario = getHorarioAtual(dia.id);
        if (!horario) return null;

        return (
          <Card key={dia.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {dia.nome}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={horario.ativo}
                    onCheckedChange={(checked) => handleDiaToggle(dia.id, checked)}
                  />
                  <Label className="text-sm">Ativo</Label>
                </div>
              </CardTitle>
              {horario.ativo && (
                <CardDescription>
                  Configure os horários de funcionamento para {dia.nome.toLowerCase()}
                </CardDescription>
              )}
            </CardHeader>
            
            {horario.ativo && (
              <CardContent className="space-y-4">
                {/* Horário de Funcionamento */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Horário de Funcionamento</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`abertura-${dia.id}`} className="text-xs">Abertura</Label>
                      <Input
                        id={`abertura-${dia.id}`}
                        type="time"
                        value={horario.horario_abertura}
                        onChange={(e) => handleHorarioChange(dia.id, 'horario_abertura', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`fechamento-${dia.id}`} className="text-xs">Fechamento</Label>
                      <Input
                        id={`fechamento-${dia.id}`}
                        type="time"
                        value={horario.horario_fechamento}
                        onChange={(e) => handleHorarioChange(dia.id, 'horario_fechamento', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Intervalo (Opcional) */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Intervalo (Opcional)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`intervalo-inicio-${dia.id}`} className="text-xs">Início do Intervalo</Label>
                      <Input
                        id={`intervalo-inicio-${dia.id}`}
                        type="time"
                        value={horario.intervalo_inicio || ''}
                        onChange={(e) => handleHorarioChange(dia.id, 'intervalo_inicio', e.target.value)}
                        placeholder="Ex: 12:00"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`intervalo-fim-${dia.id}`} className="text-xs">Fim do Intervalo</Label>
                      <Input
                        id={`intervalo-fim-${dia.id}`}
                        type="time"
                        value={horario.intervalo_fim || ''}
                        onChange={(e) => handleHorarioChange(dia.id, 'intervalo_fim', e.target.value)}
                        placeholder="Ex: 13:00"
                      />
                    </div>
                  </div>
                </div>

                {/* Resumo do Horário */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Funcionamento:</strong> {horario.horario_abertura} às {horario.horario_fechamento}
                    {horario.intervalo_inicio && horario.intervalo_fim && (
                      <span> (Intervalo: {horario.intervalo_inicio} às {horario.intervalo_fim})</span>
                    )}
                  </p>
                </div>

                {/* Botão Salvar Individual */}
                <Button 
                  onClick={() => salvarConfiguracao(dia.id)}
                  className="w-full"
                  variant="outline"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar {dia.nome}
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Informações de Ajuda */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Dicas de Configuração
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Os horários configurados serão respeitados nos formulários de agendamento</li>
            <li>• Intervalos bloqueiam automaticamente os horários para novos agendamentos</li>
            <li>• Você pode configurar horários diferentes para cada dia da semana</li>
            <li>• Dias inativos não aparecerão como opção para agendamentos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}