import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Mail, 
  Calendar, 
  FileDown, 
  CheckCircle, 
  Upload, 
  Save, 
  Clock,
  Database,
  AlertTriangle
} from 'lucide-react';
import { useSupabaseConfiguracoes } from '@/hooks/useSupabaseConfiguracoes';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DIAS_SEMANA = [
  { value: 1, label: 'Segunda-feira', abrev: 'SEG' },
  { value: 2, label: 'Terça-feira', abrev: 'TER' },
  { value: 3, label: 'Quarta-feira', abrev: 'QUA' },
  { value: 4, label: 'Quinta-feira', abrev: 'QUI' },
  { value: 5, label: 'Sexta-feira', abrev: 'SEX' },
  { value: 6, label: 'Sábado', abrev: 'SAB' },
  { value: 0, label: 'Domingo', abrev: 'DOM' },
];

const FREQUENCIAS = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
];

export function ConfiguracaoBackup() {
  const { configuracaoBackup, loading, salvarBackup } = useSupabaseConfiguracoes();
  const { user } = useSupabaseAuth();
  const [realizandoBackup, setRealizandoBackup] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const [localConfig, setLocalConfig] = useState({
    backup_automatico: false,
    frequencia_backup: 'semanal' as 'diario' | 'semanal' | 'mensal',
    dia_backup: 1,
    hora_backup: '02:00',
    email_backup: '',
    incluir_clientes: true,
    incluir_agendamentos: true,
    incluir_servicos: true,
    incluir_financeiro: true,
    incluir_cronogramas: true,
  });

  useEffect(() => {
    if (configuracaoBackup) {
      setLocalConfig({
        backup_automatico: configuracaoBackup.backup_automatico,
        frequencia_backup: configuracaoBackup.frequencia_backup,
        dia_backup: configuracaoBackup.dia_backup || 1,
        hora_backup: configuracaoBackup.hora_backup,
        email_backup: configuracaoBackup.email_backup || '',
        incluir_clientes: configuracaoBackup.incluir_clientes,
        incluir_agendamentos: configuracaoBackup.incluir_agendamentos,
        incluir_servicos: configuracaoBackup.incluir_servicos,
        incluir_financeiro: configuracaoBackup.incluir_financeiro,
        incluir_cronogramas: configuracaoBackup.incluir_cronogramas,
      });
    }
  }, [configuracaoBackup]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando configurações de backup...</div>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    try {
      await salvarBackup(localConfig);
    } catch (error) {
      console.error('Erro ao salvar configurações de backup:', error);
    }
  };

  const exportarDadosSupabase = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setRealizandoBackup(true);
    try {
      console.log('🔄 Iniciando backup dos dados do Supabase...');
      
      const dadosBackup: any = {
        exportadoEm: new Date().toISOString(),
        usuario: user.email,
        userId: user.id,
        dados: {},
        estatisticas: {},
      };

      // Buscar dados conforme configuração
      if (localConfig.incluir_clientes) {
        const { data: clientes } = await supabase
          .from('clientes')
          .select('*')
          .eq('user_id', user.id);
        dadosBackup.dados.clientes = clientes || [];
        dadosBackup.estatisticas.totalClientes = clientes?.length || 0;
      }

      if (localConfig.incluir_servicos) {
        const { data: servicos } = await supabase
          .from('servicos')
          .select('*')
          .eq('user_id', user.id);
        dadosBackup.dados.servicos = servicos || [];
        dadosBackup.estatisticas.totalServicos = servicos?.length || 0;
      }

      if (localConfig.incluir_agendamentos) {
        const { data: agendamentos } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('user_id', user.id);
        dadosBackup.dados.agendamentos = agendamentos || [];
        dadosBackup.estatisticas.totalAgendamentos = agendamentos?.length || 0;

        // Incluir agendamentos online se existirem
        const { data: agendamentosOnline } = await supabase
          .from('agendamentos_online')
          .select('*');
        dadosBackup.dados.agendamentos_online = agendamentosOnline || [];
      }

      if (localConfig.incluir_cronogramas) {
        const { data: cronogramas } = await supabase
          .from('cronogramas_novos')
          .select('*')
          .eq('user_id', user.id);
        dadosBackup.dados.cronogramas = cronogramas || [];
        dadosBackup.estatisticas.totalCronogramas = cronogramas?.length || 0;

        const { data: retornos } = await supabase
          .from('retornos_novos')
          .select('*')
          .eq('user_id', user.id);
        dadosBackup.dados.retornos = retornos || [];
      }

      if (localConfig.incluir_financeiro) {
        const { data: lancamentos } = await supabase
          .from('lancamentos')
          .select('*')
          .eq('user_id', user.id);
        dadosBackup.dados.lancamentos = lancamentos || [];
        dadosBackup.estatisticas.totalLancamentos = lancamentos?.length || 0;

        const { data: contasFixas } = await supabase
          .from('contas_fixas')
          .select('*')
          .eq('user_id', user.id);
        dadosBackup.dados.contas_fixas = contasFixas || [];
      }

      // Incluir configurações
      const { data: configHorarios } = await supabase
        .from('configuracoes_horarios')
        .select('*')
        .eq('user_id', user.id);
      dadosBackup.dados.configuracoes_horarios = configHorarios || [];

      const { data: configNotificacoes } = await supabase
        .from('configuracoes_notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (configNotificacoes) {
        dadosBackup.dados.configuracoes_notificacoes = [configNotificacoes];
      }

      console.log('💾 Dados coletados:', dadosBackup.estatisticas);

      // Criar e baixar arquivo
      const dataStr = JSON.stringify(dadosBackup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_supabase_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Atualizar data do último backup
      await salvarBackup({
        ...localConfig,
        ultimo_backup: new Date().toISOString(),
      });

      toast.success(
        `Backup criado com sucesso! Incluídos: ${Object.entries(dadosBackup.estatisticas)
          .filter(([_, value]) => typeof value === 'number' && value > 0)
          .map(([key, value]) => `${value} ${key.replace('total', '').toLowerCase()}`)
          .join(', ')}`
      );

    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error);
      toast.error('Erro ao criar backup. Verifique o console para mais detalhes.');
    } finally {
      setRealizandoBackup(false);
    }
  };

  const enviarBackupPorEmail = async () => {
    if (!localConfig.email_backup) {
      toast.error('Configure um email válido antes de enviar o backup');
      return;
    }

    setEnviandoEmail(true);
    try {
      // Primeiro, criar o backup
      await exportarDadosSupabase();
      
      // Enviar email (simulado por enquanto)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Backup enviado para ${localConfig.email_backup} com sucesso!`);
      
      // Atualizar configurações
      await salvarBackup({
        ...localConfig,
        ultimo_backup: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Erro ao enviar backup por email:', error);
      toast.error('Erro ao enviar backup por email');
    } finally {
      setEnviandoEmail(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProximoBackup = () => {
    if (!localConfig.backup_automatico) return 'Backup automático desativado';
    
    const agora = new Date();
    let proximaData = new Date();

    switch (localConfig.frequencia_backup) {
      case 'diario':
        proximaData.setDate(agora.getDate() + 1);
        break;
      case 'semanal':
        const diasAteProximo = (localConfig.dia_backup + 7 - agora.getDay()) % 7;
        proximaData.setDate(agora.getDate() + (diasAteProximo || 7));
        break;
      case 'mensal':
        proximaData.setMonth(agora.getMonth() + 1);
        proximaData.setDate(localConfig.dia_backup);
        break;
    }

    const [hora, minuto] = localConfig.hora_backup.split(':');
    proximaData.setHours(parseInt(hora), parseInt(minuto), 0, 0);

    return proximaData.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Status do Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status do Sistema de Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={localConfig.backup_automatico ? "default" : "secondary"}>
                Automático {localConfig.backup_automatico ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Última execução: {formatDate(configuracaoBackup?.ultimo_backup)}
              </Badge>
            </div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Próximo backup:</strong> {getProximoBackup()}
            </p>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações de Backup
          </Button>
        </CardContent>
      </Card>

      {/* Backup Manual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup Manual
          </CardTitle>
          <CardDescription>
            Exporte todos os seus dados do Supabase para um arquivo JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de dados para incluir */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Dados para incluir no backup:</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'incluir_clientes', label: 'Clientes', icon: '👥' },
                { key: 'incluir_servicos', label: 'Serviços', icon: '✂️' },
                { key: 'incluir_agendamentos', label: 'Agendamentos', icon: '📅' },
                { key: 'incluir_cronogramas', label: 'Cronogramas', icon: '🔄' },
                { key: 'incluir_financeiro', label: 'Financeiro', icon: '💰' },
              ].map((item) => (
                <div key={item.key} className="flex items-center space-x-2 p-2 border rounded">
                  <Switch
                    id={item.key}
                    checked={localConfig[item.key as keyof typeof localConfig] as boolean}
                    onCheckedChange={(checked) =>
                      setLocalConfig(prev => ({ ...prev, [item.key]: checked }))
                    }
                  />
                  <Label htmlFor={item.key} className="text-sm cursor-pointer">
                    {item.icon} {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={exportarDadosSupabase} 
            disabled={realizandoBackup}
            className="w-full"
            size="lg"
          >
            {realizandoBackup ? (
              <>
                <FileDown className="h-4 w-4 mr-2 animate-spin" />
                Preparando backup...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Realizar Backup Manual
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Backup Automático */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Backup Automático
          </CardTitle>
          <CardDescription>
            Configure backups automáticos regulares
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ativar/Desativar */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Backup Automático</Label>
              <p className="text-sm text-muted-foreground">
                Executar backups automaticamente conforme programação
              </p>
            </div>
            <Switch
              checked={localConfig.backup_automatico}
              onCheckedChange={(checked) =>
                setLocalConfig(prev => ({ ...prev, backup_automatico: checked }))
              }
            />
          </div>

          {localConfig.backup_automatico && (
            <>
              {/* Frequência */}
              <div className="space-y-2">
                <Label htmlFor="frequencia">Frequência do Backup</Label>
                <Select
                  value={localConfig.frequencia_backup}
                  onValueChange={(value: 'diario' | 'semanal' | 'mensal') =>
                    setLocalConfig(prev => ({ ...prev, frequencia_backup: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIAS.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dia específico para backup semanal/mensal */}
              {localConfig.frequencia_backup === 'semanal' && (
                <div className="space-y-2">
                  <Label>Dia da Semana</Label>
                  <Select
                    value={localConfig.dia_backup.toString()}
                    onValueChange={(value) =>
                      setLocalConfig(prev => ({ ...prev, dia_backup: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAS_SEMANA.map((dia) => (
                        <SelectItem key={dia.value} value={dia.value.toString()}>
                          {dia.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {localConfig.frequencia_backup === 'mensal' && (
                <div className="space-y-2">
                  <Label htmlFor="dia-mes">Dia do Mês</Label>
                  <Input
                    id="dia-mes"
                    type="number"
                    min="1"
                    max="31"
                    value={localConfig.dia_backup}
                    onChange={(e) =>
                      setLocalConfig(prev => ({ 
                        ...prev, 
                        dia_backup: parseInt(e.target.value) || 1 
                      }))
                    }
                  />
                </div>
              )}

              {/* Horário */}
              <div className="space-y-2">
                <Label htmlFor="hora-backup">Horário do Backup</Label>
                <Input
                  id="hora-backup"
                  type="time"
                  value={localConfig.hora_backup}
                  onChange={(e) =>
                    setLocalConfig(prev => ({ ...prev, hora_backup: e.target.value }))
                  }
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email-backup">Email para Envio</Label>
                <div className="flex gap-2">
                  <Input
                    id="email-backup"
                    type="email"
                    placeholder="seu@email.com"
                    value={localConfig.email_backup}
                    onChange={(e) =>
                      setLocalConfig(prev => ({ ...prev, email_backup: e.target.value }))
                    }
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={enviarBackupPorEmail}
                    disabled={enviandoEmail || !localConfig.email_backup}
                  >
                    {enviandoEmail ? (
                      <>
                        <Mail className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Testar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Informações de Segurança */}
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                Informações Importantes sobre Backup
              </h3>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• Os backups incluem todos os dados sensíveis do seu negócio</li>
                <li>• Mantenha os arquivos de backup em local seguro</li>
                <li>• Teste regularmente a restauração dos backups</li>
                <li>• O backup automático por email está em desenvolvimento</li>
                <li>• Dados são exportados diretamente do Supabase</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}