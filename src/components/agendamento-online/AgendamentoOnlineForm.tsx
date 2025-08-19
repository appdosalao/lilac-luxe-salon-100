import * as React from 'react';
import { useAgendamentoOnline } from '@/hooks/useAgendamentoOnline';
import { useSupabaseConfiguracoes } from '@/hooks/useSupabaseConfiguracoes';
import { useShare } from '@/hooks/useShare';
import { AgendamentoOnlineForm as FormData, HorarioDisponivel } from '@/types/agendamentoOnline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, User, CheckCircle, Share2, MessageCircle, Copy, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function AgendamentoOnlineForm() {
  const {
    servicosPublicos,
    calcularHorariosDisponiveis,
    criarAgendamento,
    validarEmail,
    validarTelefone,
    formatarTelefone
  } = useAgendamentoOnline();
  
  const { configuracaoHorarios } = useSupabaseConfiguracoes();
  const { canShare, isSharing, shareContent, copyToClipboard } = useShare();

  const [formData, setFormData] = React.useState<FormData>({
    nomeCompleto: '',
    email: '',
    telefone: '',
    servicoId: '',
    data: '',
    horario: '',
    observacoes: ''
  });

  const [horariosDisponiveis, setHorariosDisponiveis] = React.useState<HorarioDisponivel[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [agendamentoDetalhes, setAgendamentoDetalhes] = React.useState<any>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [aceitouTermos, setAceitouTermos] = React.useState(false);

  React.useEffect(() => {
    const calcularHorarios = async () => {
      console.log('=== CALCULANDO HORÁRIOS DISPONÍVEIS ===');
      console.log('servicoId:', formData.servicoId);
      console.log('data:', formData.data);
      console.log('configuracaoHorarios:', configuracaoHorarios);
      console.log('servicosPublicos:', servicosPublicos);
      
      if (formData.servicoId && formData.data) {
        if (configuracaoHorarios?.length > 0) {
          // Usar as configurações de horários do Supabase
          const dataObj = new Date(formData.data + 'T12:00:00');
          const diaSemana = dataObj.getDay();
          const servico = servicosPublicos.find(s => s.id === formData.servicoId);
          const duracaoServico = servico?.duracao || 60;
          
          console.log('Dia da semana:', diaSemana);
          console.log('Duração do serviço:', duracaoServico);
          
          // Buscar configuração para o dia da semana
          const configDia = configuracaoHorarios.find(h => h.dia_semana === diaSemana && h.ativo);
          
          console.log('Configuração encontrada para o dia:', configDia);
          
          if (configDia) {
            // Gerar horários baseados na configuração
            const horarios: HorarioDisponivel[] = [];
            
            // Converter horários para minutos para facilitar o cálculo
            const [horaAbertura, minutoAbertura] = configDia.horario_abertura.split(':').map(Number);
            const [horaFechamento, minutoFechamento] = configDia.horario_fechamento.split(':').map(Number);
            
            const minutoInicioServico = horaAbertura * 60 + minutoAbertura;
            const minutoFimServico = horaFechamento * 60 + minutoFechamento;
            
            // Intervalo de almoço (se existir)
            let minutoInicioIntervalo = null;
            let minutoFimIntervalo = null;
            
            if (configDia.intervalo_inicio && configDia.intervalo_fim) {
              const [horaInicioInt, minutoInicioInt] = configDia.intervalo_inicio.split(':').map(Number);
              const [horaFimInt, minutoFimInt] = configDia.intervalo_fim.split(':').map(Number);
              minutoInicioIntervalo = horaInicioInt * 60 + minutoInicioInt;
              minutoFimIntervalo = horaFimInt * 60 + minutoFimInt;
            }
            
            console.log('Minutos - início:', minutoInicioServico, 'fim:', minutoFimServico);
            console.log('Intervalo - início:', minutoInicioIntervalo, 'fim:', minutoFimIntervalo);
            
            // Gerar horários de 30 em 30 minutos
            for (let minuto = minutoInicioServico; minuto + duracaoServico <= minutoFimServico; minuto += 30) {
              // Verificar se o horário não conflita com o intervalo
              const fimHorario = minuto + duracaoServico;
              
              let dentroIntervalo = false;
              if (minutoInicioIntervalo !== null && minutoFimIntervalo !== null) {
                // Verificar se há sobreposição com o intervalo
                dentroIntervalo = (minuto < minutoFimIntervalo) && (fimHorario > minutoInicioIntervalo);
              }
              
              if (!dentroIntervalo) {
                const hora = Math.floor(minuto / 60);
                const min = minuto % 60;
                const horarioStr = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                
                horarios.push({
                  horario: horarioStr,
                  disponivel: true
                });
              }
            }
            
            console.log('Horários gerados:', horarios);
            setHorariosDisponiveis(horarios);
          } else {
            // Dia não configurado
            console.log('Dia não configurado ou inativo');
            setHorariosDisponiveis([]);
          }
        } else {
          // Fallback para horários calculados pelo hook original
          console.log('Usando fallback - configurações não disponíveis');
          try {
            const horariosCalculados = await calcularHorariosDisponiveis(formData.servicoId, formData.data);
            console.log('Horários calculados via fallback:', horariosCalculados);
            setHorariosDisponiveis(horariosCalculados);
          } catch (error) {
            console.error('Erro ao calcular horários:', error);
            setHorariosDisponiveis([]);
          }
        }
      } else {
        console.log('Serviço ou data não selecionados');
        setHorariosDisponiveis([]);
      }
    };

    calcularHorarios();
  }, [formData.servicoId, formData.data, configuracaoHorarios, servicosPublicos, calcularHorariosDisponiveis]);

  const dataMinima = new Date().toISOString().split('T')[0];

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'nomeCompleto':
        if (!value.trim()) newErrors.nomeCompleto = 'Nome obrigatório';
        else delete newErrors.nomeCompleto;
        break;
      case 'email':
        if (!value) newErrors.email = 'E-mail obrigatório';
        else if (!validarEmail(value)) newErrors.email = 'E-mail inválido';
        else delete newErrors.email;
        break;
      case 'telefone':
        if (!value) newErrors.telefone = 'Telefone obrigatório';
        else if (!validarTelefone(value)) newErrors.telefone = 'Telefone inválido';
        else delete newErrors.telefone;
        break;
      case 'servicoId':
        if (!value) newErrors.servicoId = 'Selecione um serviço';
        else delete newErrors.servicoId;
        break;
      case 'data':
        if (!value) {
          newErrors.data = 'Selecione uma data';
        } else if (configuracaoHorarios?.length > 0) {
          // Verificar se o dia da semana está ativo nas configurações
          const dataObj = new Date(value + 'T12:00:00');
          const diaSemana = dataObj.getDay();
          const configDia = configuracaoHorarios.find(h => h.dia_semana === diaSemana && h.ativo);
          
          if (!configDia) {
            const diasAtivos = configuracaoHorarios
              .filter(h => h.ativo)
              .map(h => {
                const nomesDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                return nomesDias[h.dia_semana];
              });
            newErrors.data = `Atendemos apenas: ${diasAtivos.join(', ')}`;
          } else {
            delete newErrors.data;
          }
        } else {
          delete newErrors.data;
        }
        break;
      case 'horario':
        if (!value) newErrors.horario = 'Selecione um horário';
        else delete newErrors.horario;
        break;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'telefone') {
      value = formatarTelefone(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== HANDLE SUBMIT INICIADO ===');
    console.log('FormData atual:', formData);
    console.log('Aceitos os termos:', aceitouTermos);
    
    // Validação manual - criar objeto de erros local
    const validationErrors: Record<string, string> = {};
    
    // Validar cada campo obrigatório
    if (!formData.nomeCompleto.trim()) {
      validationErrors.nomeCompleto = 'Nome obrigatório';
    }
    
    if (!formData.email) {
      validationErrors.email = 'E-mail obrigatório';
    } else if (!validarEmail(formData.email)) {
      validationErrors.email = 'E-mail inválido';
    }
    
    if (!formData.telefone) {
      validationErrors.telefone = 'Telefone obrigatório';
    } else if (!validarTelefone(formData.telefone)) {
      validationErrors.telefone = 'Telefone inválido';
    }
    
    if (!formData.servicoId) {
      validationErrors.servicoId = 'Selecione um serviço';
    }
    
    if (!formData.data) {
      validationErrors.data = 'Selecione uma data';
    } else if (configuracaoHorarios?.length > 0) {
      // Verificar se o dia da semana está ativo nas configurações
      const dataObj = new Date(formData.data + 'T12:00:00');
      const diaSemana = dataObj.getDay();
      const configDia = configuracaoHorarios.find(h => h.dia_semana === diaSemana && h.ativo);
      
      if (!configDia) {
        const diasAtivos = configuracaoHorarios
          .filter(h => h.ativo)
          .map(h => {
            const nomesDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            return nomesDias[h.dia_semana];
          });
        validationErrors.data = `Atendemos apenas: ${diasAtivos.join(', ')}`;
      }
    }
    
    if (!formData.horario) {
      validationErrors.horario = 'Selecione um horário';
    }

    console.log('Erros de validação encontrados:', validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      console.log('Parando por causa de erros de validação');
      setErrors(validationErrors);
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos corretamente.",
        variant: "destructive",
      });
      return;
    }

    if (!aceitouTermos) {
      console.log('Parando por causa dos termos não aceitos');
      toast({
        title: "Aceitar termos obrigatório",
        description: "Você deve aceitar os termos para continuar.",
        variant: "destructive",
      });
      return;
    }

    console.log('Setando isSubmitting para true...');
    setIsSubmitting(true);
    
    try {
      console.log('Chamando criarAgendamento...');
      const sucesso = await criarAgendamento(formData);
      console.log('Resultado de criarAgendamento:', sucesso);
      
      if (sucesso) {
        console.log('Sucesso! Processando dados para tela de sucesso...');
        const servico = servicosPublicos.find(s => s.id === formData.servicoId);
        setAgendamentoDetalhes({
          servico: servico?.nome,
          data: new Date(formData.data).toLocaleDateString('pt-BR'),
          horario: formData.horario,
          nome: formData.nomeCompleto,
          telefone: formData.telefone,
          valor: servico?.valor
        });
        setIsSuccess(true);
        setFormData({
          nomeCompleto: '',
          email: '',
          telefone: '',
          servicoId: '',
          data: '',
          horario: '',
          observacoes: ''
        });
      } else {
        console.log('Agendamento falhou - sucesso foi false');
      }
    } catch (error) {
      console.error('Erro capturado no try/catch:', error);
    } finally {
      console.log('Setando isSubmitting para false...');
      setIsSubmitting(false);
    }
  };

  // Função para compartilhar agendamento via WhatsApp
  const compartilharAgendamento = async () => {
    if (!agendamentoDetalhes) return;
    
    const mensagem = `✅ *Comprovante de Agendamento*\n\n` +
      `👤 *Cliente:* ${agendamentoDetalhes.nome}\n` +
      `💅 *Serviço:* ${agendamentoDetalhes.servico}\n` +
      `📅 *Data:* ${agendamentoDetalhes.data}\n` +
      `🕐 *Horário:* ${agendamentoDetalhes.horario}\n` +
      `💰 *Valor:* R$ ${agendamentoDetalhes.valor?.toFixed(2)}\n\n` +
      `Agendamento confirmado! Nos vemos lá! 😊`;
    
    await shareContent({
      title: "📋 Comprovante de Agendamento",
      text: mensagem
    });
  };

  // Função para compartilhar link do formulário
  const compartilharFormulario = async () => {
    const url = window.location.href;
    const mensagem = `📅 Agende seu horário!\n\nOlá! Use este link para agendar rapidinho:\n\nÉ super fácil e rápido! ✨`;
    
    await shareContent({
      title: "📅 Agende Seu Horário",
      text: mensagem,
      url: url
    });
  };

  // Função para copiar link
  const copiarLink = async () => {
    const url = window.location.href;
    await copyToClipboard(url);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[image:var(--gradient-soft)] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center rounded-3xl shadow-[var(--shadow-elegant)] border-0 bg-gradient-to-br from-card via-card/95 to-accent/10 backdrop-blur-sm overflow-hidden">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-3">
              Agendamento Confirmado!
            </h2>
            <p className="text-xl mb-6">✨ Tudo certo! Nos vemos lá! ✨</p>
            
            {agendamentoDetalhes && (
              <div className="bg-gradient-to-r from-muted/30 to-accent/20 rounded-2xl p-6 mb-8 text-left border border-border/50">
                <h3 className="font-bold mb-4 text-center text-lg flex items-center justify-center gap-2">
                  <span className="text-2xl">📋</span>
                  Detalhes do Agendamento
                </h3>
                <div className="space-y-3 text-base">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💅</span>
                    <div>
                      <span className="font-medium text-muted-foreground">Serviço:</span>
                      <p className="font-semibold">{agendamentoDetalhes.servico}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <div>
                      <span className="font-medium text-muted-foreground">Data:</span>
                      <p className="font-semibold">{agendamentoDetalhes.data}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🕐</span>
                    <div>
                      <span className="font-medium text-muted-foreground">Horário:</span>
                      <p className="font-semibold">{agendamentoDetalhes.horario}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💰</span>
                    <div>
                      <span className="font-medium text-muted-foreground">Valor:</span>
                      <p className="font-semibold text-green-600">R$ {agendamentoDetalhes.valor?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <Button 
                onClick={compartilharAgendamento}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                disabled={isSharing}
              >
                <MessageCircle className="w-6 h-6 mr-3" />
                {isSharing ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Compartilhando...
                  </span>
                ) : (
                  canShare ? '📲 Compartilhar Comprovante' : '📲 Compartilhar via WhatsApp'
                )}
              </Button>
              
              <div className="flex gap-3">
                <Button 
                  onClick={compartilharFormulario}
                  variant="outline" 
                  className="flex-1 h-12 rounded-2xl border-2 hover:bg-primary/5 transition-all"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {canShare ? 'Compartilhar Form' : 'WhatsApp Form'}
                </Button>
                <Button 
                  onClick={copiarLink}
                  variant="outline" 
                  className="flex-1 h-12 rounded-2xl border-2 hover:bg-secondary/5 transition-all"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link
                </Button>
              </div>
              
              <Button 
                onClick={() => setIsSuccess(false)} 
                variant="outline"
                className="w-full h-12 rounded-2xl border-2 hover:bg-accent/10 transition-all"
              >
                <span className="text-lg">🔄</span>
                <span className="ml-2">Fazer Novo Agendamento</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[image:var(--gradient-soft)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-[var(--shadow-elegant)] border-0 rounded-3xl overflow-hidden bg-gradient-to-br from-card via-card/95 to-lilac-lighter/20 backdrop-blur-sm">
          <CardHeader className="text-center bg-[image:var(--gradient-primary)] rounded-t-3xl py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5"></div>
            <div className="relative z-10">
              <div className="text-7xl mb-4 animate-pulse">💅</div>
              <CardTitle className="text-4xl font-bold text-white drop-shadow-lg mb-3">
                Agende Seu Horário
              </CardTitle>
              <CardDescription className="text-white/90 text-lg font-medium">
                Escolha o serviço, data e horário ideal pra você! ✨
              </CardDescription>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 right-4 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
            
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-3 text-primary">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <User className="w-5 h-5" />
                  </div>
                  Seus Dados
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nomeCompleto" className="text-sm font-medium text-muted-foreground">Nome Completo *</Label>
                    <Input
                      id="nomeCompleto"
                      value={formData.nomeCompleto}
                      onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                      placeholder="Seu nome completo"
                      className={`rounded-2xl border-2 h-12 px-4 transition-all ${errors.nomeCompleto ? 'border-destructive' : 'border-border hover:border-primary/30 focus:border-primary'}`}
                    />
                    {errors.nomeCompleto && <p className="text-sm text-destructive mt-1">{errors.nomeCompleto}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-sm font-medium text-muted-foreground">Telefone *</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      placeholder="(11) 99999-9999"
                      className={`rounded-2xl border-2 h-12 px-4 transition-all ${errors.telefone ? 'border-destructive' : 'border-border hover:border-primary/30 focus:border-primary'}`}
                    />
                    {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone}</p>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className={`rounded-2xl border-2 h-12 px-4 transition-all ${errors.email ? 'border-destructive' : 'border-border hover:border-primary/30 focus:border-primary'}`}
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-3 text-primary">
                  <div className="p-2 bg-secondary/20 rounded-full">
                    <span className="text-lg">💅</span>
                  </div>
                  Serviço
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Escolha o Serviço *</Label>
                  <Select value={formData.servicoId} onValueChange={(value) => handleInputChange('servicoId', value)}>
                    <SelectTrigger className={`rounded-2xl border-2 h-12 transition-all ${errors.servicoId ? 'border-destructive' : 'border-border hover:border-primary/30 focus:border-primary'}`}>
                      <SelectValue placeholder="✨ Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {servicosPublicos.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id} className="rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💅</span>
                            <span>{servico.nome} - R$ {servico.valor.toFixed(2)} ({servico.duracao}min)</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.servicoId && <p className="text-sm text-destructive mt-1">{errors.servicoId}</p>}
                </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xl font-bold flex items-center gap-3 text-primary">
                   <div className="p-2 bg-accent/20 rounded-full">
                     <Calendar className="w-5 h-5" />
                   </div>
                   Data e Horário
                 </h3>
                 
                 {configuracaoHorarios && configuracaoHorarios.length > 0 && (
                   <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 dark:bg-blue-900/20 dark:border-blue-800">
                     <div className="text-sm text-blue-700 dark:text-blue-300">
                       <p className="font-medium mb-2">📅 Horários de Atendimento:</p>
                       <div className="grid grid-cols-2 gap-2 text-xs">
                         {configuracaoHorarios.filter(h => h.ativo).map((config) => {
                           const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                           return (
                             <span key={config.dia_semana} className="text-green-600 dark:text-green-400">
                               {nomesDias[config.dia_semana]}: ✓ ({config.horario_abertura}-{config.horario_fechamento})
                             </span>
                           );
                         })}
                       </div>
                       <p className="mt-2 text-xs">
                         🕐 Intervalos podem variar por dia da semana
                       </p>
                     </div>
                   </div>
                 )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label className="text-sm font-medium text-muted-foreground">Data *</Label>
                     <Input
                       type="date"
                       value={formData.data}
                       min={dataMinima}
                         onChange={(e) => handleInputChange('data', e.target.value)}
                       className={`rounded-2xl border-2 h-12 px-4 transition-all ${errors.data ? 'border-destructive' : 'border-border hover:border-primary/30 focus:border-primary'}`}
                     />
                     {errors.data && <p className="text-sm text-destructive mt-1">{errors.data}</p>}
                   </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Horário *</Label>
                    <Select 
                      value={formData.horario} 
                      onValueChange={(value) => handleInputChange('horario', value)}
                      disabled={!formData.servicoId || !formData.data}
                    >
                      <SelectTrigger className={`rounded-2xl border-2 h-12 transition-all ${errors.horario ? 'border-destructive' : 'border-border hover:border-primary/30 focus:border-primary'}`}>
                        <SelectValue placeholder="🕐 Selecione um horário" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {horariosDisponiveis.filter(h => h.disponivel).map((horario) => (
                          <SelectItem key={horario.horario} value={horario.horario} className="rounded-xl">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {horario.horario}
                            </div>
                          </SelectItem>
                         ))}
                         {horariosDisponiveis.length === 0 && formData.data && formData.servicoId && (
                           <SelectItem value="no-horarios-disponiveis" disabled>
                             {configuracaoHorarios?.length ? 'Dia não disponível para atendimento' : 'Nenhum horário disponível'}
                           </SelectItem>
                         )}
                         {horariosDisponiveis.length > 0 && horariosDisponiveis.every(h => !h.disponivel) && (
                           <SelectItem value="no-horarios-disponiveis" disabled>
                             Nenhum horário disponível
                           </SelectItem>
                         )}
                      </SelectContent>
                    </Select>
                    {errors.horario && <p className="text-sm text-destructive mt-1">{errors.horario}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Observações (Opcional)</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="💬 Informações adicionais..."
                  rows={3}
                  className="rounded-2xl border-2 px-4 py-3 transition-all border-border hover:border-primary/30 focus:border-primary resize-none"
                />
              </div>

              {/* Aviso obrigatório */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-3 text-primary">
                  <div className="p-2 bg-yellow-500/20 rounded-full">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  Termos e Condições
                </h3>
                
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
                  <div className="text-base leading-relaxed text-gray-700 mb-4">
                    <p className="font-medium text-lg mb-3 text-center">Olá, querido(a) cliente 💖</p>
                    <p className="mb-3">
                      Para garantir seu horário, pedimos um adiantamento de <span className="font-bold text-yellow-700">R$ 40,00</span>.
                    </p>
                    <p className="mb-3">
                      Caso precise cancelar, o valor não poderá ser devolvido, pois o horário ficará reservado exclusivamente para você.
                    </p>
                    <p className="text-center font-medium">
                      Agradecemos muito a compreensão e confiança 💕✨
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3 pt-4 border-t border-yellow-200">
                    <Checkbox 
                      id="aceitarTermos" 
                      checked={aceitouTermos}
                      onCheckedChange={(checked) => setAceitouTermos(checked as boolean)}
                      className="mt-1"
                    />
                    <Label 
                      htmlFor="aceitarTermos" 
                      className="text-sm font-medium text-gray-700 cursor-pointer leading-relaxed"
                    >
                      Li e aceito os termos e condições descritos acima. Concordo com o pagamento do adiantamento de R$ 40,00 e entendo que este valor não será devolvido em caso de cancelamento. *
                    </Label>
                  </div>
                  
                  {!aceitouTermos && (
                    <p className="text-sm text-yellow-700 mt-2 font-medium">
                      ⚠️ É obrigatório aceitar os termos para prosseguir
                    </p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-2xl bg-[image:var(--gradient-primary)] hover:scale-[1.02] shadow-[var(--shadow-elegant)] hover:shadow-2xl transition-all duration-300 border-0" 
                disabled={isSubmitting}
              >
                <span className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Agendando...
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">✨</span>
                      Confirmar Agendamento
                    </>
                  )}
                </span>
              </Button>
              
              <p className="text-sm text-muted-foreground text-center font-medium">* Campos obrigatórios</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}