import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, Mail, Phone, CreditCard, AlertCircle, Share2, Copy, ArrowRight, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useAgendamentoOnlineService } from '@/hooks/useAgendamentoOnlineService';
import { useHorariosTrabalho } from '@/hooks/useHorariosTrabalho';
import { useShare } from '@/hooks/useShare';
import { useConfiguracoesRealTime } from '@/hooks/useConfiguracoesRealTime';
import { useConfigAgendamentoOnline } from '@/hooks/useConfigAgendamentoOnline';
import { AgendamentoOnlineData, HorarioDisponivel, FormErrors } from '@/types/agendamento-online';
import { supabase } from '@/integrations/supabase/client';
import { ProgressSteps } from './ProgressSteps';
import { SalonHeader } from './SalonHeader';
import { SalonFooter } from './SalonFooter';
import { agendamentoOnlineSchema } from '@/lib/validation';
import { toast } from 'sonner';

export function AgendamentoOnlineForm() {
  const {
    loading,
    servicos,
    carregarServicos,
    calcularHorariosDisponiveis,
    criarAgendamento
  } = useAgendamentoOnlineService();

  const {
    isDiaAtivo,
    loading: loadingHorarios,
    configuracoes
  } = useHorariosTrabalho();

  const { shareContent, copyToClipboard, isSharing } = useShare();
  const { lastUpdate } = useConfiguracoesRealTime();
  const { config: configOnline } = useConfigAgendamentoOnline();

  const [formData, setFormData] = useState<AgendamentoOnlineData>({
    nome_completo: '',
    email: '',
    telefone: '',
    servico_id: '',
    data: '',
    horario: '',
    observacoes: ''
  });

  const [horariosDisponiveis, setHorariosDisponiveis] = useState<HorarioDisponivel[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [taxaAccepted, setTaxaAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = ['Dados', 'Agendamento', 'Finalização'];

  useEffect(() => {
    carregarServicos();
  }, [carregarServicos]);

  useEffect(() => {
    console.log('Configurações carregadas:', { 
      total: configuracoes.length,
      loading: loadingHorarios,
      items: configuracoes
    });
  }, [configuracoes, loadingHorarios]);

  useEffect(() => {
    if (formData.servico_id && formData.data) {
      carregarHorariosDisponiveis();
    }
  }, [formData.servico_id, formData.data]);

  const carregarHorariosDisponiveis = async () => {
    if (!formData.servico_id || !formData.data) return;

    const servicoSelecionado = servicos.find(s => s.id === formData.servico_id);
    if (!servicoSelecionado) return;

    const dataSelecionada = new Date(formData.data + 'T00:00:00');
    const diaSemana = dataSelecionada.getDay();

    console.log('Debug - Carregando horários:', {
      data: formData.data,
      diaSemana,
      servicoId: formData.servico_id,
      servicoNome: servicoSelecionado.nome,
      servicoDuracao: servicoSelecionado.duracao,
      isDiaAtivo: isDiaAtivo(diaSemana)
    });

    if (!isDiaAtivo(diaSemana)) {
      console.log('Dia não está ativo:', diaSemana);
      setHorariosDisponiveis([]);
      return;
    }

    const horariosDisponiveis = await calcularHorariosDisponiveis(formData.servico_id!, formData.data);
    console.log('Horários disponíveis considerando duração:', horariosDisponiveis);
    setHorariosDisponiveis(horariosDisponiveis);
  };

  const formatarTelefone = (valor: string): string => {
    const digits = valor.replace(/\D/g, '');
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  useEffect(() => {
    if (formData.servico_id && formData.data) {
      const channel = supabase
        .channel('configuracoes_horarios_online')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'configuracoes_horarios'
        }, () => {
          console.log('Configurações de horário atualizadas - recarregando horários disponíveis');
          carregarHorariosDisponiveis();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [formData.servico_id, formData.data, carregarHorariosDisponiveis, lastUpdate]);

  const handleInputChange = (field: keyof AgendamentoOnlineData, value: string) => {
    if (field === 'telefone') {
      value = formatarTelefone(value);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      const newErrors: FormErrors = {};
      if (!formData.nome_completo.trim()) newErrors.nome_completo = 'Nome completo é obrigatório';
      if (!formData.email.trim()) {
        newErrors.email = 'Email é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
      if (!formData.telefone.trim()) {
        newErrors.telefone = 'Telefone é obrigatório';
      } else if (formData.telefone.replace(/\D/g, '').length < 10) {
        newErrors.telefone = 'Telefone inválido';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    if (currentStep === 2) {
      const newErrors: FormErrors = {};
      if (!formData.servico_id) newErrors.servico_id = 'Selecione um serviço';
      if (!formData.data) newErrors.data = 'Selecione uma data';
      if (!formData.horario) newErrors.horario = 'Selecione um horário';
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      toast.error('Você deve aceitar os termos e condições para continuar.');
      return;
    }
    if (!taxaAccepted) {
      toast.error('Você deve aceitar as condições da taxa antecipada para continuar.');
      return;
    }

    // Validate and sanitize input with zod
    try {
      const validatedData = agendamentoOnlineSchema.parse(formData);
      setIsSubmitting(true);
      const sucesso = await criarAgendamento(validatedData as AgendamentoOnlineData);
      
      if (sucesso) {
        setSuccess(true);
      } else {
        setSuccess(false);
      }
      setIsSubmitting(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
        toast.error('Por favor, corrija os erros no formulário');
      } else {
        toast.error('Erro ao validar dados do formulário');
      }
      setIsSubmitting(false);
    }
  };

  const hoje = new Date();
  const dataMinima = hoje.toISOString().split('T')[0];
  const dataMaxima = new Date(hoje.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const servicoSelecionado = servicos.find(s => s.id === formData.servico_id);

  const compartilharComprovante = async () => {
    const dataFormatada = new Date(formData.data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const comprovanteTexto = `🎉 *AGENDAMENTO CONFIRMADO*

📋 *Detalhes do Agendamento:*
👤 Cliente: ${formData.nome_completo}
💇 Serviço: ${servicoSelecionado?.nome}
📅 Data: ${dataFormatada}
⏰ Horário: ${formData.horario}
💰 Valor: R$ ${servicoSelecionado?.valor.toFixed(2).replace('.', ',')}

✅ Seu agendamento foi confirmado com sucesso!
Você receberá uma confirmação em breve.

📱 Guarde este comprovante para apresentar no dia do atendimento.`;

    await shareContent({
      title: "Comprovante de Agendamento",
      text: comprovanteTexto
    });
  };

  const copiarComprovante = async () => {
    const dataFormatada = new Date(formData.data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const comprovanteTexto = `🎉 AGENDAMENTO CONFIRMADO

📋 Detalhes do Agendamento:
👤 Cliente: ${formData.nome_completo}
💇 Serviço: ${servicoSelecionado?.nome}
📅 Data: ${dataFormatada}
⏰ Horário: ${formData.horario}
💰 Valor: R$ ${servicoSelecionado?.valor.toFixed(2).replace('.', ',')}

✅ Seu agendamento foi confirmado com sucesso!
Você receberá uma confirmação em breve.

📱 Guarde este comprovante para apresentar no dia do atendimento.`;

    await copyToClipboard(comprovanteTexto);
  };

  const isDataDisponivel = (data: string) => {
    if (!data) return false;
    const dataSelecionada = new Date(data + 'T00:00:00');
    const diaSemana = dataSelecionada.getDay();
    
    return isDiaAtivo(diaSemana);
  };

  if (success) {
    return (
      <>
        <SalonHeader />
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl text-success">Agendamento Confirmado!</CardTitle>
              <CardDescription>
                Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>Serviço:</strong> {servicoSelecionado?.nome}</p>
                <p><strong>Data:</strong> {new Date(formData.data).toLocaleDateString('pt-BR')}</p>
                <p><strong>Horário:</strong> {formData.horario}</p>
                <p><strong>Valor:</strong> R$ {servicoSelecionado?.valor.toFixed(2)}</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={compartilharComprovante}
                  disabled={isSharing}
                  className="w-full flex items-center gap-2 bg-success hover:bg-success/90"
                >
                  <Share2 className="w-4 h-4" />
                  {isSharing ? 'Compartilhando...' : 'Compartilhar Comprovante'}
                </Button>
                
                <Button 
                  onClick={copiarComprovante}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Comprovante
                </Button>
              </div>
              
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                Fazer Novo Agendamento
              </Button>
            </CardContent>
          </Card>
        </div>
        <SalonFooter />
      </>
    );
  }

  return (
    <>
      <SalonHeader />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 pb-0">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <ProgressSteps currentStep={currentStep} steps={steps} />
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Dados Pessoais */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Seus Dados
                    </h3>
                  
                    <div>
                      <Label htmlFor="nome_completo">Nome Completo *</Label>
                      <Input
                        id="nome_completo"
                        value={formData.nome_completo}
                        onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                        placeholder="Seu nome completo"
                        className={errors.nome_completo ? 'border-destructive' : ''}
                      />
                      {errors.nome_completo && (
                        <span className="text-sm text-destructive">{errors.nome_completo}</span>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="seu@email.com"
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <span className="text-sm text-destructive">{errors.email}</span>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        className={errors.telefone ? 'border-destructive' : ''}
                      />
                      {errors.telefone && (
                        <span className="text-sm text-destructive">{errors.telefone}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Serviço e Agendamento */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Agendamento
                    </h3>

                    <div>
                      <Label htmlFor="servico_id">Serviço *</Label>
                      <Select onValueChange={(value) => handleInputChange('servico_id', value)}>
                        <SelectTrigger className={errors.servico_id ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Selecione um serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicos.map((servico) => (
                            <SelectItem key={servico.id} value={servico.id}>
                              {servico.nome} - R$ {servico.valor.toFixed(2)} ({servico.duracao}min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.servico_id && (
                        <span className="text-sm text-destructive">{errors.servico_id}</span>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="data">Data *</Label>
                      <Input
                        id="data"
                        type="date"
                        min={dataMinima}
                        max={dataMaxima}
                        value={formData.data}
                        onChange={(e) => handleInputChange('data', e.target.value)}
                        className={errors.data ? 'border-destructive' : ''}
                      />
                      {errors.data && (
                        <span className="text-sm text-destructive">{errors.data}</span>
                      )}
                      {formData.data && !isDataDisponivel(formData.data) && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Esta data não está disponível para agendamentos. Escolha outro dia.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="horario">Horário *</Label>
                      <Select 
                        onValueChange={(value) => handleInputChange('horario', value)}
                        disabled={!formData.servico_id || !formData.data || !isDataDisponivel(formData.data)}
                      >
                        <SelectTrigger className={errors.horario ? 'border-destructive' : ''}>
                          <SelectValue placeholder={
                            !formData.servico_id || !formData.data 
                              ? "Selecione um serviço e data primeiro" 
                              : !isDataDisponivel(formData.data)
                              ? "Data indisponível"
                              : horariosDisponiveis.length === 0
                              ? "Nenhum horário disponível"
                              : "Selecione um horário"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {horariosDisponiveis.length > 0 ? (
                            horariosDisponiveis.map((horario) => (
                              <SelectItem 
                                key={horario.horario} 
                                value={horario.horario}
                                disabled={!horario.disponivel}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{horario.horario}</span>
                                  {!horario.disponivel && (
                                    <span className="text-xs text-muted-foreground ml-2">(Ocupado)</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              Nenhum horário disponível
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {errors.horario && (
                        <span className="text-sm text-destructive">{errors.horario}</span>
                      )}
                      {servicoSelecionado && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Duração do serviço: {servicoSelecionado.duracao} minutos
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="observacoes">Observações (opcional)</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                        placeholder="Alguma observação ou preferência?"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Condições e Finalização */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    {/* Resumo do Agendamento */}
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Resumo do Agendamento
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Nome:</strong> {formData.nome_completo}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Telefone:</strong> {formData.telefone}</p>
                        <p><strong>Serviço:</strong> {servicoSelecionado?.nome}</p>
                        <p><strong>Data:</strong> {formData.data ? new Date(formData.data).toLocaleDateString('pt-BR') : '-'}</p>
                        <p><strong>Horário:</strong> {formData.horario}</p>
                        <p><strong>Valor:</strong> R$ {servicoSelecionado?.valor.toFixed(2)}</p>
                        {formData.observacoes && (
                          <p><strong>Observações:</strong> {formData.observacoes}</p>
                        )}
                      </div>
                    </div>

                    {/* Condições e Termos */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Condições
                      </h3>
                      
                      <Alert className="border-primary/20 bg-primary/5">
                        <CreditCard className="h-4 w-4" />
                        <AlertDescription className="text-sm leading-relaxed">
                          <div className="flex items-start space-x-2 mt-2">
                            <Checkbox
                              id="taxa"
                              checked={taxaAccepted}
                              onCheckedChange={(checked) => setTaxaAccepted(checked as boolean)}
                              className="mt-0.5"
                            />
                            <Label htmlFor="taxa" className="text-sm leading-relaxed cursor-pointer">
                              Oi, tudo bem? 💙 Para garantir seu horário pedimos uma taxa antecipada de R$40,00. 
                              Fique tranquilo(a): esse valor é abatido do serviço no dia do atendimento 😉. 
                              Só não conseguimos devolver em caso de cancelamento sem justificativa, tá bom? *
                            </Label>
                          </div>
                        </AlertDescription>
                      </Alert>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="terms"
                          checked={termsAccepted}
                          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                        />
                        <Label htmlFor="terms" className="text-sm leading-5">
                          Aceito os termos e condições e concordo em receber confirmações por email e WhatsApp *
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  {currentStep > 1 && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  )}

                  {currentStep < 3 ? (
                    <Button 
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1"
                    >
                      Próximo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isSubmitting || !termsAccepted || !taxaAccepted}
                    >
                      {isSubmitting ? 'Enviando...' : 'Confirmar Agendamento'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <SalonFooter />
    </>
  );
}
