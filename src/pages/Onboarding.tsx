import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, Calendar, Users, DollarSign, Gift, Bell, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

const onboardingSteps = [
  {
    title: 'Bem-vindo ao seu Sistema de Gestão!',
    description: 'Vamos fazer um tour rápido pelas principais funcionalidades',
    icon: Sparkles,
    features: [
      'Gerencie seus agendamentos de forma simples',
      'Controle completo de clientes e serviços',
      'Acompanhe seu financeiro em tempo real',
      'Fidelize seus clientes com recompensas'
    ]
  },
  {
    title: 'Agendamentos e Agenda',
    description: 'Organize seus horários de forma profissional',
    icon: Calendar,
    features: [
      'Visualização diária, semanal e mensal',
      'Notificações automáticas para você e seus clientes',
      'Agendamento online para seus clientes',
      'Controle de confirmações e reagendamentos'
    ]
  },
  {
    title: 'Clientes e Serviços',
    description: 'Mantenha tudo organizado',
    icon: Users,
    features: [
      'Cadastro completo de clientes com histórico',
      'Gestão de serviços com preços e durações',
      'Cronogramas de retorno automáticos',
      'Histórico completo de atendimentos'
    ]
  },
  {
    title: 'Controle Financeiro',
    description: 'Acompanhe seu faturamento',
    icon: DollarSign,
    features: [
      'Lançamentos de receitas e despesas',
      'Relatórios e gráficos detalhados',
      'Controle de contas a pagar e receber',
      'Visualização de lucro por período'
    ]
  },
  {
    title: 'Programa de Fidelidade',
    description: 'Fidelize e recompense seus clientes',
    icon: Gift,
    features: [
      'Sistema de pontos por agendamento',
      'Recompensas personalizáveis',
      'Níveis de fidelidade (Bronze, Prata, Ouro)',
      'Aumente seu faturamento e retenção'
    ]
  },
  {
    title: 'Sua Assinatura',
    description: 'Aproveite todos os benefícios',
    icon: Bell,
    features: [
      '7 dias grátis para testar todas as funcionalidades',
      'Apenas R$ 20,00/mês após o período de teste',
      'Sem compromisso - cancele quando quiser',
      'Suporte e atualizações constantes'
    ]
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding-completed', 'true');
    navigate('/');
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding-completed', 'true');
    navigate('/');
  };

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const step = onboardingSteps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Pular
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Passo {currentStep + 1} de {onboardingSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {step.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-base">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            
            {currentStep === onboardingSteps.length - 1 ? (
              <Button onClick={handleFinish} className="flex-1">
                Começar a usar
                <Check className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1">
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
