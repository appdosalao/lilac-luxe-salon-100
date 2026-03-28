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

  // Cores dinâmicas do formulário
  const primaryColor = configOnline.cor_primaria || '#8B5CF6';
  const primaryHsl = hexToHsl(primaryColor);

  // Função auxiliar para converter Hex para HSL (formato esperado pelo Tailwind no projeto)
  function hexToHsl(hex: string) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

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
      
      // Se não houver taxa de sinal, forçamos a aceitação interna para não travar o envio
      const canSubmit = termsAccepted && (configOnline.taxa_sinal_percentual <= 0 || taxaAccepted);
      
      if (!canSubmit) {
        toast.error('Você deve aceitar os termos e a taxa de sinal (se houver) para continuar.');
        return;
      }

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
    <div className="flex flex-col min-h-screen" style={{ '--primary': primaryHsl, '--ring': primaryHsl } as React.CSSProperties}>
      <SalonHeader />
      <div className="flex-1 bg-gradient-to-b from-transparent to-primary/5 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/5 p-6 sm:p-8">
              <ProgressSteps currentStep={currentStep} steps={steps} />
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                {/* Step 1: Dados Pessoais */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col gap-2 border-b border-primary/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">
                          Seus Dados
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {configOnline.mensagem_boas_vindas || 'Preencha os dados abaixo para agendar seu horário.'}
                      </p>
                    </div>
                  
                    <div className="grid gap-6">
                      <div className="space-y-2 group">
                        <Label htmlFor="nome_completo" className="text-sm font-semibold group-focus-within:text-primary transition-colors">Nome Completo *</Label>
                        <Input
                          id="nome_completo"
                          value={formData.nome_completo}
                          onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                          placeholder="Seu nome completo"
                          className={`h-12 rounded-xl border-primary/10 bg-white/50 focus:bg-white shadow-sm transition-all duration-300 ${errors.nome_completo ? 'border-destructive ring-destructive/20' : 'focus:shadow-md focus:ring-primary/20'}`}
                        />
                        {errors.nome_completo && (
                          <span className="text-xs text-destructive font-medium animate-in fade-in slide-in-from-top-1">{errors.nome_completo}</span>
                        )}
                      </div>

                      <div className="space-y-2 group">
                        <Label htmlFor="email" className="text-sm font-semibold group-focus-within:text-primary transition-colors">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="seu@email.com"
                          className={`h-12 rounded-xl border-primary/10 bg-white/50 focus:bg-white shadow-sm transition-all duration-300 ${errors.email ? 'border-destructive ring-destructive/20' : 'focus:shadow-md focus:ring-primary/20'}`}
                        />
                        {errors.email && (
                          <span className="text-xs text-destructive font-medium animate-in fade-in slide-in-from-top-1">{errors.email}</span>
                        )}
                      </div>

                      <div className="space-y-2 group">
                        <Label htmlFor="telefone" className="text-sm font-semibold group-focus-within:text-primary transition-colors">Telefone *</Label>
                        <Input
                          id="telefone"
                          value={formData.telefone}
                          onChange={(e) => handleInputChange('telefone', e.target.value)}
                          placeholder="(11) 99999-9999"
                          className={`h-12 rounded-xl border-primary/10 bg-white/50 focus:bg-white shadow-sm transition-all duration-300 ${errors.telefone ? 'border-destructive ring-destructive/20' : 'focus:shadow-md focus:ring-primary/20'}`}
                        />
                        {errors.telefone && (
                          <span className="text-xs text-destructive font-medium animate-in fade-in slide-in-from-top-1">{errors.telefone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Serviço e Agendamento */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-3 border-b border-primary/10 pb-2">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        Agendamento
                      </h3>
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="servico_id" className="text-sm font-semibold">Serviço *</Label>
                        <Select onValueChange={(value) => handleInputChange('servico_id', value)}>
                          <SelectTrigger className={`h-12 rounded-xl border-primary/10 bg-white/50 shadow-sm transition-all ${errors.servico_id ? 'border-destructive ring-destructive/20' : 'focus:shadow-md'}`}>
                            <SelectValue placeholder="Selecione um serviço" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl border-primary/5">
                            {servicos.map((servico) => (
                              <SelectItem key={servico.id} value={servico.id} className="h-12 cursor-pointer focus:bg-primary/5 transition-colors">
                                <div className="flex items-center justify-between gap-4 w-full">
                                  <span className="font-medium">{servico.nome}</span>
                                  {configOnline.mostrar_precos && (
                                    <span className="text-primary font-bold">R$ {servico.valor.toFixed(2)}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.servico_id && (
                          <span className="text-xs text-destructive font-medium">{errors.servico_id}</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="data" className="text-sm font-semibold">Data *</Label>
                          <Input
                            id="data"
                            type="date"
                            min={dataMinima}
                            max={dataMaxima}
                            value={formData.data}
                            onChange={(e) => handleInputChange('data', e.target.value)}
                            className={`h-12 rounded-xl border-primary/10 bg-white/50 shadow-sm transition-all ${errors.data ? 'border-destructive' : 'focus:shadow-md'}`}
                          />
                          {errors.data && (
                            <span className="text-xs text-destructive font-medium">{errors.data}</span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="horario" className="text-sm font-semibold">Horário *</Label>
                          <Select 
                            onValueChange={(value) => handleInputChange('horario', value)}
                            disabled={!formData.servico_id || !formData.data || !isDataDisponivel(formData.data)}
                          >
                            <SelectTrigger className={`h-12 rounded-xl border-primary/10 bg-white/50 shadow-sm transition-all ${errors.horario ? 'border-destructive' : 'focus:shadow-md'}`}>
                              <SelectValue placeholder={
                                !formData.servico_id || !formData.data 
                                  ? "Selecione serviço e data" 
                                  : !isDataDisponivel(formData.data)
                                  ? "Data indisponível"
                                  : horariosDisponiveis.length === 0
                                  ? "Sem horários"
                                  : "Horário"
                              } />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl border-primary/5 max-h-[300px]">
                              {horariosDisponiveis.length > 0 ? (
                                <div className="grid grid-cols-3 gap-1 p-2">
                                  {horariosDisponiveis.map((horario) => (
                                    <SelectItem 
                                      key={horario.horario} 
                                      value={horario.horario}
                                      disabled={!horario.disponivel}
                                      className="h-10 cursor-pointer justify-center rounded-lg focus:bg-primary/10 transition-colors"
                                    >
                                      {horario.horario}
                                    </SelectItem>
                                  ))}
                                </div>
                              ) : (
                                <SelectItem value="none" disabled>
                                  Nenhum horário disponível
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {errors.horario && (
                            <span className="text-xs text-destructive font-medium">{errors.horario}</span>
                          )}
                        </div>
                      </div>

                      {formData.data && !isDataDisponivel(formData.data) && (
                        <Alert className="rounded-xl border-amber-200 bg-amber-50 animate-in zoom-in-95 duration-200">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800 text-xs font-medium">
                            Esta data não está disponível para agendamentos. Escolha outro dia.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="observacoes" className="text-sm font-semibold">Observações (opcional)</Label>
                        <Textarea
                          id="observacoes"
                          value={formData.observacoes}
                          onChange={(e) => handleInputChange('observacoes', e.target.value)}
                          placeholder="Alguma observação ou preferência?"
                          rows={3}
                          className="rounded-xl border-primary/10 bg-white/50 shadow-sm focus:shadow-md transition-all resize-none"
                        />
                      </div>
                      
                      {configOnline.mostrar_duracao && servicoSelecionado && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Duração estimada: {servicoSelecionado.duracao} minutos
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Condições e Finalização */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    {/* Resumo do Agendamento */}
                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 shadow-inner">
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-primary">
                        <Clock className="w-5 h-5" />
                        Resumo do Agendamento
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Cliente</p>
                          <p className="font-bold text-foreground truncate">{formData.nome_completo}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Serviço</p>
                          <p className="font-bold text-foreground">{servicoSelecionado?.nome}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Data e Horário</p>
                          <p className="font-bold text-foreground">
                            {formData.data ? new Date(formData.data).toLocaleDateString('pt-BR') : '-'} às {formData.horario}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Investimento</p>
                          <p className="font-bold text-primary text-lg">R$ {servicoSelecionado?.valor.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Produtos opcionais */}
                    <div className="bg-white/50 border border-primary/5 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                          <ShoppingBag className="w-5 h-5 text-primary" />
                          Produtos Extras
                        </h3>
                        <Checkbox 
                          id="produtoEnabled"
                          checked={produtoEnabled}
                          onCheckedChange={(checked) => setProdutoEnabled(!!checked)}
                          className="w-6 h-6 rounded-lg"
                        />
                      </div>
                      
                      {produtoEnabled && (
                        <div className="space-y-4 pt-2 animate-in fade-in zoom-in duration-300">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground uppercase ml-1">Produto</Label>
                              <Select value={produtoId} onValueChange={setProdutoId}>
                                <SelectTrigger className="h-11 rounded-xl border-primary/10 shadow-sm">
                                  <SelectValue placeholder="Escolha um item" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl">
                                  {produtos.map((p) => (
                                    <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                                      {p.nome} — R$ {Number(p.valor).toFixed(2)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-bold text-muted-foreground uppercase ml-1">Quantidade</Label>
                              <Input 
                                type="number" 
                                min={1} 
                                value={produtoQtd} 
                                onChange={(e) => setProdutoQtd(Math.max(1, Number(e.target.value)))}
                                className="h-11 rounded-xl border-primary/10 shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Condições e Termos */}
                    <div className="space-y-4">
                      {configOnline.taxa_sinal_percentual > 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              id="taxa"
                              checked={taxaAccepted}
                              onCheckedChange={(checked) => setTaxaAccepted(checked as boolean)}
                              className="mt-1 w-6 h-6 rounded-lg border-amber-300 data-[state=checked]:bg-amber-600"
                            />
                            <Label htmlFor="taxa" className="text-sm leading-relaxed cursor-pointer text-amber-900 font-medium">
                              Oi, tudo bem? 💙 Para garantir seu horário pedimos uma taxa antecipada de {configOnline.taxa_sinal_percentual}%. 
                              Esse valor é abatido no dia do atendimento. 
                              Não devolvemos em caso de cancelamento sem justificativa. *
                            </Label>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4 px-2">
                        <Checkbox
                          id="terms"
                          checked={termsAccepted}
                          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                          className="w-6 h-6 rounded-lg border-primary/20 mt-1"
                        />
                        <Label htmlFor="terms" className="text-sm text-muted-foreground font-medium cursor-pointer leading-relaxed">
                          {configOnline.termos_condicoes || 'Aceito os termos e concordo em receber confirmações por WhatsApp *'}
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-4">
                  {currentStep > 1 && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className="flex-1 h-14 rounded-2xl border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all shadow-sm active:scale-95"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Voltar
                    </Button>
                  )}

                  {currentStep < 3 ? (
                    <Button 
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 h-14 rounded-2xl text-white font-bold shadow-lg transition-all hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none"
                      style={{ background: primaryColor }}
                    >
                      Continuar
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      className={`flex-1 h-14 rounded-2xl font-bold shadow-lg transition-all active:translate-y-[1px] active:shadow-none ${
                        isSubmitting || !termsAccepted || (configOnline.taxa_sinal_percentual > 0 && !taxaAccepted)
                        ? 'bg-muted cursor-not-allowed' 
                        : 'text-white hover:shadow-xl hover:translate-y-[-2px]'
                      }`}
                      style={{ 
                        background: !isSubmitting && termsAccepted && (configOnline.taxa_sinal_percentual <= 0 || taxaAccepted)
                          ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` 
                          : undefined 
                      }}
                      disabled={isSubmitting || !termsAccepted || (configOnline.taxa_sinal_percentual > 0 && !taxaAccepted)}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processando...
                        </div>
                      ) : (
                        'Confirmar Agendamento'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <SalonFooter />
    </div>
  );
}
