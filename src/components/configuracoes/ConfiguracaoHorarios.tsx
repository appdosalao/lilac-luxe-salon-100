import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Plus, Trash2 } from 'lucide-react';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import type { IntervaloTrabalho } from '@/types/configuracao';
import { toast } from '@/hooks/use-toast';

export function ConfiguracaoHorarios() {
  const { configuracoes, updateConfiguracoes, loading } = useConfiguracoes();
  const [novoIntervalo, setNovoIntervalo] = useState<IntervaloTrabalho>({
    inicio: '',
    termino: '',
    descricao: '',
  });

  if (loading || !configuracoes) {
    return <div>Carregando configurações...</div>;
  }

  const diasSemana = [
    { key: 'domingo', label: 'Domingo' },
    { key: 'segunda', label: 'Segunda' },
    { key: 'terca', label: 'Terça' },
    { key: 'quarta', label: 'Quarta' },
    { key: 'quinta', label: 'Quinta' },
    { key: 'sexta', label: 'Sexta' },
    { key: 'sabado', label: 'Sábado' },
  ];

  const handleDiaToggle = (dia: string, ativo: boolean) => {
    updateConfiguracoes({
      horarios: {
        ...configuracoes.horarios,
        diasAtivos: {
          ...configuracoes.horarios.diasAtivos,
          [dia]: ativo,
        },
      },
    });
  };

  const handleHorarioExpedienteChange = (campo: 'inicio' | 'termino', valor: string) => {
    updateConfiguracoes({
      horarios: {
        ...configuracoes.horarios,
        horarioExpediente: {
          ...configuracoes.horarios.horarioExpediente,
          [campo]: valor,
        },
      },
    });
  };

  const handleIntervaloAlmocoChange = (campo: 'inicio' | 'termino', valor: string) => {
    updateConfiguracoes({
      horarios: {
        ...configuracoes.horarios,
        intervaloAlmoco: {
          ...configuracoes.horarios.intervaloAlmoco,
          [campo]: valor,
        },
      },
    });
  };

  const adicionarIntervaloPersonalizado = () => {
    if (!novoIntervalo.inicio || !novoIntervalo.termino) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe o horário de início e término do intervalo.",
        variant: "destructive",
      });
      return;
    }

    if (novoIntervalo.inicio >= novoIntervalo.termino) {
      toast({
        title: "Horário inválido",
        description: "O horário de início deve ser anterior ao de término.",
        variant: "destructive",
      });
      return;
    }

    const novosIntervalos = [...configuracoes.horarios.intervalosPersonalizados, novoIntervalo];
    
    updateConfiguracoes({
      horarios: {
        ...configuracoes.horarios,
        intervalosPersonalizados: novosIntervalos,
      },
    });

    setNovoIntervalo({ inicio: '', termino: '', descricao: '' });
    toast({
      title: "Intervalo adicionado",
      description: "Novo intervalo personalizado criado com sucesso.",
    });
  };

  const removerIntervaloPersonalizado = (index: number) => {
    const novosIntervalos = configuracoes.horarios.intervalosPersonalizados.filter((_, i) => i !== index);
    
    updateConfiguracoes({
      horarios: {
        ...configuracoes.horarios,
        intervalosPersonalizados: novosIntervalos,
      },
    });

    toast({
      title: "Intervalo removido",
      description: "Intervalo personalizado removido com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Dias da Semana */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dias de Atendimento
          </CardTitle>
          <CardDescription>
            Selecione os dias da semana em que você atenderá clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {diasSemana.map((dia) => (
              <div key={dia.key} className="flex items-center space-x-2">
                <Switch
                  id={dia.key}
                  checked={configuracoes.horarios.diasAtivos[dia.key as keyof typeof configuracoes.horarios.diasAtivos]}
                  onCheckedChange={(checked) => handleDiaToggle(dia.key, checked)}
                />
                <Label htmlFor={dia.key} className="text-sm">
                  {dia.label}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {diasSemana.map((dia) => {
              const isAtivo = configuracoes.horarios.diasAtivos[dia.key as keyof typeof configuracoes.horarios.diasAtivos];
              return (
                <Badge key={dia.key} variant={isAtivo ? "default" : "secondary"}>
                  {dia.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Horário de Expediente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Expediente
          </CardTitle>
          <CardDescription>
            Configure o horário de funcionamento do seu salão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inicio-expediente">Horário de Início</Label>
              <Input
                id="inicio-expediente"
                type="time"
                value={configuracoes.horarios.horarioExpediente.inicio}
                onChange={(e) => handleHorarioExpedienteChange('inicio', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="termino-expediente">Horário de Término</Label>
              <Input
                id="termino-expediente"
                type="time"
                value={configuracoes.horarios.horarioExpediente.termino}
                onChange={(e) => handleHorarioExpedienteChange('termino', e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Expediente:</strong> {configuracoes.horarios.horarioExpediente.inicio} às {configuracoes.horarios.horarioExpediente.termino}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Intervalo de Almoço */}
      <Card>
        <CardHeader>
          <CardTitle>Intervalo de Almoço</CardTitle>
          <CardDescription>
            Configure o horário de intervalo para almoço
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inicio-almoco">Início do Almoço</Label>
              <Input
                id="inicio-almoco"
                type="time"
                value={configuracoes.horarios.intervaloAlmoco.inicio}
                onChange={(e) => handleIntervaloAlmocoChange('inicio', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="termino-almoco">Término do Almoço</Label>
              <Input
                id="termino-almoco"
                type="time"
                value={configuracoes.horarios.intervaloAlmoco.termino}
                onChange={(e) => handleIntervaloAlmocoChange('termino', e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Almoço:</strong> {configuracoes.horarios.intervaloAlmoco.inicio} às {configuracoes.horarios.intervaloAlmoco.termino}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Intervalos Personalizados */}
      <Card>
        <CardHeader>
          <CardTitle>Intervalos Personalizados</CardTitle>
          <CardDescription>
            Adicione outros horários de descanso ou bloqueios específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de intervalos existentes */}
          {configuracoes.horarios.intervalosPersonalizados.length > 0 && (
            <div className="space-y-2">
              {configuracoes.horarios.intervalosPersonalizados.map((intervalo, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {intervalo.inicio} - {intervalo.termino}
                    </p>
                    {intervalo.descricao && (
                      <p className="text-sm text-muted-foreground">{intervalo.descricao}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removerIntervaloPersonalizado(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Separator />
            </div>
          )}

          {/* Adicionar novo intervalo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Adicionar Novo Intervalo</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="novo-inicio" className="text-xs">Início</Label>
                <Input
                  id="novo-inicio"
                  type="time"
                  value={novoIntervalo.inicio}
                  onChange={(e) => setNovoIntervalo(prev => ({ ...prev, inicio: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="novo-termino" className="text-xs">Término</Label>
                <Input
                  id="novo-termino"
                  type="time"
                  value={novoIntervalo.termino}
                  onChange={(e) => setNovoIntervalo(prev => ({ ...prev, termino: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="nova-descricao" className="text-xs">Descrição (opcional)</Label>
                <Input
                  id="nova-descricao"
                  placeholder="Ex: Lanche da tarde"
                  value={novoIntervalo.descricao}
                  onChange={(e) => setNovoIntervalo(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>
            </div>
            
            <Button onClick={adicionarIntervaloPersonalizado} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Intervalo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}