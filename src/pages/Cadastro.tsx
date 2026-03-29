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
import { Eye, EyeOff, CheckCircle2, ShieldCheck, Sparkles, CreditCard, Clock, Scissors, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthFooter } from '@/components/branding/AuthFooter';
import { Badge } from '@/components/ui/badge';

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
  const { cadastrar } = useSupabaseAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

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

  useEffect(() => {
    if (temaEscolhido) {
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
      
      const ok = await cadastrar(data);

      if (ok) {
        if (isBuying) {
          navigate('/checkout');
        } else {
          navigate('/'); // Go to dashboard with trial
        }
      } else {
        setError('Erro ao criar conta');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    setIsBuying(true);
    // Submit form manually
    handleSubmit(onSubmit)(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4 lg:p-8">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Lado Esquerdo - Marketing & Info */}
        <div className="hidden lg:flex flex-col space-y-8 pr-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
              <Sparkles className="h-4 w-4" />
              O Salão de Bolso evoluiu
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Gerencie seu salão de <span className="text-primary">forma profissional</span> e descomplicada.
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg">
              A ferramenta completa que cabe na palma da sua mão. Agendamentos, clientes, financeiro e muito mais.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex gap-4 items-start">
              <div className="mt-1 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Teste Grátis por 7 Dias</h3>
                <p className="text-muted-foreground">Experimente todas as funcionalidades sem compromisso. Sem necessidade de cartão.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="mt-1 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Segurança de Dados</h3>
                <p className="text-muted-foreground">Suas informações e as de seus clientes estão seguras com criptografia de ponta.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="mt-1 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Design Moderno e Intuitivo</h3>
                <p className="text-muted-foreground">Feito pensando na agilidade do seu dia a dia, com interface clara e rápida.</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">Junte-se a +1.000 profissionais</span> que já transformaram seus salões.
              </p>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="flex flex-col">
          <Card className="shadow-2xl border-primary/10 overflow-hidden">
            <div className="bg-primary/5 p-4 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">7 DIAS DE TESTE GRÁTIS</span>
              </div>
              <Badge variant="secondary" className="bg-white dark:bg-black font-bold">OFERTA LIMITADA</Badge>
            </div>
            
            <CardHeader className="space-y-1 text-center pt-8">
              <div className="flex justify-center mb-2 lg:hidden">
                <AppLogo size={48} rounded="xl" />
              </div>
              <CardTitle className="text-3xl font-bold">Crie sua conta</CardTitle>
              <CardDescription className="text-base">
                Comece agora mesmo a profissionalizar seu salão.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome_personalizado_app" className="font-semibold">Nome do seu Negócio *</Label>
                    <div className="relative">
                      <Input
                        id="nome_personalizado_app"
                        placeholder="Ex: Studio Beauty"
                        {...register('nome_personalizado_app')}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.nome_personalizado_app && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.nome_personalizado_app.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome_completo" className="font-semibold">Seu Nome Completo *</Label>
                    <Input
                      id="nome_completo"
                      placeholder="Ex: Camila Lopes"
                      {...register('nome_completo')}
                      disabled={isLoading}
                    />
                    {errors.nome_completo && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.nome_completo.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-semibold">E-mail Profissional *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com"
                      {...register('email')}
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="font-semibold">WhatsApp (com DDD) *</Label>
                    <Input
                      id="telefone"
                      placeholder="(11) 99999-9999"
                      {...register('telefone')}
                      disabled={isLoading}
                    />
                    {errors.telefone && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.telefone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Esquema de Cores do seu App</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 bg-card ${
                        temaEscolhido === 'feminino' 
                          ? 'border-primary shadow-md ring-2 ring-primary/10' 
                          : 'border-border'
                      }`}
                      onClick={() => !isLoading && setValue('tema_preferencia', 'feminino')}
                    >
                      <div className="flex justify-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full" style={{ background: 'linear-gradient(135deg, hsl(267 83% 58%), hsl(320 85% 75%))' }}></div>
                      </div>
                      <p className="text-center font-bold text-sm">Feminino</p>
                      <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 transition-all ${
                        temaEscolhido === 'feminino' ? 'bg-primary border-primary' : 'border-border'
                      }`}></div>
                    </div>
                    
                    <div 
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 bg-card ${
                        temaEscolhido === 'masculino' 
                          ? 'border-primary shadow-md ring-2 ring-primary/10' 
                          : 'border-border'
                      }`}
                      onClick={() => !isLoading && setValue('tema_preferencia', 'masculino')}
                    >
                      <div className="flex justify-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full" style={{ background: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(220 60% 50%))' }}></div>
                      </div>
                      <p className="text-center font-bold text-sm">Masculino</p>
                      <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 transition-all ${
                        temaEscolhido === 'masculino' ? 'bg-primary border-primary' : 'border-border'
                      }`}></div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="senha" title="Crie uma senha forte">Crie sua Senha *</Label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSenha(v => !v)}
                      >
                        {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Progress value={strength} className="h-1.5 mt-2" />
                    {errors.senha && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.senha.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmar_senha">Confirme a Senha *</Label>
                    <div className="relative">
                      <Input
                        id="confirmar_senha"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Digite novamente"
                        {...register('confirmar_senha')}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirm(v => !v)}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmar_senha && (
                      <p className="text-xs text-destructive mt-1 font-medium">{errors.confirmar_senha.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted} 
                    onCheckedChange={(c) => setTermsAccepted(!!c)} 
                    className="mt-0.5 border-primary data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="terms" className="text-sm leading-tight text-muted-foreground">
                    Eu aceito os <Link to="/termos" className="text-primary hover:underline font-semibold">termos de uso</Link> e <Link to="/privacidade" className="text-primary hover:underline font-semibold">políticas de privacidade</Link>.
                  </Label>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all" 
                    disabled={isLoading}
                    onClick={() => setIsBuying(false)}
                  >
                    {isLoading && !isBuying ? (
                      <span className="flex items-center gap-2">Criando conta...</span>
                    ) : (
                      <span className="flex items-center gap-2">Começar Teste Grátis <Clock className="h-5 w-5 ml-1" /></span>
                    )}
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground font-medium">Ou se preferir</span>
                    </div>
                  </div>

                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full h-14 text-lg font-bold border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all text-primary group"
                    disabled={isLoading}
                    onClick={handleBuyNow}
                  >
                    {isLoading && isBuying ? (
                      <span className="flex items-center gap-2 text-primary">Processando...</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Comprar Agora (Acesso Vitalício)
                        <CreditCard className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-4">
                  <div className="text-sm text-muted-foreground">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="text-primary hover:underline font-bold">
                      Faça login aqui
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-8 flex items-center justify-center gap-6 grayscale opacity-60">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldCheck className="h-4 w-4" /> SSL SECURE
            </div>
            <div className="flex items-center gap-2 font-bold text-sm uppercase">
              <CheckCircle2 className="h-4 w-4" /> Pagamento Seguro
            </div>
          </div>
          
          <div className="mt-8">
            <AuthFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
