import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, User, Mail, Phone, MapPin } from 'lucide-react';
import { useAgendamentoOnlineService } from '@/hooks/useAgendamentoOnlineService';
import { AgendamentoOnlineData, HorarioDisponivel, FormErrors } from '@/types/agendamento-online';

export function AgendamentoOnlineForm() {
  const {
    loading,
    servicos,
    carregarServicos,
    calcularHorariosDisponiveis,
    criarAgendamento
  } = useAgendamentoOnlineService();

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    carregarServicos();
  }, [carregarServicos]);

  useEffect(() => {
    if (formData.servico_id && formData.data) {
      calcularHorariosDisponiveis(formData.servico_id, formData.data)
        .then(setHorariosDisponiveis);
    }
  }, [formData.servico_id, formData.data, calcularHorariosDisponiveis]);

  const formatarTelefone = (valor: string): string => {
    const digits = valor.replace(/\D/g, '');
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

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

    setIsSubmitting(true);
    const sucesso = await criarAgendamento(formData);
    
    if (sucesso) {
      setSuccess(true);
    }
    setIsSubmitting(false);
  };

  const dataMinima = new Date().toISOString().split('T')[0];
  const servicoSelecionado = servicos.find(s => s.id === formData.servico_id);

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
            <Button 
              onClick={() => window.location.reload()} 
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
                    value={formData.data}
                    onChange={(e) => handleInputChange('data', e.target.value)}
                    className={errors.data ? 'border-red-500' : ''}
                  />
                  {errors.data && (
                    <span className="text-sm text-red-500">{errors.data}</span>
                  )}
                </div>

                <div>
                  <Label htmlFor="horario">Horário *</Label>
                  <Select 
                    onValueChange={(value) => handleInputChange('horario', value)}
                    disabled={!formData.servico_id || !formData.data}
                  >
                    <SelectTrigger className={errors.horario ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {horariosDisponiveis.map((horario) => (
                        <SelectItem 
                          key={horario.horario} 
                          value={horario.horario}
                          disabled={!horario.disponivel}
                        >
                          {horario.horario} {!horario.disponivel && '(Indisponível)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.horario && (
                    <span className="text-sm text-red-500">{errors.horario}</span>
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

              {/* Termos */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-5">
                  Aceito os termos e condições e concordo em receber confirmações por email e WhatsApp
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}