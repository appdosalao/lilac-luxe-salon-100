import { useState } from 'react';
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
import { Eye, EyeOff } from 'lucide-react';
import { AuthFooter } from '@/components/branding/AuthFooter';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { signIn } = useSupabaseAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<UsuarioLogin>({
    resolver: zodResolver(loginSchema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const signInGoogle = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UsuarioLogin) => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signIn(data.email, data.senha);
      if (!error) {
        navigate(redirect);
      } else {
        setError('E-mail ou senha incorretos');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-responsive">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-responsive text-center p-responsive">
          <div className="flex justify-center mb-2">
            <AppLogo size={56} rounded="xl" />
          </div>
          <CardTitle className="text-responsive-xl font-bold">Fazer Login</CardTitle>
          <CardDescription className="text-responsive-sm">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-responsive">
          <form onSubmit={handleSubmit(onSubmit)} className="space-responsive">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-responsive-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-responsive-sm">
              <Label htmlFor="email" className="text-responsive-sm">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                disabled={isLoading}
                className="btn-touch text-responsive-sm"
              />
              {errors.email && (
                <p className="text-responsive-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-responsive-sm">
              <Label htmlFor="senha" className="text-responsive-sm">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  {...register('senha')}
                  disabled={isLoading}
                  className="btn-touch text-responsive-sm pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.senha && (
                <p className="text-responsive-xs text-destructive">{errors.senha.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(!!c)} />
                <Label htmlFor="remember" className="text-responsive-xs text-muted-foreground">
                  Lembrar-me neste dispositivo
                </Label>
              </div>
              <Link
                to="/esqueci-senha"
                className="text-responsive-xs text-muted-foreground hover:text-primary underline"
              >
                Esqueci minha senha
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full btn-touch text-responsive-sm bg-gradient-to-r from-primary to-lilac-primary hover:opacity-90" 
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="grid grid-cols-3 items-center gap-2 my-2">
              <div className="h-px bg-border" />
              <div className="text-center text-xs text-muted-foreground">ou</div>
              <div className="h-px bg-border" />
            </div>
            <Button 
              type="button"
              variant="outline"
              className="w-full btn-touch text-responsive-sm"
              onClick={signInGoogle}
              disabled={isLoading}
            >
              Entrar com Google
            </Button>

            <div className="text-center space-responsive-sm">
              <div className="text-responsive-xs text-muted-foreground">
                Não tem uma conta?{' '}
                <Link to="/cadastro" className="text-primary hover:underline font-medium">
                  Cadastre-se aqui
                </Link>
              </div>
            </div>
          </form>
          <AuthFooter />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
