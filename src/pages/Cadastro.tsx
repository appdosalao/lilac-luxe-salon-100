import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { UsuarioCadastro } from '@/types/usuario';
import { AppLogo } from '@/components/branding/AppLogo';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthFooter } from '@/components/branding/AuthFooter';

const cadastroSchema = z.object({
  nome_personalizado_app: z.string().min(1, 'Nome da profissional/salão é obrigatório'),
  nome_completo: z.string().min(1, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  tema_preferencia: z.enum(['feminino', 'masculino']),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmar_senha: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.senha === data.confirmar_senha, {
  message: "Senhas não coincidem",
  path: ["confirmar_senha"],
});

const Cadastro = () => {
  const navigate = useNavigate();
  const { signUp } = useSupabaseAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [planType, setPlanType] = useState<'trial' | 'paid'>('trial');

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<UsuarioCadastro>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      tema_preferencia: 'feminino',
    },
  });

  const temaEscolhido = watch('tema_preferencia');
  const senhaValor = watch('senha') || '';
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const calcStrength = (s: string) => {
    let score = 0;
    if (s.length >= 6) score += 25;
    if (/[A-Z]/.test(s)) score += 25;
    if (/[0-9]/.test(s)) score += 25;
    if (/[^A-Za-z0-9]/.test(s)) score += 25;
    return score;
  };
  const strength = calcStrength(senhaValor);

  // Aplicar tema em tempo real quando o usuário escolhe
  useEffect(() => {
    if (temaEscolhido) {
      console.log('Aplicando tema preview:', temaEscolhido);
      document.documentElement.setAttribute('data-theme', temaEscolhido);
      localStorage.setItem('app-theme', temaEscolhido);
    }
  }, [temaEscolhido]);

  const onSubmit = async (data: UsuarioCadastro) => {
    setIsLoading(true);
    setError('');

    try {
      if (!termsAccepted) {
        setError('Você precisa aceitar os termos de uso para continuar.');
        setIsLoading(false);
        return;
      }
      const { error } = await signUp(data.email, data.senha, {
        nome_completo: data.nome_completo,
        nome_personalizado_app: data.nome_personalizado_app,
        telefone: data.telefone,
        tema_preferencia: data.tema_preferencia
      }, planType);
      
      if (!error) {
        if (planType === 'trial') {
          // Login automático já foi feito, aguardar um pouco e ir para home
          await new Promise(resolve => setTimeout(resolve, 800));
          navigate('/');
        } else {
          // Assinar agora: ir para login primeiro, depois assinatura
          navigate('/login?redirect=/assinatura');
        }
      } else {
        setError(error.message || 'Erro ao criar conta');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <AppLogo size={56} rounded="xl" />
          </div>
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Cadastre-se para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Seleção de Plano */}
            <div className="space-y-3">
              <Label className="text-base">Escolha seu plano *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className="flex flex-col cursor-pointer"
                  onClick={() => !isLoading && setPlanType('trial')}
                >
                  <div className={`relative w-full p-5 border-2 rounded-xl transition-all hover:shadow-md bg-card ${
                    planType === 'trial' 
                      ? 'border-primary shadow-lg' 
                      : 'border-border'
                  }`}>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🎉</div>
                      <p className="font-semibold text-lg mb-1">7 Dias Grátis</p>
                      <p className="text-sm text-muted-foreground mb-3">Sem necessidade de cartão</p>
                      <p className="text-xs text-muted-foreground">Acesso completo por 7 dias</p>
                    </div>
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all ${
                      planType === 'trial'
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}></div>
                  </div>
                </div>
                <div 
                  className="flex flex-col cursor-pointer"
                  onClick={() => !isLoading && setPlanType('paid')}
                >
                  <div className={`relative w-full p-5 border-2 rounded-xl transition-all hover:shadow-md bg-card ${
                    planType === 'paid' 
                      ? 'border-primary shadow-lg' 
                      : 'border-border'
                  }`}>
                    <div className="text-center">
                      <div className="text-3xl mb-2">💳</div>
                      <p className="font-semibold text-lg mb-1">Assinar Agora</p>
                      <p className="text-sm text-muted-foreground mb-3">R$ 20,00/mês</p>
                      <p className="text-xs text-muted-foreground">Cobrança recorrente</p>
                    </div>
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all ${
                      planType === 'paid'
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_personalizado_app">Nome da Profissional / Nome do Salão *</Label>
              <Input
                id="nome_personalizado_app"
                placeholder="Ex: Camila Hair Studio"
                {...register('nome_personalizado_app')}
                disabled={isLoading}
              />
              {errors.nome_personalizado_app && (
                <p className="text-sm text-destructive">{errors.nome_personalizado_app.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo da Responsável *</Label>
              <Input
                id="nome_completo"
                placeholder="Ex: Camila Lopes"
                {...register('nome_completo')}
                disabled={isLoading}
              />
              {errors.nome_completo && (
                <p className="text-sm text-destructive">{errors.nome_completo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone com DDD *</Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                {...register('telefone')}
                disabled={isLoading}
              />
              {errors.telefone && (
                <p className="text-sm text-destructive">{errors.telefone.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base">Escolha o Esquema de Cores do App *</Label>
              <p className="text-sm text-muted-foreground">Esta escolha definirá as cores de todo o aplicativo</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className="flex flex-col cursor-pointer group"
                  onClick={() => !isLoading && setValue('tema_preferencia', 'feminino')}
                >
                  <div className={`relative w-full p-5 border-2 rounded-xl transition-all hover:shadow-md bg-card ${
                    temaEscolhido === 'feminino' 
                      ? 'border-[hsl(267,83%,58%)] shadow-lg' 
                      : 'border-border'
                  }`}>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, hsl(267 83% 58%), hsl(320 85% 75%))' }}></div>
                      <div className="w-10 h-10 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, hsl(320 85% 75%), hsl(267 83% 58%))' }}></div>
                    </div>
                    <p className="text-center font-semibold text-lg mb-1">Feminino</p>
                    <p className="text-center text-sm text-muted-foreground">Lilás e Rosa</p>
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all ${
                      temaEscolhido === 'feminino'
                        ? 'bg-[hsl(267,83%,58%)] border-[hsl(267,83%,58%)]'
                        : 'border-border'
                    }`}></div>
                  </div>
                </div>
                <div 
                  className="flex flex-col cursor-pointer group"
                  onClick={() => !isLoading && setValue('tema_preferencia', 'masculino')}
                >
                  <div className={`relative w-full p-5 border-2 rounded-xl transition-all hover:shadow-md bg-card ${
                    temaEscolhido === 'masculino' 
                      ? 'border-[hsl(217,91%,60%)] shadow-lg' 
                      : 'border-border'
                  }`}>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(220 60% 50%))' }}></div>
                      <div className="w-10 h-10 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, hsl(220 60% 50%), hsl(217 91% 60%))' }}></div>
                    </div>
                    <p className="text-center font-semibold text-lg mb-1">Masculino</p>
                    <p className="text-center text-sm text-muted-foreground">Azul e Cinza</p>
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all ${
                      temaEscolhido === 'masculino'
                        ? 'bg-[hsl(217,91%,60%)] border-[hsl(217,91%,60%)]'
                        : 'border-border'
                    }`}></div>
                  </div>
                </div>
              </div>
              {errors.tema_preferencia && (
                <p className="text-sm text-destructive">{errors.tema_preferencia.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha *</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showSenha ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  {...register('senha')}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowSenha(v => !v)}
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="space-y-2">
                <Progress value={strength} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Força da senha: {strength <= 25 ? 'fraca' : strength <= 50 ? 'média' : strength <= 75 ? 'boa' : 'excelente'}
                </p>
              </div>
              {errors.senha && (
                <p className="text-sm text-destructive">{errors.senha.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar_senha">Confirmar Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmar_senha"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  {...register('confirmar_senha')}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirm(v => !v)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmar_senha && (
                <p className="text-sm text-destructive">{errors.confirmar_senha.message}</p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(!!c)} />
              <Label htmlFor="terms" className="text-sm text-muted-foreground">
                Aceito os termos de uso e políticas de privacidade
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                planType === 'trial' ? 'Começar Teste Grátis' : 'Criar Conta e Assinar'
              )}
            </Button>

            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Faça login aqui
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
        <AuthFooter />
      </Card>
    </div>
  );
};

export default Cadastro;
