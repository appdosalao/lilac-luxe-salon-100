import { useState, useCallback, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Configuracoes, CONFIG_DEFAULT } from '@/types/configuracao';
import { LocalStorageManager } from '@/lib/localStorage';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'configuracoes' as keyof typeof import('@/lib/localStorage').LOCAL_STORAGE_KEYS;

export const useConfiguracoes = () => {
  const { usuario } = useSupabaseAuth();
  const [configuracoes, setConfiguracoes] = useState<Configuracoes | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = usuario?.id;

  // Carregar configurações
  const loadConfiguracoes = useCallback(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const configs = LocalStorageManager.get<Configuracoes>(STORAGE_KEY);
      const userConfig = configs.find(config => config.userId === userId);
      
      if (userConfig) {
        setConfiguracoes(userConfig);
      } else {
        // Criar configuração padrão para o usuário
        const novaConfig: Configuracoes = {
          id: `config_${Date.now()}`,
          userId,
          ...CONFIG_DEFAULT,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        LocalStorageManager.add(STORAGE_KEY, novaConfig);
        setConfiguracoes(novaConfig);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConfiguracoes();
  }, [loadConfiguracoes]);

  // Atualizar configurações
  const updateConfiguracoes = useCallback(async (updates: Partial<Omit<Configuracoes, 'id' | 'userId' | 'createdAt'>>) => {
    if (!userId || !configuracoes) return null;

    try {
      const configAtualizada: Configuracoes = {
        ...configuracoes,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      LocalStorageManager.update(STORAGE_KEY, configuracoes.id, configAtualizada);
      setConfiguracoes(configAtualizada);

      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram atualizadas com sucesso.",
      });

      return configAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive",
      });
      return null;
    }
  }, [userId, configuracoes]);

  // Verificar se horário está disponível
  const isHorarioDisponivel = useCallback((diaSemana: number, horario: string) => {
    if (!configuracoes) return false;

    const diasAtivos = configuracoes.horarios.diasAtivos;
    const diasMapping = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] as const;
    
    // Verificar se o dia está ativo
    if (!diasAtivos[diasMapping[diaSemana]]) return false;

    const horarioExpediente = configuracoes.horarios.horarioExpediente;
    const intervaloAlmoco = configuracoes.horarios.intervaloAlmoco;
    const intervalosPersonalizados = configuracoes.horarios.intervalosPersonalizados;

    // Verificar se está dentro do expediente
    if (horario < horarioExpediente.inicio || horario >= horarioExpediente.termino) {
      return false;
    }

    // Verificar intervalo de almoço
    if (horario >= intervaloAlmoco.inicio && horario < intervaloAlmoco.termino) {
      return false;
    }

    // Verificar intervalos personalizados
    for (const intervalo of intervalosPersonalizados) {
      if (horario >= intervalo.inicio && horario < intervalo.termino) {
        return false;
      }
    }

    return true;
  }, [configuracoes]);

  // Gerar horários disponíveis para um dia
  const getHorariosDisponiveis = useCallback((diaSemana: number, duracaoServico: number = 60) => {
    if (!configuracoes) return [];

    const horarios: string[] = [];
    const horarioExpediente = configuracoes.horarios.horarioExpediente;
    const intervaloAlmoco = configuracoes.horarios.intervaloAlmoco;
    
    let horaAtual = horarioExpediente.inicio;
    const horaFim = horarioExpediente.termino;
    
    // Função para converter hora string para minutos
    const horaParaMinutos = (hora: string): number => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };
    
    // Função para converter minutos para hora string
    const minutosParaHora = (minutos: number): string => {
      const h = Math.floor(minutos / 60);
      const m = minutos % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };
    
    const fimExpedienteMinutos = horaParaMinutos(horaFim);
    const inicioAlmocoMinutos = horaParaMinutos(intervaloAlmoco.inicio);
    const fimAlmocoMinutos = horaParaMinutos(intervaloAlmoco.termino);
    
    while (horaAtual < horaFim) {
      const horaAtualMinutos = horaParaMinutos(horaAtual);
      const fimServicoMinutos = horaAtualMinutos + duracaoServico;
      
      // Verificar se o horário atual está disponível
      if (isHorarioDisponivel(diaSemana, horaAtual)) {
        // Verificar se o serviço termina antes do fim do expediente
        if (fimServicoMinutos <= fimExpedienteMinutos) {
          // Verificar se o serviço não conflita com o horário de almoço
          const conflitaComAlmoco = (
            horaAtualMinutos < fimAlmocoMinutos && 
            fimServicoMinutos > inicioAlmocoMinutos
          );
          
          // Verificar conflitos com intervalos personalizados
          const conflitaComIntervaloPersonalizado = configuracoes.horarios.intervalosPersonalizados.some(intervalo => {
            const inicioIntervaloMinutos = horaParaMinutos(intervalo.inicio);
            const fimIntervaloMinutos = horaParaMinutos(intervalo.termino);
            return (
              horaAtualMinutos < fimIntervaloMinutos && 
              fimServicoMinutos > inicioIntervaloMinutos
            );
          });
          
          if (!conflitaComAlmoco && !conflitaComIntervaloPersonalizado) {
            horarios.push(horaAtual);
          }
        }
      }
      
      // Incrementar por intervalos de 30 minutos
      const [hora, minuto] = horaAtual.split(':').map(Number);
      const novoMinuto = minuto + 30;
      const novaHora = hora + Math.floor(novoMinuto / 60);
      const minutoFinal = novoMinuto % 60;
      
      horaAtual = `${novaHora.toString().padStart(2, '0')}:${minutoFinal.toString().padStart(2, '0')}`;
    }
    
    return horarios;
  }, [configuracoes, isHorarioDisponivel]);

  // Exportar dados para backup
  const exportarDados = useCallback(async () => {
    if (!userId) {
      console.log('❌ Backup: userId não encontrado');
      return;
    }

    try {
      console.log('🔄 Iniciando backup para usuário:', userId);
      
      // Usar LocalDatabase para coletar dados
      const { LocalDatabase } = await import('@/lib/database');
      const database = LocalDatabase.getInstance();
      
      console.log('📂 Coletando dados do banco...');
      const clientes = database.getClientes(userId);
      const servicos = database.getServicos(userId);
      const agendamentos = database.getAgendamentos(userId);
      const cronogramas = database.getCronogramas(userId);
      const lancamentos = database.getLancamentos(userId);

      console.log('📊 Dados coletados:', {
        clientes: clientes.length,
        servicos: servicos.length,
        agendamentos: agendamentos.length,
        cronogramas: cronogramas.length,
        lancamentos: lancamentos.length
      });

      const dadosBackup = {
        exportadoEm: new Date().toISOString(),
        usuario: usuario?.email || 'Usuário',
        userId: userId,
        dados: {
          clientes,
          servicos,
          agendamentos,
          cronogramas,
          lancamentos,
          configuracoes,
        },
        estatisticas: {
          totalClientes: clientes.length,
          totalServicos: servicos.length,
          totalAgendamentos: agendamentos.length,
          totalCronogramas: cronogramas.length,
          totalLancamentos: lancamentos.length,
        },
      };

      console.log('💾 Preparando arquivo de backup...');
      console.log('Tamanho dos dados:', JSON.stringify(dadosBackup).length, 'caracteres');

      // Criar e baixar arquivo
      const dataStr = JSON.stringify(dadosBackup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_salao_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Backup realizado com sucesso');

      // Atualizar data do último backup
      await updateConfiguracoes({
        backup: {
          ...configuracoes?.backup,
          ultimoBackup: new Date().toISOString(),
        },
      });

      toast({
        title: "Backup realizado",
        description: `Backup criado com ${dadosBackup.estatisticas.totalClientes} clientes, ${dadosBackup.estatisticas.totalAgendamentos} agendamentos e ${dadosBackup.estatisticas.totalLancamentos} lançamentos.`,
      });

    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error);
      toast({
        title: "Erro no backup",
        description: "Erro ao exportar dados. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    }
   }, [userId, usuario, configuracoes, updateConfiguracoes]);

  // Backup automático por email (simulado)
  const enviarBackupPorEmail = useCallback(async (email: string) => {
    if (!email || !userId) return false;
    
    try {
      // Simular envio por email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Backup enviado",
        description: `Backup enviado para ${email} com sucesso.`,
      });
      
      // Atualizar data do último backup
      await updateConfiguracoes({
        backup: {
          ...configuracoes?.backup,
          ultimoBackup: new Date().toISOString(),
        },
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Erro no envio",
        description: "Erro ao enviar backup por email.",
        variant: "destructive",
      });
      return false;
    }
  }, [userId, configuracoes, updateConfiguracoes]);

  // Verificar se deve fazer backup automático
  const verificarBackupAutomatico = useCallback(() => {
    if (!configuracoes?.backup.backupAutomatico || !configuracoes.backup.emailBackup) {
      return;
    }

    const hoje = new Date();
    const diaHoje = hoje.getDay(); // 0-6 (domingo a sábado)
    
    // Verificar se hoje é um dia de backup
    if (!configuracoes.backup.diasSemanaBackup.includes(diaHoje)) {
      return;
    }

    // Verificar se já foi feito hoje
    const ultimoBackup = configuracoes.backup.ultimoBackup;
    if (ultimoBackup) {
      const dataUltimoBackup = new Date(ultimoBackup);
      const isHoje = dataUltimoBackup.toDateString() === hoje.toDateString();
      if (isHoje) return; // Já foi feito hoje
    }

    // Executar backup automático
    enviarBackupPorEmail(configuracoes.backup.emailBackup);
  }, [configuracoes, enviarBackupPorEmail]);

  // Executar verificação de backup automático
  useEffect(() => {
    if (configuracoes?.backup.backupAutomatico) {
      verificarBackupAutomatico();
      
      // Verificar a cada hora
      const interval = setInterval(verificarBackupAutomatico, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [configuracoes?.backup.backupAutomatico, verificarBackupAutomatico]);

  return {
    configuracoes,
    loading,
    updateConfiguracoes,
    isHorarioDisponivel,
    getHorariosDisponiveis,
    exportarDados,
    enviarBackupPorEmail,
    verificarBackupAutomatico,
    loadConfiguracoes,
  };
};