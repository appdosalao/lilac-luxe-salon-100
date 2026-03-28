import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, Mail, Phone, CreditCard, AlertCircle, Share2, Copy, ArrowRight, ArrowLeft, ShoppingBag, Check, Scissors, Star, Timer, Tag, ChevronRight, LayoutGrid } from 'lucide-react';
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
      <div className="flex flex-col min-h-screen" style={{ '--primary': primaryHsl } as React.CSSProperties}>
        <SalonHeader />
        <div className="flex-1 bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-none shadow-[0_30px_60px_rgba(0,0,0,0.12)] bg-white/90 backdrop-blur-xl rounded-[3rem] overflow-hidden animate-in zoom-in duration-500">
            <div className="bg-primary h-2 w-full" />
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-6 w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center rotate-12 animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-black text-primary tracking-tighter">Agendamento Confirmado!</CardTitle>
              <CardDescription className="text-base font-medium px-4">
                Tudo pronto! Seu horário foi reservado com sucesso em nosso sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="bg-primary/5 p-6 rounded-[2rem] border-2 border-primary/10 space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                  <Calendar className="w-20 h-20 text-primary" />
                </div>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Scissors className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Serviço</p>
                    <p className="font-bold text-lg leading-tight">{servicoSelecionado?.nome}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-primary/5">
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Data</p>
                    <p className="font-bold">{new Date(formData.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-primary/5">
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Horário</p>
                    <p className="font-bold">{formData.horario}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-primary/10 flex justify-between items-center relative z-10">
                  <span className="text-sm font-bold text-muted-foreground">Valor Total</span>
                  <span className="text-2xl font-black text-primary">R$ {servicoSelecionado?.valor.toFixed(2)}</span>
                </div>

                {produtoEnabled && produtoId && (
                  <div className="mt-2 pt-4 border-t border-primary/10 animate-in fade-in slide-in-from-top-2 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                      <span className="text-[10px] uppercase font-black text-primary tracking-widest">Produto Extra</span>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground bg-white/50 p-2 rounded-xl">
                      {(() => {
                        const p = produtos.find(pr => pr.id === produtoId);
                        return `${p?.nome || 'Produto'} • Qtd: ${produtoQtd}`;
                      })()}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={compartilharComprovante}
                  disabled={isSharing}
                  className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0 border-b-4 border-primary/50"
                >
                  <Share2 className="w-5 h-5" />
                  {isSharing ? 'Compartilhando...' : 'Enviar Comprovante'}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={copiarComprovante}
                    variant="outline"
                    className="h-12 rounded-2xl flex items-center gap-2 border-primary/10 font-bold hover:bg-primary/5"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="ghost"
                    className="h-12 rounded-2xl font-bold text-muted-foreground hover:text-primary"
                  >
                    Novo Agendamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <SalonFooter />
      </div>
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
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col gap-2 border-b border-primary/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <Scissors className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">
                          Escolha o Serviço
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {servicos.map((servico) => (
                        <button
                          key={servico.id}
                          type="button"
                          onClick={() => handleInputChange('servico_id', servico.id)}
                          className={cn(
                            "group relative flex flex-col p-5 rounded-[2rem] border-2 transition-all duration-300 text-left",
                            formData.servico_id === servico.id
                              ? "border-primary bg-primary/5 shadow-[0_10px_30px_rgba(var(--primary),0.2)] scale-[1.02] -translate-y-1 border-b-8 active:translate-y-0 active:border-b-2"
                              : "border-primary/10 bg-white/50 hover:border-primary/30 hover:bg-white hover:-translate-y-1 hover:shadow-xl border-b-4 active:translate-y-0 active:border-b-2"
                          )}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className={cn(
                              "p-3 rounded-2xl transition-all duration-500",
                              formData.servico_id === servico.id 
                                ? "bg-primary text-white shadow-lg rotate-12" 
                                : "bg-primary/10 text-primary group-hover:rotate-12"
                            )}>
                              <Scissors className="w-5 h-5" />
                            </div>
                            {formData.servico_id === servico.id && (
                              <div className="bg-primary text-white p-1.5 rounded-full shadow-lg animate-in zoom-in">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          
                          <h4 className="font-black text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                            {servico.nome}
                          </h4>
                          
                          <div className="flex items-center gap-3 mt-4">
                            {configOnline.mostrar_precos && (
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-tighter">Preço</span>
                                <span className="text-primary font-black text-xl tracking-tighter">
                                  R$ {servico.valor.toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="w-px h-8 bg-primary/10 mx-1" />
                            {configOnline.mostrar_duracao && (
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-tighter">Duração</span>
                                <span className="text-muted-foreground font-bold text-sm flex items-center gap-1">
                                  <Timer className="w-3.5 h-3.5 text-primary/50" />
                                  {servico.duracao} min
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Efeito de brilho ao selecionar */}
                          {formData.servico_id === servico.id && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-[2rem] pointer-events-none" />
                          )}
                        </button>
                      ))}
                    </div>
                    {errors.servico_id && (
                      <span className="text-xs text-destructive font-medium -mt-4 block">{errors.servico_id}</span>
                    )}

                    <div className="space-y-6 pt-4 border-t border-primary/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">
                          Data e Horário
                        </h3>
                      </div>

                      <div className="space-y-8">
                        {/* Novo Seletor de Data Visual */}
                        <div className="space-y-4">
                          <Label className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-primary/70">
                            <Calendar className="w-4 h-4" />
                            Selecione o Dia
                          </Label>
                          
                          <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 no-scrollbar -mx-4 sm:mx-0 sm:px-0">
                            {Array.from({ length: 14 }).map((_, i) => {
                              const d = new Date();
                              d.setDate(d.getDate() + i);
                              const iso = d.toISOString().split('T')[0];
                              const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                              const diaMes = d.getDate();
                              const isAtivo = isDiaAtivo(d.getDay());
                              const isSelected = formData.data === iso;

                              return (
                                <button
                                  key={iso}
                                  type="button"
                                  disabled={!isAtivo}
                                  onClick={() => handleInputChange('data', iso)}
                                  className={cn(
                                    "flex flex-col items-center justify-center min-w-[70px] h-[90px] rounded-3xl transition-all duration-300 border-2",
                                    !isAtivo 
                                      ? "opacity-30 grayscale cursor-not-allowed border-transparent"
                                      : isSelected
                                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 -translate-y-2 scale-110 border-b-8 active:translate-y-0 active:border-b-2"
                                      : "bg-white border-primary/10 text-foreground hover:border-primary/30 hover:-translate-y-1 border-b-4 active:translate-y-0 active:border-b-2"
                                  )}
                                >
                                  <span className={cn(
                                    "text-[10px] font-black uppercase tracking-tighter mb-1",
                                    isSelected ? "text-white/80" : "text-muted-foreground"
                                  )}>
                                    {diaSemana}
                                  </span>
                                  <span className="text-xl font-black">
                                    {diaMes}
                                  </span>
                                </button>
                              );
                            })}
                            
                            {/* Botão para abrir calendário manual */}
                            <div className="relative min-w-[70px] h-[90px]">
                              <Input
                                type="date"
                                min={dataMinima}
                                max={dataMaxima}
                                value={formData.data}
                                onChange={(e) => handleInputChange('data', e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                              />
                              <div className="flex flex-col items-center justify-center h-full rounded-3xl border-2 border-dashed border-primary/30 text-primary/50 bg-primary/5">
                                <LayoutGrid className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-black uppercase">Mais</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Grade de Horários Modernizada */}
                        <div className="space-y-4">
                          <Label className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-primary/70">
                            <Clock className="w-4 h-4" />
                            Horários Disponíveis
                          </Label>
                          
                          {!formData.servico_id || !formData.data ? (
                            <div className="h-24 rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                              <Scissors className="w-6 h-6 mb-2 opacity-20" />
                              <span className="text-xs font-bold uppercase tracking-tight">Escolha o serviço e a data primeiro</span>
                            </div>
                          ) : !isDataDisponivel(formData.data) ? (
                            <div className="h-24 rounded-[2rem] bg-destructive/5 border-2 border-destructive/10 flex flex-col items-center justify-center text-destructive p-4 text-center font-black uppercase tracking-tighter">
                              <AlertCircle className="w-6 h-6 mb-2" />
                              Salão fechado nesta data
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto p-2 pr-3 custom-scrollbar">
                              {horariosDisponiveis.map((h) => (
                                <button
                                  key={h.horario}
                                  type="button"
                                  disabled={!h.disponivel}
                                  onClick={() => handleInputChange('horario', h.horario)}
                                  className={cn(
                                    "h-12 rounded-2xl text-sm font-black transition-all duration-300 border-2 flex items-center justify-center",
                                    !h.disponivel 
                                      ? "bg-muted/30 border-transparent text-muted-foreground/30 cursor-not-allowed grayscale"
                                      : formData.horario === h.horario
                                      ? "bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-105 -translate-y-1 border-b-4 active:translate-y-0 active:border-b-0"
                                      : "bg-white border-primary/10 text-foreground hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5 border-b-2 active:translate-y-0 active:border-b-0"
                                  )}
                                >
                                  {h.horario}
                                </button>
                              ))}
                              {horariosDisponiveis.length === 0 && (
                                <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                                  <Timer className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                  <span className="text-xs font-black uppercase">Sem horários para este dia</span>
                                </div>
                              )}
                            </div>
                          )}
                          {errors.horario && (
                            <span className="text-xs text-destructive font-black uppercase tracking-tighter block mt-2 ml-1">{errors.horario}</span>
                          )}
                        </div>
                      </div>

                      {formData.data && !isDataDisponivel(formData.data) && (
                        <Alert className="rounded-2xl border-amber-200 bg-amber-50 animate-in zoom-in-95 duration-200">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800 text-xs font-bold uppercase tracking-tight">
                            Este dia não atendemos. Por favor, escolha outra data.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-3">
                        <Label htmlFor="observacoes" className="text-sm font-bold flex items-center gap-2">
                          <Tag className="w-4 h-4 text-primary" />
                          Observações (opcional)
                        </Label>
                        <Textarea
                          id="observacoes"
                          value={formData.observacoes}
                          onChange={(e) => handleInputChange('observacoes', e.target.value)}
                          placeholder="Ex: Tenho alergia a algum produto, ou gostaria de um profissional específico."
                          rows={3}
                          className="rounded-2xl border-primary/10 bg-white/50 shadow-sm focus:shadow-lg transition-all duration-300 resize-none"
                        />
                      </div>
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
                    <div className="bg-white/50 border border-primary/10 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingBag className="w-12 h-12 text-primary" />
                      </div>

                      <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black flex items-center gap-2 text-foreground">
                            <ShoppingBag className="w-6 h-6 text-primary" />
                            Produtos Extras
                          </h3>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Adicione itens ao seu agendamento</p>
                        </div>
                        <Checkbox 
                          id="produtoEnabled"
                          checked={produtoEnabled}
                          onCheckedChange={(checked) => setProdutoEnabled(!!checked)}
                          className="w-8 h-8 rounded-xl border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-300 shadow-lg"
                        />
                      </div>
                      
                      {produtoEnabled && (
                        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-1 pr-3 custom-scrollbar">
                            {produtos.map((p) => {
                              const isSelected = produtoId === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setProdutoId(isSelected ? '' : p.id)}
                                  className={cn(
                                    "flex flex-col p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden",
                                    isSelected
                                      ? "border-primary bg-primary/5 shadow-lg -translate-y-1 border-b-4 active:translate-y-0 active:border-b-0"
                                      : "border-primary/10 bg-white hover:border-primary/30 hover:-translate-y-1 border-b-2 active:translate-y-0 active:border-b-0"
                                  )}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className={cn(
                                      "p-2 rounded-xl",
                                      isSelected ? "bg-primary text-white" : "bg-primary/5 text-primary"
                                    )}>
                                      <Tag className="w-4 h-4" />
                                    </div>
                                    {isSelected && (
                                      <div className="bg-primary text-white p-1 rounded-full animate-in zoom-in">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="font-bold text-sm text-foreground line-clamp-1">{p.nome}</span>
                                  <span className="text-primary font-black text-lg mt-1">R$ {Number(p.valor).toFixed(2)}</span>
                                  
                                  {isSelected && (
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-primary/10 rounded-bl-[2rem] -mr-4 -mt-4 rotate-45" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {produtoId && (
                            <div className="grid grid-cols-2 gap-4 animate-in zoom-in-95 duration-300 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black text-primary uppercase ml-1">Quantidade</Label>
                                <Input 
                                  type="number" 
                                  min={1} 
                                  value={produtoQtd} 
                                  onChange={(e) => setProdutoQtd(Math.max(1, Number(e.target.value)))}
                                  className="h-12 rounded-xl border-primary/10 bg-white font-black text-center shadow-inner"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black text-primary uppercase ml-1">Pagamento</Label>
                                <Select value={produtoForma} onValueChange={setProdutoForma}>
                                  <SelectTrigger className="h-12 rounded-xl border-primary/10 bg-white font-black shadow-inner">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl shadow-2xl font-bold">
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="cartao">CARTÃO</SelectItem>
                                    <SelectItem value="dinheiro">DINHEIRO</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
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
