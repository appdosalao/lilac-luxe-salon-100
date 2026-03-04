import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, Mail, Phone, CreditCard, AlertCircle, Share2, Copy, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
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
import { CustomerInfoStep } from './CustomerInfoStep';
import { ServiceSelectionStep } from './ServiceSelectionStep';
import { FinalizationStep } from './FinalizationStep';
import { agendamentoOnlineSchema } from '@/lib/validation';
import { toast } from 'sonner';

export function AgendamentoOnlineForm() {
  const {
    loading,
    servicos,
    produtos,
    carregarServicos,
    carregarProdutosPublicos,
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
  const formRef = useRef<HTMLFormElement>(null);
  const [produtoId, setProdutoId] = useState<string>('');
  const [produtoQtd, setProdutoQtd] = useState<number>(1);
  const [produtoForma, setProdutoForma] = useState<string>('pix');
  const [produtoEnabled, setProdutoEnabled] = useState<boolean>(false);
  const [produtoCategoria, setProdutoCategoria] = useState<string>('todas');
  const [produtoOrdenacao, setProdutoOrdenacao] = useState<'nome' | 'preco'>('nome');

  const steps = ['Dados', 'Agendamento', 'Finalização'];

  useEffect(() => {
    carregarServicos();
    carregarProdutosPublicos();
  }, [carregarServicos, carregarProdutosPublicos]);

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

    try {
      const horariosDisponiveis = await calcularHorariosDisponiveis(formData.servico_id!, formData.data);
      console.log('Horários disponíveis considerando duração:', horariosDisponiveis);
      
      // Garantir que horariosDisponiveis é um array antes de mapear
      if (!Array.isArray(horariosDisponiveis)) {
        console.error('Horários disponíveis não é um array:', horariosDisponiveis);
        setHorariosDisponiveis([]);
        return;
      }

      // Transformar array de strings em array de objetos HorarioDisponivel
      const horariosFormatados: HorarioDisponivel[] = horariosDisponiveis.map((h: any) => {
        if (typeof h === 'string') {
          return { horario: h, disponivel: true };
        }
        // Se já for um objeto HorarioDisponivel
        if (h && typeof h === 'object' && 'horario' in h) {
          return h as HorarioDisponivel;
        }
        return { horario: String(h), disponivel: false }; // Fallback seguro
      });

      setHorariosDisponiveis(horariosFormatados);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setHorariosDisponiveis([]);
    }
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
      if (produtoEnabled && produtoId) {
        const pSel = produtos.find(p => p.id === produtoId);
        const compra = {
          produto_id: produtoId,
          produto_nome: pSel?.nome || '',
          quantidade: produtoQtd,
          forma_pagamento_produto: produtoForma
        };
        const prefix = validatedData.observacoes ? validatedData.observacoes + '\n' : '';
        validatedData.observacoes = `${prefix}Compra de produto: ${JSON.stringify(compra)}`;
      }
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

  // Auto Test Runner: preenche e submete automaticamente quando ?autoTest=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoTest = params.get('autoTest');
    if (!autoTest) return;
    if (success) return;

    // Etapa 1: preencher dados pessoais
    if (currentStep === 1) {
      setFormData(prev => ({
        ...prev,
        nome_completo: prev.nome_completo || 'Cliente Teste',
        email: prev.email || 'cliente.teste@example.com',
        telefone: prev.telefone || '(11) 99999-9999',
      }));
      setTimeout(() => setCurrentStep(2), 200);
      return;
    }

    // Etapa 2: escolher serviço, data e horário
    if (currentStep === 2 && servicos.length > 0) {
      const escolherPrimeiraDataDisponivel = (): string | null => {
        for (let i = 1; i <= 14; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const iso = d.toISOString().split('T')[0];
          if (isDataDisponivel(iso)) return iso;
        }
        return null;
      };

      const primeiroServico = servicos[0];
      const dataEscolhida = escolherPrimeiraDataDisponivel();

      if (primeiroServico && dataEscolhida) {
        setFormData(prev => ({
          ...prev,
          servico_id: primeiroServico.id,
          data: dataEscolhida
        }));

        // Aguarda horários carregarem e seleciona o primeiro disponível
        const tentarSelecao = async (tentativas = 0) => {
          if (tentativas > 20) return;
          if (horariosDisponiveis.length > 0) {
            const h = horariosDisponiveis.find(h => h.disponivel) || horariosDisponiveis[0];
            setFormData(prev => ({ ...prev, horario: h.horario }));
            setTimeout(() => setCurrentStep(3), 150);
          } else {
            setTimeout(() => tentarSelecao(tentativas + 1), 250);
          }
        };
        tentarSelecao();
      }
      return;
    }

    // Etapa 3: aceitar termos e submeter
    if (currentStep === 3) {
      if (!termsAccepted) setTermsAccepted(true);
      if (!taxaAccepted) setTaxaAccepted(true);
      setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 200);
    }
  }, [currentStep, servicos, horariosDisponiveis, termsAccepted, taxaAccepted, success]);

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
                {produtoEnabled && produtoId && (
                  <div className="mt-2 border-t pt-2">
                    <p className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /><strong>Produto selecionado</strong></p>
                    <p>
                      {(() => {
                        const p = produtos.find(pr => pr.id === produtoId);
                        const unit = typeof p?.valor === 'number' ? p!.valor : 0;
                        const total = unit * produtoQtd;
                        return `${p?.nome || 'Produto'} • Qtd: ${produtoQtd} • Forma: ${produtoForma.toUpperCase()}${unit ? ` • Total estimado: R$ ${total.toFixed(2)}` : ''}`;
                      })()}
                    </p>
                  </div>
                )}
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
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Dados Pessoais */}
                {currentStep === 1 && (
                  <CustomerInfoStep
                    formData={formData}
                    errors={errors}
                    handleInputChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.name, e.target.value)}
                  />
                )}

                {/* Step 2: Serviço e Agendamento */}
                {currentStep === 2 && (
                  <ServiceSelectionStep
                    formData={formData}
                    errors={errors}
                    servicos={servicos}
                    dataMinima={dataMinima}
                    dataMaxima={dataMaxima}
                    isDataDisponivel={isDataDisponivel}
                    handleInputChange={handleInputChange}
                    horariosDisponiveis={horariosDisponiveis}
                    servicoSelecionado={servicoSelecionado}
                  />
                )}

                {/* Step 3: Condições e Finalização */}
                {currentStep === 3 && (
                  <FinalizationStep
                    formData={formData}
                    servicoSelecionado={servicoSelecionado}
                    produtos={produtos}
                    produtoEnabled={produtoEnabled}
                    setProdutoEnabled={setProdutoEnabled}
                    produtoCategoria={produtoCategoria}
                    setProdutoCategoria={setProdutoCategoria}
                    produtoOrdenacao={produtoOrdenacao}
                    setProdutoOrdenacao={setProdutoOrdenacao}
                    produtoId={produtoId}
                    setProdutoId={setProdutoId}
                    produtoQtd={produtoQtd}
                    setProdutoQtd={setProdutoQtd}
                    produtoForma={produtoForma}
                    setProdutoForma={setProdutoForma}
                    taxaAccepted={taxaAccepted}
                    setTaxaAccepted={setTaxaAccepted}
                    termsAccepted={termsAccepted}
                    setTermsAccepted={setTermsAccepted}
                  />
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
