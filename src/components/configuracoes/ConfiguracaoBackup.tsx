import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload,
  FileJson,
  FileText,
  Database,
  Save,
  AlertTriangle,
  CheckCircle2,
  File,
  Mail as MailIcon,
  Send
} from 'lucide-react';
import { useSupabaseConfiguracoes } from '@/hooks/useSupabaseConfiguracoes';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ExportFormat = 'json' | 'csv' | 'sql';

const FORMATOS_EXPORT = [
  { value: 'json', label: 'JSON', icon: FileJson, description: 'Formato legível e universal' },
  { value: 'csv', label: 'CSV', icon: FileText, description: 'Para Excel e planilhas' },
  { value: 'sql', label: 'SQL', icon: Database, description: 'Script de restauração' },
];

export function ConfiguracaoBackup() {
  const { configuracaoBackup, loading, salvarBackup } = useSupabaseConfiguracoes();
  const { user } = useSupabaseAuth();
  const [realizandoBackup, setRealizandoBackup] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [importando, setImportando] = useState(false);
  const [formatoExport, setFormatoExport] = useState<ExportFormat>('json');
  
  const [localConfig, setLocalConfig] = useState({
    incluir_clientes: true,
    incluir_agendamentos: true,
    incluir_servicos: true,
    incluir_financeiro: true,
    incluir_cronogramas: true,
    backup_automatico: false,
    frequencia_backup: 'semanal' as 'diario' | 'semanal' | 'mensal',
    dia_backup: 1,
    hora_backup: '02:00',
    email_backup: '',
  });

  useEffect(() => {
    if (configuracaoBackup) {
      setLocalConfig({
        incluir_clientes: configuracaoBackup.incluir_clientes,
        incluir_agendamentos: configuracaoBackup.incluir_agendamentos,
        incluir_servicos: configuracaoBackup.incluir_servicos,
        incluir_financeiro: configuracaoBackup.incluir_financeiro,
        incluir_cronogramas: configuracaoBackup.incluir_cronogramas,
        backup_automatico: configuracaoBackup.backup_automatico,
        frequencia_backup: configuracaoBackup.frequencia_backup,
        dia_backup: configuracaoBackup.dia_backup || 1,
        hora_backup: configuracaoBackup.hora_backup,
        email_backup: configuracaoBackup.email_backup || '',
      });
    }
  }, [configuracaoBackup]);

  const coletarDados = async () => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const dadosBackup: any = {
      exportadoEm: new Date().toISOString(),
      usuario: user.email,
      userId: user.id,
      versao: '1.0',
      dados: {},
      estatisticas: {},
    };

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
    }

    if (localConfig.incluir_cronogramas) {
      const { data: cronogramas } = await supabase
        .from('cronogramas_novos')
        .select('*')
        .eq('user_id', user.id);
      dadosBackup.dados.cronogramas = cronogramas || [];
      
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
      
      const { data: contasFixas } = await supabase
        .from('contas_fixas')
        .select('*')
        .eq('user_id', user.id);
      dadosBackup.dados.contas_fixas = contasFixas || [];
    }

    // Sempre incluir configurações
    const { data: configHorarios } = await supabase
      .from('configuracoes_horarios')
      .select('*')
      .eq('user_id', user.id);
    dadosBackup.dados.configuracoes_horarios = configHorarios || [];

    return dadosBackup;
  };

  const converterParaCSV = (dados: any) => {
    let csv = '';
    
    // Para cada tabela, criar um arquivo CSV
    Object.entries(dados.dados).forEach(([tabela, registros]: [string, any]) => {
      if (!Array.isArray(registros) || registros.length === 0) return;
      
      csv += `\n\n=== ${tabela.toUpperCase()} ===\n`;
      
      // Cabeçalhos
      const headers = Object.keys(registros[0]);
      csv += headers.join(',') + '\n';
      
      // Dados
      registros.forEach((registro: any) => {
        const valores = headers.map(header => {
          const valor = registro[header];
          if (valor === null || valor === undefined) return '';
          if (typeof valor === 'string' && valor.includes(',')) {
            return `"${valor.replace(/"/g, '""')}"`;
          }
          if (typeof valor === 'object') return JSON.stringify(valor);
          return valor;
        });
        csv += valores.join(',') + '\n';
      });
    });
    
    return csv;
  };

  const converterParaSQL = (dados: any) => {
    let sql = `-- Backup exportado em: ${new Date().toISOString()}\n`;
    sql += `-- Usuário: ${dados.usuario}\n\n`;
    sql += `-- IMPORTANTE: Este backup foi criado para restauração de dados\n`;
    sql += `-- Execute este script em um banco de dados limpo ou revise antes de executar\n\n`;
    
    const tabelas = [
      { nome: 'clientes', campos: ['id', 'user_id', 'nome', 'telefone', 'email', 'endereco', 'data_nascimento', 'observacoes', 'historico_servicos'] },
      { nome: 'servicos', campos: ['id', 'user_id', 'nome', 'descricao', 'valor', 'duracao', 'observacoes'] },
      { nome: 'agendamentos', campos: ['id', 'user_id', 'cliente_id', 'servico_id', 'data', 'hora', 'duracao', 'valor', 'status', 'observacoes'] },
      { nome: 'lancamentos', campos: ['id', 'user_id', 'tipo', 'descricao', 'valor', 'data', 'categoria'] },
      { nome: 'contas_fixas', campos: ['id', 'user_id', 'nome', 'valor', 'categoria', 'frequencia', 'data_vencimento'] },
      { nome: 'cronogramas_novos', campos: ['id_cronograma', 'user_id', 'cliente_id', 'servico_id', 'tipo_servico', 'recorrencia', 'data_inicio'] },
    ];

    tabelas.forEach(({ nome, campos }) => {
      const registros = dados.dados[nome];
      if (!registros || !Array.isArray(registros) || registros.length === 0) return;

      sql += `\n-- Tabela: ${nome}\n`;
      sql += `-- Total de registros: ${registros.length}\n\n`;

      registros.forEach((registro: any) => {
        const valores = campos.map(campo => {
          const valor = registro[campo];
          if (valor === null || valor === undefined) return 'NULL';
          if (typeof valor === 'string') return `'${valor.replace(/'/g, "''")}'`;
          if (typeof valor === 'boolean') return valor ? 'TRUE' : 'FALSE';
          if (typeof valor === 'object') return `'${JSON.stringify(valor).replace(/'/g, "''")}'`;
          return valor;
        });

        sql += `INSERT INTO ${nome} (${campos.join(', ')}) VALUES (${valores.join(', ')});\n`;
      });
    });

    return sql;
  };

  const exportarDados = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setRealizandoBackup(true);
    try {
      console.log('🔄 Iniciando backup dos dados...');
      
      const dadosBackup = await coletarDados();
      console.log('💾 Dados coletados:', dadosBackup.estatisticas);

      let conteudo: string;
      let nomeArquivo: string;
      let tipoMime: string;

      switch (formatoExport) {
        case 'csv':
          conteudo = converterParaCSV(dadosBackup);
          nomeArquivo = `backup_${new Date().toISOString().split('T')[0]}.csv`;
          tipoMime = 'text/csv';
          break;
        
        case 'sql':
          conteudo = converterParaSQL(dadosBackup);
          nomeArquivo = `backup_${new Date().toISOString().split('T')[0]}.sql`;
          tipoMime = 'text/plain';
          break;
        
        case 'json':
        default:
          conteudo = JSON.stringify(dadosBackup, null, 2);
          nomeArquivo = `backup_${new Date().toISOString().split('T')[0]}.json`;
          tipoMime = 'application/json';
      }

      // Criar e baixar arquivo
      const dataBlob = new Blob([conteudo], { type: tipoMime });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Atualizar última data de backup
      await salvarBackup({
        ...localConfig,
        ultimo_backup: new Date().toISOString(),
      });

      const totalItens = Object.values(dadosBackup.estatisticas)
        .reduce((acc: number, val: any) => acc + (typeof val === 'number' ? val : 0), 0);

      toast.success(
        `Backup ${formatoExport.toUpperCase()} criado com sucesso! ${totalItens} registros exportados.`
      );

    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error);
      toast.error('Erro ao criar backup. Verifique o console.');
    } finally {
      setRealizandoBackup(false);
    }
  };

  const enviarPorEmail = async () => {
    const emailDestino = localConfig.email_backup;
    
    if (!emailDestino) {
      toast.error('Por favor, cadastre um e-mail para receber o backup.');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setEnviandoEmail(true);
    try {
      const dadosBackup = await coletarDados();
      const totalItens = Object.values(dadosBackup.estatisticas)
        .reduce((acc: number, val: any) => acc + (typeof val === 'number' ? val : 0), 0);

      // Chamada para a Edge Function do Supabase (Deve ser criada/configurada)
      const { data, error } = await supabase.functions.invoke('enviar-backup-email', {
        body: {
          email: emailDestino,
          usuario: user.email,
          dados: dadosBackup,
          formato: formatoExport,
          totalItens
        }
      });

      if (error) throw error;

      // Atualizar última data de backup
      await salvarBackup({
        ...localConfig,
        ultimo_backup: new Date().toISOString(),
      });

      toast.success(`Backup enviado com sucesso para ${emailDestino}!`);
    } catch (error) {
      console.error('❌ Erro ao enviar backup por e-mail:', error);
      toast.error('Erro ao enviar e-mail. Certifique-se de que a função de e-mail está configurada no Supabase.');
    } finally {
      setEnviandoEmail(false);
    }
  };

  const importarDados = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setImportando(true);
    try {
      console.log('📥 Iniciando importação de:', file.name);
      
      const texto = await file.text();
      let dadosImportados: any;

      // Detectar formato
      if (file.name.endsWith('.json')) {
        dadosImportados = JSON.parse(texto);
      } else if (file.name.endsWith('.csv')) {
        toast.error('Importação de CSV em desenvolvimento');
        setImportando(false);
        return;
      } else if (file.name.endsWith('.sql')) {
        toast.error('Importação de SQL em desenvolvimento');
        setImportando(false);
        return;
      } else {
        toast.error('Formato de arquivo não suportado');
        setImportando(false);
        return;
      }

      // Validar estrutura
      if (!dadosImportados.dados || !dadosImportados.userId) {
        toast.error('Arquivo de backup inválido');
        setImportando(false);
        return;
      }

      // Confirmar com usuário
      const totalRegistros = Object.values(dadosImportados.dados)
        .reduce((acc: number, val: any) => acc + (Array.isArray(val) ? val.length : 0), 0);

      if (!confirm(`Deseja importar ${totalRegistros} registros? Isso irá adicionar dados ao sistema.`)) {
        setImportando(false);
        return;
      }

      let importados = 0;
      let erros = 0;

      // Importar clientes
      if (dadosImportados.dados.clientes?.length > 0) {
        for (const cliente of dadosImportados.dados.clientes) {
          try {
            const { error } = await supabase
              .from('clientes')
              .upsert({ ...cliente, user_id: user.id }, { onConflict: 'id' });
            if (error) throw error;
            importados++;
          } catch (err) {
            console.error('Erro ao importar cliente:', err);
            erros++;
          }
        }
      }

      // Importar serviços
      if (dadosImportados.dados.servicos?.length > 0) {
        for (const servico of dadosImportados.dados.servicos) {
          try {
            const { error } = await supabase
              .from('servicos')
              .upsert({ ...servico, user_id: user.id }, { onConflict: 'id' });
            if (error) throw error;
            importados++;
          } catch (err) {
            console.error('Erro ao importar serviço:', err);
            erros++;
          }
        }
      }

      // Importar agendamentos
      if (dadosImportados.dados.agendamentos?.length > 0) {
        for (const agendamento of dadosImportados.dados.agendamentos) {
          try {
            const { error } = await supabase
              .from('agendamentos')
              .upsert({ ...agendamento, user_id: user.id }, { onConflict: 'id' });
            if (error) throw error;
            importados++;
          } catch (err) {
            console.error('Erro ao importar agendamento:', err);
            erros++;
          }
        }
      }

      toast.success(`Importação concluída! ${importados} registros importados${erros > 0 ? `, ${erros} erros` : ''}.`);
      
    } catch (error) {
      console.error('❌ Erro na importação:', error);
      toast.error('Erro ao importar dados. Verifique o arquivo.');
    } finally {
      setImportando(false);
      // Limpar input
      event.target.value = '';
    }
  };

  const handleUpdateConfig = async (field: string, value: any) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    await salvarBackup(newConfig);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Exportar Dados */}
      <Card className="card-3d border-border/60">
        <CardHeader className="p-responsive">
          <CardTitle className="flex items-center gap-2 text-responsive-lg">
            <Download className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
            Exportar Dados
          </CardTitle>
          <CardDescription className="text-responsive-sm">
            Faça backup de todos os seus dados em diferentes formatos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-responsive">
          {/* Seleção de formato */}
          <div className="space-y-3">
            <Label className="text-responsive-base font-medium">Formato de Exportação:</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {FORMATOS_EXPORT.map((formato) => {
                const Icon = formato.icon;
                return (
                  <button
                    key={formato.value}
                    onClick={() => setFormatoExport(formato.value as ExportFormat)}
                    className={`p-3 sm:p-4 border-2 rounded-xl text-left transition-all touch-manipulation shadow-sm ${
                      formatoExport === formato.value
                        ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${formatoExport === formato.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-semibold text-responsive-sm ${formatoExport === formato.value ? 'text-primary' : ''}`}>{formato.label}</span>
                    </div>
                    <p className="text-responsive-xs text-muted-foreground">{formato.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seleção de dados */}
          <div className="space-y-3">
            <Label className="text-responsive-base font-medium">Dados para incluir:</Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {[
                { key: 'incluir_clientes', label: 'Clientes', icon: '👥' },
                { key: 'incluir_servicos', label: 'Serviços', icon: '✂️' },
                { key: 'incluir_agendamentos', label: 'Agendamentos', icon: '📅' },
                { key: 'incluir_cronogramas', label: 'Cronogramas', icon: '🔄' },
                { key: 'incluir_financeiro', label: 'Financeiro', icon: '💰' },
              ].map((item) => (
                <div key={item.key} className="flex items-center space-x-2 p-2 sm:p-3 border rounded-lg touch-manipulation hover:bg-muted/50 transition-colors">
                  <Switch
                    id={item.key}
                    checked={localConfig[item.key as keyof typeof localConfig] as boolean}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig(item.key, checked)
                    }
                  />
                  <Label htmlFor={item.key} className="text-responsive-xs cursor-pointer flex-1 select-none font-medium">
                    {item.icon} {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={exportarDados} 
              disabled={realizandoBackup || enviandoEmail}
              className="w-full btn-touch btn-3d bg-primary hover:bg-primary/90 text-white font-bold h-12"
              size="lg"
            >
              {realizandoBackup ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-bounce" />
                  <span className="text-responsive-sm">Gerando Arquivo...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  <span className="text-responsive-sm">Baixar Arquivo ({formatoExport.toUpperCase()})</span>
                </>
              )}
            </Button>

            <Button 
              onClick={enviarPorEmail} 
              disabled={realizandoBackup || enviandoEmail}
              variant="outline"
              className="w-full btn-touch btn-3d border-primary/20 text-primary font-bold h-12 hover:bg-primary/5"
              size="lg"
            >
              {enviandoEmail ? (
                <>
                  <Send className="h-4 w-4 mr-2 animate-pulse" />
                  <span className="text-responsive-sm">Enviando E-mail...</span>
                </>
              ) : (
                <>
                  <MailIcon className="h-4 w-4 mr-2" />
                  <span className="text-responsive-sm">Enviar para E-mail</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Importar Dados */}
      <Card className="card-3d border-border/60">
        <CardHeader className="p-responsive">
          <CardTitle className="flex items-center gap-2 text-responsive-lg">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
            Restaurar Backup
          </CardTitle>
          <CardDescription className="text-responsive-sm">
            Recupere seus dados a partir de um arquivo de backup (.json)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-responsive">
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <AlertDescription className="text-responsive-xs text-amber-800 dark:text-amber-400 font-medium">
              A restauração irá mesclar os dados do arquivo com os dados atuais. 
              Certifique-se de que o arquivo é um backup válido gerado por este sistema.
            </AlertDescription>
          </Alert>

          <div className="border-2 border-dashed border-primary/20 rounded-xl p-6 sm:p-10 text-center touch-manipulation bg-primary/5 hover:bg-primary/10 transition-colors">
            <input
              type="file"
              id="file-upload"
              accept=".json"
              onChange={importarDados}
              disabled={importando}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              {importando ? (
                <>
                  <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <p className="font-bold text-responsive-base text-primary">Restaurando Dados...</p>
                  <p className="text-responsive-sm text-muted-foreground">Por favor, não feche a página</p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <File className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-responsive-base">Clique ou arraste o arquivo aqui</p>
                    <p className="text-responsive-xs text-muted-foreground">
                      Somente arquivos .JSON (máx. 10MB)
                    </p>
                  </div>
                </>
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Backup Automático */}
      <Card className="card-3d border-primary/10">
        <CardHeader className="p-responsive">
          <CardTitle className="flex items-center gap-2 text-responsive-lg">
            <Database className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
            Lembrete de Backup Automático
          </CardTitle>
          <CardDescription className="text-responsive-sm">
            Configure alertas periódicos para nunca esquecer de salvar seus dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-responsive">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-xl bg-muted/30">
            <div className="flex-1 min-w-0">
              <Label className="text-responsive-base font-bold">Ativar Alertas de Backup</Label>
              <p className="text-responsive-xs text-muted-foreground mt-1">
                O sistema lembrará você de exportar seus dados conforme a frequência escolhida
              </p>
            </div>
            <Switch
              checked={localConfig.backup_automatico}
              onCheckedChange={(checked) => handleUpdateConfig('backup_automatico', checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {localConfig.backup_automatico && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-3">
                <Label className="text-responsive-sm font-bold">Frequência do Lembrete:</Label>
                <Select
                  value={localConfig.frequencia_backup}
                  onValueChange={(value) => handleUpdateConfig('frequencia_backup', value)}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="diario">Diariamente</SelectItem>
                    <SelectItem value="semanal">Semanalmente</SelectItem>
                    <SelectItem value="mensal">Mensalmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-responsive-sm font-bold">Horário Preferencial:</Label>
                <Input
                  type="time"
                  value={localConfig.hora_backup}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, hora_backup: e.target.value }))}
                  onBlur={(e) => handleUpdateConfig('hora_backup', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-3 sm:col-span-2">
                <Label className="text-responsive-sm font-bold">Email para Lembrete (opcional):</Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={localConfig.email_backup}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, email_backup: e.target.value }))}
                  onBlur={(e) => handleUpdateConfig('email_backup', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              {configuracaoBackup?.ultimo_backup && (
                <div className="sm:col-span-2">
                  <Alert className="bg-primary/5 border-primary/10 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-responsive-xs font-medium text-primary">
                      Último backup exportado em: {new Date(configuracaoBackup.ultimo_backup).toLocaleString('pt-BR')}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações de Segurança */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="p-responsive">
          <CardTitle className="flex items-center gap-2 text-primary text-responsive-lg">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Segurança dos Seus Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-responsive">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 text-responsive-xs">
              <span className="text-primary font-bold">✓</span>
              <p><strong>Privacidade Total:</strong> Os dados são gerados e processados localmente no seu navegador.</p>
            </div>
            <div className="flex items-start gap-2 text-responsive-xs">
              <span className="text-primary font-bold">✓</span>
              <p><strong>Backup Universal:</strong> O formato JSON permite que seus dados sejam lidos por qualquer sistema.</p>
            </div>
            <div className="flex items-start gap-2 text-responsive-xs">
              <span className="text-primary font-bold">✓</span>
              <p><strong>Recomendação:</strong> Faça backup semanalmente e guarde o arquivo em um local seguro (nuvem ou pendrive).</p>
            </div>
            <div className="flex items-start gap-2 text-responsive-xs">
              <span className="text-primary font-bold">✓</span>
              <p><strong>Restauração:</strong> Use a função de importar apenas em caso de perda de dados ou migração de conta.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
