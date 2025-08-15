import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Mail, Calendar, FileDown, CheckCircle, Upload } from 'lucide-react';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { toast } from '@/hooks/use-toast';

export function ConfiguracaoBackup() {
  const { configuracoes, updateConfiguracoes, exportarDados, enviarBackupPorEmail, loading } = useConfiguracoes();
  const [realizandoBackup, setRealizandoBackup] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [importandoDados, setImportandoDados] = useState(false);

  if (loading || !configuracoes) {
    return <div>Carregando configurações...</div>;
  }

  const diasSemana = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
  ];

  const handleBackupManual = async () => {
    setRealizandoBackup(true);
    try {
      await exportarDados();
    } finally {
      setRealizandoBackup(false);
    }
  };

  const handleBackupAutomaticoToggle = (enabled: boolean) => {
    updateConfiguracoes({
      backup: {
        ...configuracoes.backup,
        backupAutomatico: enabled,
      },
    });

    toast({
      title: enabled ? "Backup automático ativado" : "Backup automático desativado",
      description: enabled ? 
        "Seus dados serão enviados automaticamente por e-mail." : 
        "O backup automático foi desativado.",
    });
  };

  const handleEmailChange = (email: string) => {
    updateConfiguracoes({
      backup: {
        ...configuracoes.backup,
        emailBackup: email,
      },
    });
  };

  const handleDiaBackupToggle = (dia: number) => {
    const diasAtuais = configuracoes.backup.diasSemanaBackup;
    const novosDias = diasAtuais.includes(dia)
      ? diasAtuais.filter(d => d !== dia)
      : [...diasAtuais, dia];

    updateConfiguracoes({
      backup: {
        ...configuracoes.backup,
        diasSemanaBackup: novosDias,
      },
    });
  };

  const handleTestarBackupEmail = async () => {
    if (!configuracoes?.backup.emailBackup) {
      toast({
        title: "Email necessário",
        description: "Configure um email válido antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setEnviandoEmail(true);
    try {
      await enviarBackupPorEmail(configuracoes.backup.emailBackup);
    } finally {
      setEnviandoEmail(false);
    }
  };

  const handleImportarBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast({
        title: "Arquivo inválido",
        description: "Selecione um arquivo JSON de backup.",
        variant: "destructive",
      });
      return;
    }

    setImportandoDados(true);
    try {
      console.log('🔄 Iniciando importação de backup...');
      const text = await file.text();
      const dadosBackup = JSON.parse(text);

      console.log('📊 Dados do backup:', dadosBackup);

      // Validar estrutura do backup
      if (!dadosBackup.dados) {
        throw new Error('Formato de backup inválido - dados não encontrados');
      }

      // Importar dados reais usando LocalDatabase
      const { LocalDatabase } = await import('@/lib/database');
      const database = LocalDatabase.getInstance();
      const { useAuth } = await import('@/contexts/AuthContext');
      
      // Obter userId atual (assumindo que o usuário logado é o mesmo do backup)
      const userId = dadosBackup.userId || 'current_user';
      
      console.log('💾 Importando dados para userId:', userId);

      // Importar cada tipo de dado
      if (dadosBackup.dados.clientes && Array.isArray(dadosBackup.dados.clientes)) {
        // Limpar dados existentes
        localStorage.removeItem(`clientes_${userId}`);
        // Importar novos dados
        localStorage.setItem(`clientes_${userId}`, JSON.stringify(dadosBackup.dados.clientes));
        console.log('✅ Clientes importados:', dadosBackup.dados.clientes.length);
      }

      if (dadosBackup.dados.servicos && Array.isArray(dadosBackup.dados.servicos)) {
        localStorage.removeItem(`servicos_${userId}`);
        localStorage.setItem(`servicos_${userId}`, JSON.stringify(dadosBackup.dados.servicos));
        console.log('✅ Serviços importados:', dadosBackup.dados.servicos.length);
      }

      if (dadosBackup.dados.agendamentos && Array.isArray(dadosBackup.dados.agendamentos)) {
        localStorage.removeItem(`agendamentos_${userId}`);
        localStorage.setItem(`agendamentos_${userId}`, JSON.stringify(dadosBackup.dados.agendamentos));
        console.log('✅ Agendamentos importados:', dadosBackup.dados.agendamentos.length);
      }

      if (dadosBackup.dados.cronogramas && Array.isArray(dadosBackup.dados.cronogramas)) {
        localStorage.removeItem(`cronogramas_${userId}`);
        localStorage.setItem(`cronogramas_${userId}`, JSON.stringify(dadosBackup.dados.cronogramas));
        console.log('✅ Cronogramas importados:', dadosBackup.dados.cronogramas.length);
      }

      if (dadosBackup.dados.lancamentos && Array.isArray(dadosBackup.dados.lancamentos)) {
        // Converter dates para formato esperado
        const lancamentosProcessados = dadosBackup.dados.lancamentos.map((l: any) => ({
          ...l,
          data: typeof l.data === 'string' ? l.data : l.data.toISOString ? l.data.toISOString().split('T')[0] : l.data,
          created_at: typeof l.created_at === 'string' ? l.created_at : new Date().toISOString(),
          updated_at: typeof l.updated_at === 'string' ? l.updated_at : new Date().toISOString(),
        }));
        
        localStorage.removeItem(`lancamentos_${userId}`);
        localStorage.setItem(`lancamentos_${userId}`, JSON.stringify(lancamentosProcessados));
        console.log('✅ Lançamentos importados:', lancamentosProcessados.length);
      }

      console.log('✅ Importação concluída com sucesso');

      toast({
        title: "Backup importado",
        description: `Dados de ${dadosBackup.exportadoEm ? new Date(dadosBackup.exportadoEm).toLocaleDateString() : 'data desconhecida'} foram importados com sucesso. Recarregue a página para ver as mudanças.`,
      });

      // Recarregar a página após 2 segundos para atualizar todos os dados
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ Erro ao importar backup:', error);
      toast({
        title: "Erro na importação",
        description: `Erro ao importar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setImportandoDados(false);
      // Limpar input
      event.target.value = '';
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

  return (
    <div className="space-y-6">
      {/* Backup Manual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup Manual
          </CardTitle>
          <CardDescription>
            Exporte todos os seus dados para um arquivo JSON que pode ser usado para restauração
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">O backup incluirá:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Todos os clientes cadastrados</li>
              <li>• Histórico de agendamentos</li>
              <li>• Serviços configurados</li>
              <li>• Cronogramas ativos</li>
              <li>• Lançamentos financeiros</li>
              <li>• Configurações do sistema</li>
            </ul>
          </div>

          <Button 
            onClick={handleBackupManual} 
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

          {configuracoes.backup.ultimoBackup && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Último backup: {formatDate(configuracoes.backup.ultimoBackup)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Importar Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Backup
          </CardTitle>
          <CardDescription>
            Restaure seus dados a partir de um arquivo de backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50/50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
              ⚠️ Atenção
            </h4>
            <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
              <li>• A importação substituirá todos os dados atuais</li>
              <li>• Faça um backup atual antes de importar</li>
              <li>• Use apenas arquivos JSON gerados por este sistema</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Label htmlFor="import-backup">Selecionar Arquivo de Backup</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={importandoDados}
                className="relative"
                onClick={() => document.getElementById('import-backup')?.click()}
              >
                {importandoDados ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </>
                )}
              </Button>
              <input
                id="import-backup"
                type="file"
                accept=".json"
                onChange={handleImportarBackup}
                className="hidden"
                disabled={importandoDados}
              />
              <p className="text-sm text-muted-foreground">
                Apenas arquivos .json
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Automático */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Backup Automático por E-mail
          </CardTitle>
          <CardDescription>
            Configure o envio automático de backups para seu e-mail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ativar/Desativar Backup Automático */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="backup-automatico">Backup Automático</Label>
              <p className="text-sm text-muted-foreground">
                Enviar backup automaticamente por e-mail
              </p>
            </div>
            <Switch
              id="backup-automatico"
              checked={configuracoes.backup.backupAutomatico}
              onCheckedChange={handleBackupAutomaticoToggle}
            />
          </div>

          {/* E-mail para envio */}
          <div className="space-y-2">
            <Label htmlFor="email-backup">E-mail para Recebimento</Label>
            <div className="flex gap-2">
              <Input
                id="email-backup"
                type="email"
                placeholder="seu@email.com"
                value={configuracoes.backup.emailBackup}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={!configuracoes.backup.backupAutomatico}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={handleTestarBackupEmail}
                disabled={enviandoEmail || !configuracoes.backup.emailBackup || !configuracoes.backup.backupAutomatico}
                size="sm"
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
            <p className="text-xs text-muted-foreground">
              O backup será enviado automaticamente para este e-mail
            </p>
          </div>

          {/* Dias da semana para backup */}
          <div className="space-y-3">
            <Label>Dias para Envio Automático</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {diasSemana.map((dia) => (
                <div
                  key={dia.value}
                  className={`p-2 text-center text-sm rounded-lg border cursor-pointer transition-colors ${
                    configuracoes.backup.diasSemanaBackup.includes(dia.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  } ${!configuracoes.backup.backupAutomatico ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (configuracoes.backup.backupAutomatico) {
                      handleDiaBackupToggle(dia.value);
                    }
                  }}
                >
                  {dia.label}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Clique nos dias da semana para selecionar quando enviar o backup
            </p>
          </div>

          {/* Status do backup automático */}
          {configuracoes.backup.backupAutomatico && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Backup Automático Configurado
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Envio para: {configuracoes.backup.emailBackup || 'E-mail não configurado'}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {configuracoes.backup.diasSemanaBackup.map(dia => (
                      <Badge key={dia} variant="secondary" className="text-xs">
                        {diasSemana.find(d => d.value === dia)?.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aviso sobre o backup automático */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Importante:</strong> O backup automático por e-mail está simulado nesta versão. 
              Em produção, seria necessário configurar um serviço de e-mail real.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}