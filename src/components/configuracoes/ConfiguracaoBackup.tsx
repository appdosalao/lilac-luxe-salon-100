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
  File
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
        backup_automatico: configuracaoBackup?.backup_automatico || false,
        frequencia_backup: configuracaoBackup?.frequencia_backup || 'semanal',
        dia_backup: configuracaoBackup?.dia_backup || 1,
        hora_backup: configuracaoBackup?.hora_backup || '02:00',
        email_backup: configuracaoBackup?.email_backup || '',
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando configurações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Exportar Dados */}
      <Card>
        <CardHeader className="p-responsive">
          <CardTitle className="flex items-center gap-2 text-responsive-lg">
            <Download className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
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
                    className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-all touch-manipulation ${
                      formatoExport === formato.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="font-semibold text-responsive-sm">{formato.label}</span>
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
                <div key={item.key} className="flex items-center space-x-2 p-2 sm:p-3 border rounded-lg touch-manipulation">
                  <Switch
                    id={item.key}
                    checked={localConfig[item.key as keyof typeof localConfig] as boolean}
                    onCheckedChange={(checked) =>
                      setLocalConfig(prev => ({ ...prev, [item.key]: checked }))
                    }
                  />
                  <Label htmlFor={item.key} className="text-responsive-xs cursor-pointer flex-1 select-none">
                    {item.icon} {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={() => salvarBackup(localConfig)} 
            variant="outline"
            className="w-full btn-touch"
          >
            <Save className="h-4 w-4 mr-2" />
            <span className="text-responsive-sm">Salvar Preferências de Backup</span>
          </Button>

          <Button 
            onClick={exportarDados} 
            disabled={realizandoBackup}
            className="w-full btn-touch"
            size="lg"
          >
            {realizandoBackup ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-pulse" />
                <span className="text-responsive-sm">Preparando backup...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                <span className="text-responsive-sm">Exportar em {formatoExport.toUpperCase()}</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Importar Dados */}
      <Card>
        <CardHeader className="p-responsive">
          <CardTitle className="flex items-center gap-2 text-responsive-lg">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Importar Dados
          </CardTitle>
          <CardDescription className="text-responsive-sm">
            Restaure seus dados a partir de um arquivo de backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-responsive">
          <Alert>
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="text-responsive-xs">
              A importação irá adicionar os dados do backup ao sistema. Dados duplicados serão atualizados.
              Atualmente suportamos apenas importação de arquivos JSON.
            </AlertDescription>
          </Alert>

          <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center touch-manipulation">
            <input
              type="file"
              id="file-upload"
              accept=".json,.csv,.sql"
              onChange={importarDados}
              disabled={importando}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              {importando ? (
                <>
                  <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-pulse" />
                  <p className="font-medium text-responsive-base">Importando dados...</p>
                  <p className="text-responsive-sm text-muted-foreground">Aguarde, isso pode levar alguns instantes</p>
                </>
              ) : (
                <>
                  <File className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                  <p className="font-medium text-responsive-base">Clique para selecionar arquivo</p>
                  <p className="text-responsive-sm text-muted-foreground">
                    Suporta: JSON, CSV, SQL (máx. 10MB)
                  </p>
                </>
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Backup Automático */}
      <Card>
        <CardHeader className="p-responsive">
          <CardTitle className="flex items-center gap-2 text-responsive-lg">
            <Database className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Backup Automático Programado
          </CardTitle>
          <CardDescription className="text-responsive-sm">
            Configure backups automáticos periódicos dos seus dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-responsive">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex-1 min-w-0">
              <Label className="text-responsive-base font-medium">Ativar Backup Automático</Label>
              <p className="text-responsive-xs text-muted-foreground mt-1">
                Quando ativado, você será notificado para fazer backup
              </p>
            </div>
            <Switch
              checked={localConfig.backup_automatico || false}
              onCheckedChange={(checked) => {
                const newConfig = { ...localConfig, backup_automatico: checked };
                setLocalConfig(newConfig);
                salvarBackup(newConfig);
              }}
              className="flex-shrink-0"
            />
          </div>

          {localConfig.backup_automatico && (
            <>
              <div className="space-y-3">
                <Label className="text-responsive-sm">Frequência do Backup:</Label>
                <Select
                  value={configuracaoBackup?.frequencia_backup || 'semanal'}
                  onValueChange={(value) => {
                    const newConfig = { ...localConfig, frequencia_backup: value as 'diario' | 'semanal' | 'mensal' };
                    setLocalConfig(newConfig);
                    salvarBackup(newConfig);
                  }}
                >
                  <SelectTrigger className="select-responsive">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diariamente</SelectItem>
                    <SelectItem value="semanal">Semanalmente</SelectItem>
                    <SelectItem value="mensal">Mensalmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {configuracaoBackup?.frequencia_backup === 'semanal' && (
                <div className="space-y-3">
                  <Label className="text-responsive-sm">Dia da Semana:</Label>
                  <Select
                    value={configuracaoBackup?.dia_backup?.toString() || '0'}
                    onValueChange={(value) => {
                      const newConfig = { ...localConfig, dia_backup: parseInt(value) };
                      setLocalConfig(newConfig);
                      salvarBackup(newConfig);
                    }}
                  >
                    <SelectTrigger className="select-responsive">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Domingo</SelectItem>
                      <SelectItem value="1">Segunda-feira</SelectItem>
                      <SelectItem value="2">Terça-feira</SelectItem>
                      <SelectItem value="3">Quarta-feira</SelectItem>
                      <SelectItem value="4">Quinta-feira</SelectItem>
                      <SelectItem value="5">Sexta-feira</SelectItem>
                      <SelectItem value="6">Sábado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {configuracaoBackup?.frequencia_backup === 'mensal' && (
                <div className="space-y-3">
                  <Label className="text-responsive-sm">Dia do Mês:</Label>
                  <Input
                    type="number"
                    min="1"
                    max="28"
                    value={configuracaoBackup?.dia_backup || 1}
                    onChange={(e) => {
                      const newConfig = { ...localConfig, dia_backup: parseInt(e.target.value) };
                      setLocalConfig(newConfig);
                    }}
                    onBlur={() => salvarBackup(localConfig)}
                    className="input-responsive"
                  />
                  <p className="text-responsive-xs text-muted-foreground">
                    Escolha entre 1 e 28 (evita problemas com meses diferentes)
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-responsive-sm">Horário do Backup:</Label>
                <Input
                  type="time"
                  value={configuracaoBackup?.hora_backup || '02:00'}
                  onChange={(e) => {
                    const newConfig = { ...localConfig, hora_backup: e.target.value };
                    setLocalConfig(newConfig);
                  }}
                  onBlur={() => salvarBackup(localConfig)}
                  className="input-responsive"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-responsive-sm">Email para Notificação (opcional):</Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={configuracaoBackup?.email_backup || ''}
                  onChange={(e) => {
                    const newConfig = { ...localConfig, email_backup: e.target.value };
                    setLocalConfig(newConfig);
                  }}
                  onBlur={() => salvarBackup(localConfig)}
                  className="input-responsive"
                />
                <p className="text-responsive-xs text-muted-foreground">
                  Receba lembretes por email quando for hora de fazer backup
                </p>
              </div>

              {configuracaoBackup?.ultimo_backup && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <AlertDescription className="text-responsive-xs">
                    Último backup realizado em: {new Date(configuracaoBackup.ultimo_backup).toLocaleString('pt-BR')}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Informações de Segurança */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardHeader className="p-responsive">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100 text-responsive-lg">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-responsive">
          <p className="text-responsive-xs text-blue-700 dark:text-blue-300">✅ <strong>Segurança:</strong> Os backups são gerados localmente no seu dispositivo</p>
          <p className="text-responsive-xs text-blue-700 dark:text-blue-300">✅ <strong>Privacidade:</strong> Nenhum dado é enviado para servidores externos</p>
          <p className="text-responsive-xs text-blue-700 dark:text-blue-300">✅ <strong>Formatos:</strong> JSON é recomendado para backup completo, CSV para análise em planilhas</p>
          <p className="text-responsive-xs text-blue-700 dark:text-blue-300">✅ <strong>Frequência:</strong> Recomendamos fazer backups semanalmente</p>
          <p className="text-responsive-xs text-blue-700 dark:text-blue-300">⚠️ <strong>Atenção:</strong> Guarde seus backups em local seguro</p>
        </CardContent>
      </Card>
    </div>
  );
}
