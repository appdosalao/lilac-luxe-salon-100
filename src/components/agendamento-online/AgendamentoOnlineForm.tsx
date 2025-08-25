import * as React from 'react';

const { useState, useEffect } = React;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, Mail, Phone, MapPin, CreditCard, AlertCircle, Share2, Copy } from 'lucide-react';
import { useAgendamentoOnlineService } from '@/hooks/useAgendamentoOnlineService';
import { useHorariosTrabalho } from '@/hooks/useHorariosTrabalho';
import { useShare } from '@/hooks/useShare';
import { useConfiguracoesRealTime } from '@/hooks/useConfiguracoesRealTime';
import { AgendamentoOnlineData, HorarioDisponivel, FormErrors } from '@/types/agendamento-online';
import { supabase } from '@/integrations/supabase/client';

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
    getHorariosDisponiveis,
    isAgendamentoValido,
    loading: loadingHorarios,
    configuracoes
  } = useHorariosTrabalho(); // Para agendamento online, usar o primeiro usuário disponível

  const { shareContent, copyToClipboard, isSharing } = useShare();
  const { lastUpdate } = useConfiguracoesRealTime();

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
      configuracoes: configuracoes.length,
      isDiaAtivo: isDiaAtivo(diaSemana)
    });

    // Verificar se o dia está ativo para atendimento
    if (!isDiaAtivo(diaSemana)) {
      console.log('Dia não está ativo:', diaSemana);
      setHorariosDisponiveis([]);
      return;
    }

    // Obter horários disponíveis baseados na configuração de trabalho
    const horariosDoSistema = getHorariosDisponiveis(diaSemana, servicoSelecionado.duracao);
    
    console.log('Horários do sistema:', horariosDoSistema);

    if (horariosDoSistema.length === 0) {
      console.log('Nenhum horário disponível no sistema');
      setHorariosDisponiveis([]);
      return;
    }

    // Verificar disponibilidade real com agendamentos existentes
    const horariosComDisponibilidade = await calcularHorariosDisponiveis(formData.servico_id!, formData.data);
    
    console.log('Horários com disponibilidade:', horariosComDisponibilidade);

    setHorariosDisponiveis(horariosComDisponibilidade);
  };

  const formatarTelefone = (valor: string): string => {
    const digits = valor.replace(/\D/g, '');
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  // Revalidar horários quando configurações de trabalho mudarem via real-time
  useEffect(() => {
    if (formData.servico_id && formData.data) {
      // Subscription para mudanças nas configurações de horários
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

  const validarFormulario = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    }

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

    if (!formData.servico_id) {
      newErrors.servico_id = 'Selecione um serviço';
    }

    if (!formData.data) {
      newErrors.data = 'Selecione uma data';
    }

    if (!formData.horario) {
      newErrors.horario = 'Selecione um horário';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof AgendamentoOnlineData, value: string) => {
    if (field === 'telefone') {
      value = formatarTelefone(value);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;
    if (!termsAccepted) {
      alert('Você deve aceitar os termos e condições para continuar.');
      return;
    }
    if (!taxaAccepted) {
      alert('Você deve aceitar as condições da taxa antecipada para continuar.');
      return;
    }

    setIsSubmitting(true);
    const sucesso = await criarAgendamento(formData);
    
    if (sucesso) {
      setSuccess(true);
    }
    setIsSubmitting(false);
  };

  const hoje = new Date();
  const dataMinima = hoje.toISOString().split('T')[0];
  const dataMaxima = new Date(hoje.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 90 dias no futuro
  const servicoSelecionado = servicos.find(s => s.id === formData.servico_id);

  // Função para compartilhar comprovante
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

  // Função para copiar comprovante
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

  // Verificar se a data selecionada é um dia disponível
  const isDataDisponivel = (data: string) => {
    if (!data) return false;
    const dataSelecionada = new Date(data + 'T00:00:00');
    const diaSemana = dataSelecionada.getDay();
    
    return isDiaAtivo(diaSemana);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Agendamento Confirmado!</CardTitle>
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
            
            {/* Botões de compartilhamento */}
            <div className="flex flex-col gap-2">
              <Button 
                onClick={compartilharComprovante}
                disabled={isSharing}
                className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">Agendar Serviço</CardTitle>
            <CardDescription>
              Preencha o formulário abaixo para agendar seu serviço
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
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
                    className={errors.nome_completo ? 'border-red-500' : ''}
                  />
                  {errors.nome_completo && (
                    <span className="text-sm text-red-500">{errors.nome_completo}</span>
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
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <span className="text-sm text-red-500">{errors.email}</span>
                  )}
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className={errors.telefone ? 'border-red-500' : ''}
                  />
                  {errors.telefone && (
                    <span className="text-sm text-red-500">{errors.telefone}</span>
                  )}
                </div>
              </div>

              {/* Serviço e Agendamento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Agendamento
                </h3>

                <div>
                  <Label htmlFor="servico_id">Serviço *</Label>
                  <Select onValueChange={(value) => handleInputChange('servico_id', value)}>
                    <SelectTrigger className={errors.servico_id ? 'border-red-500' : ''}>
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
                    <span className="text-sm text-red-500">{errors.servico_id}</span>
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
                    className={errors.data ? 'border-red-500' : ''}
                  />
                  {errors.data && (
                    <span className="text-sm text-red-500">{errors.data}</span>
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
                    <SelectTrigger className={errors.horario ? 'border-red-500' : ''}>
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
                                <span className="text-muted-foreground text-xs ml-2">(Ocupado)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-horarios" disabled>
                          {!formData.data || !isDataDisponivel(formData.data) 
                            ? "Selecione uma data válida" 
                            : "Nenhum horário disponível para esta data"
                          }
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.horario && (
                    <span className="text-sm text-red-500">{errors.horario}</span>
                  )}
                  {servicoSelecionado && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Duração do serviço: {servicoSelecionado.duracao} minutos
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Alguma observação especial?"
                    rows={3}
                  />
                </div>
              </div>

              {/* Taxa Antecipada */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Condições de Agendamento
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
              </div>

              {/* Termos */}
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

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || loading || !taxaAccepted || !termsAccepted}
              >
                {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                * Campos obrigatórios
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}