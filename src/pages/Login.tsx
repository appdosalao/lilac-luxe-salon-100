import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { UsuarioLogin } from '@/types/usuario';
import { AppLogo } from '@/components/branding/AppLogo';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Lock, Mail, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { AuthFooter } from '@/components/branding/AuthFooter';
import { Badge } from '@/components/ui/badge';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login } = useSupabaseAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<UsuarioLogin>({
    resolver: zodResolver(loginSchema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Apply theme if exists in localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const onSubmit = async (data: UsuarioLogin) => {
    setIsLoading(true);
    setError('');

    try {
      const ok = await login(data.email, data.senha);
      if (ok) {
        navigate(redirect);
      } else {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar entrar. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4 lg:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Lado Esquerdo - Boas-vindas & Branding (Desktop) */}
        <div className="hidden lg:flex flex-col space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              Bem-vinda(o) de volta
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Acesse sua conta no <br />
              <span className="text-primary">Salão de Bolso</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-md">
              Continue transformando a gestão do seu negócio com as ferramentas mais modernas do mercado.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex gap-4 items-center p-4 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Acesso Rápido</h3>
                <p className="text-sm text-muted-foreground">Sincronização em tempo real em todos os seus dispositivos.</p>
              </div>
            </div>

            <div className="flex gap-4 items-center p-4 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Ambiente Seguro</h3>
                <p className="text-sm text-muted-foreground">Seus dados estão protegidos com segurança de nível bancário.</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Não é profissional? <Link to="/agendamento-online" className="text-primary font-bold hover:underline">Agende um serviço aqui</Link>
            </p>
          </div>
        </div>

        {/* Lado Direito - Card de Login */}
        <div className="flex flex-col animate-in fade-in zoom-in duration-500">
          <Card className="shadow-2xl border-primary/10 overflow-hidden backdrop-blur-sm bg-card/95">
            <CardHeader className="space-y-2 text-center pt-10">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-2xl bg-primary/10 ring-4 ring-primary/5">
                  <AppLogo size={48} rounded="xl" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Fazer Login</CardTitle>
              <CardDescription className="text-base">
                Insira suas credenciais para acessar seu painel
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                    <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">E-mail</Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        {...register('email')}
                        disabled={isLoading}
                        className="h-12 bg-muted/30 border-border/50 focus:bg-background transition-all"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-destructive font-medium mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="senha" className="text-sm font-semibold">Senha</Label>
                      <Link
                        to="/esqueci-senha"
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Input
                        id="senha"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('senha')}
                        disabled={isLoading}
                        className="h-12 bg-muted/30 border-border/50 focus:bg-background transition-all"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(v => !v)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.senha && (
                      <p className="text-xs text-destructive font-medium mt-1">{errors.senha.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe} 
                    onCheckedChange={(c) => setRememberMe(!!c)} 
                    className="border-primary data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                    Lembrar-me neste dispositivo
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 btn-3d" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">Acessando...</span>
                  ) : (
                    <span className="flex items-center gap-2 text-white">Entrar no Sistema <ArrowRight className="h-5 w-5 ml-1" /></span>
                  )}
                </Button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground font-medium">Ainda não tem acesso?</span>
                  </div>
                </div>

                <Button 
                  asChild
                  variant="outline"
                  className="w-full h-14 text-lg font-bold border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/50 hover:scale-[1.01] active:scale-[0.99] transition-all text-primary group"
                >
                  <Link to="/cadastro" className="flex items-center justify-center gap-2">
                    Criar Conta Grátis
                    <Badge variant="secondary" className="ml-1 text-[11px] h-5 px-2 bg-primary/10 text-primary border-none group-hover:bg-primary group-hover:text-white transition-colors">7 DIAS</Badge>
                  </Link>
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <AuthFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
