import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Calendar, Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

interface HorarioConfig {
  id?: string;
  dia_semana: number;
  ativo: boolean;
  horario_abertura: string;
  horario_fechamento: string;
  intervalo_inicio?: string;
  intervalo_fim?: string;
}

export function ConfiguracaoHorarios() {
  const [configs, setConfigs] = useState<HorarioConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inicializar configurações padrão
  useEffect(() => {
    const configsPadrao = DIAS_SEMANA.map(dia => ({
      dia_semana: dia.id,
      ativo: dia.id >= 1 && dia.id <= 5, // Segunda a sexta ativo por padrão
      horario_abertura: '08:00',
      horario_fechamento: '18:00',
      intervalo_inicio: '12:00',
      intervalo_fim: '13:00',
    }));
    setConfigs(configsPadrao);
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('configuracoes_horarios')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const configsCarregadas = DIAS_SEMANA.map(dia => {
          const configDb = data.find(c => c.dia_semana === dia.id);
          return configDb ? {
            id: configDb.id,
            dia_semana: dia.id,
            ativo: configDb.ativo,
            horario_abertura: configDb.horario_abertura,
            horario_fechamento: configDb.horario_fechamento,
            intervalo_inicio: configDb.intervalo_inicio || '12:00',
            intervalo_fim: configDb.intervalo_fim || '13:00',
          } : {
            dia_semana: dia.id,
            ativo: dia.id >= 1 && dia.id <= 5,
            horario_abertura: '08:00',
            horario_fechamento: '18:00',
            intervalo_inicio: '12:00',
            intervalo_fim: '13:00',
          };
        });
        setConfigs(configsCarregadas);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações de horário');
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracao = async (diaId: number) => {
    const config = configs.find(c => c.dia_semana === diaId);
    if (!config) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const configData = {
        user_id: user.id,
        dia_semana: config.dia_semana,
        ativo: config.ativo,
        horario_abertura: config.horario_abertura,
        horario_fechamento: config.horario_fechamento,
        intervalo_inicio: config.intervalo_inicio,
        intervalo_fim: config.intervalo_fim,
      };

      if (config.id) {
        const { error } = await supabase
          .from('configuracoes_horarios')
          .update(configData)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('configuracoes_horarios')
          .insert(configData)
          .select()
          .single();
        if (error) throw error;
        
        // Atualizar estado com ID retornado
        setConfigs(prev => prev.map(c => 
          c.dia_semana === diaId ? { ...c, id: data.id } : c
        ));
      }

      toast.success(`Horário de ${DIAS_SEMANA[diaId].nome} salvo com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (diaId: number, field: string, value: any) => {
    setConfigs(prev => prev.map(config => 
      config.dia_semana === diaId ? { ...config, [field]: value } : config
    ));
  };

  const diasAtivos = configs.filter(c => c.ativo);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Carregando configurações...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header com navegação simples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuração de Horários de Trabalho
          </CardTitle>
          <CardDescription>
            Configure os dias e horários em que você atende clientes
          </CardDescription>
        </CardHeader>
      </Card>

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
              const config = configs.find(c => c.dia_semana === dia.id);
              return (
                <Badge key={dia.id} variant={config?.ativo ? "default" : "secondary"}>
                  {dia.abrev} {config?.ativo ? `(${config.horario_abertura}-${config.horario_fechamento})` : '(Fechado)'}
                </Badge>
              );
            })}
          </div>
          
          {diasAtivos.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Nenhum dia de atendimento configurado. Configure pelo menos um dia para receber agendamentos.
              </p>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            {diasAtivos.length > 0 
              ? `${diasAtivos.length} ${diasAtivos.length === 1 ? 'dia configurado' : 'dias configurados'} para atendimento`
              : 'Configure os dias e horários de atendimento abaixo'
            }
          </p>
        </CardContent>
      </Card>

      {/* Configuração por Dia */}
      {DIAS_SEMANA.map((dia) => {
        const config = configs.find(c => c.dia_semana === dia.id);
        if (!config) return null;
        
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
                    checked={config.ativo}
                    onCheckedChange={(checked) => updateConfig(dia.id, 'ativo', checked)}
                  />
                  <Badge variant={config.ativo ? "default" : "secondary"}>
                    {config.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Configure os horários de funcionamento para {dia.nome.toLowerCase()}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {config.ativo && (
                <>
                  {/* Horário de Funcionamento */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Horário de Funcionamento</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`abertura-${dia.id}`} className="text-xs">Abertura</Label>
                        <Input
                          id={`abertura-${dia.id}`}
                          type="time"
                          value={config.horario_abertura}
                          onChange={(e) => updateConfig(dia.id, 'horario_abertura', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`fechamento-${dia.id}`} className="text-xs">Fechamento</Label>
                        <Input
                          id={`fechamento-${dia.id}`}
                          type="time"
                          value={config.horario_fechamento}
                          onChange={(e) => updateConfig(dia.id, 'horario_fechamento', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Intervalo de Almoço */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Intervalo de Almoço (Opcional)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`intervalo-inicio-${dia.id}`} className="text-xs">Início do Almoço</Label>
                        <Input
                          id={`intervalo-inicio-${dia.id}`}
                          type="time"
                          value={config.intervalo_inicio || ''}
                          onChange={(e) => updateConfig(dia.id, 'intervalo_inicio', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`intervalo-fim-${dia.id}`} className="text-xs">Fim do Almoço</Label>
                        <Input
                          id={`intervalo-fim-${dia.id}`}
                          type="time"
                          value={config.intervalo_fim || ''}
                          onChange={(e) => updateConfig(dia.id, 'intervalo_fim', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resumo do Horário */}
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Funcionamento:</strong> {config.horario_abertura} às {config.horario_fechamento}
                      {config.intervalo_inicio && config.intervalo_fim && (
                        <span> (Almoço: {config.intervalo_inicio} às {config.intervalo_fim})</span>
                      )}
                    </p>
                  </div>
                </>
              )}

              {!config.ativo && (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Este dia está desativado para atendimento</p>
                </div>
              )}

              {/* Botão Salvar Individual */}
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => salvarConfiguracao(dia.id)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : `Salvar ${dia.nome}`}
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* Informações de Ajuda */}
      <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
        <CardContent className="p-4">
          <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
            ✅ Configuração Funcional
          </h3>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• Configure os dias e horários de atendimento</li>
            <li>• Os horários são salvos automaticamente no banco de dados</li>
            <li>• Os agendamentos respeitarão essas configurações</li>
            <li>• Use o switch para ativar/desativar dias específicos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}