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
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4 mr-2">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.9 0-12.5-5.6-12.5-12.5S17.1 11 24 11c3.1 0 6 1.1 8.2 3l5.7-5.7C34.6 5.6 29.6 4 24 4 12.3 4 2.9 13.4 2.9 25.1S12.3 46.2 24 46.2c11.7 0 21.1-9.4 21.1-21.1 0-1.1-.1-2.2-.5-3.3z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.3 18.9 14 24 14c3.1 0 6 1.1 8.2 3l5.7-5.7C34.6 5.6 29.6 4 24 4 15.5 4 8.4 8.8 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 46.2c5.4 0 10.4-1.8 14.3-4.9l-6.6-5.4c-2.1 1.4-4.9 2.2-7.7 2.2-5.3 0-9.8-3.4-11.4-8.1l-6.6 5.1c2.4 6 8.3 10.1 15.6 10.1z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6.1 6.9l6.6 5.4c3.8-3.5 6-8.5 6-14.3 0-1.1-.1-2.2-.2-3.3z"/>
  </svg>
);
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-4 w-4 mr-2">
    <path fill="#1877F2" d="M32 16C32 7.163 24.837 0 16 0S0 7.163 0 16c0 7.987 5.851 14.627 13.5 15.813V20.625H9.438V16H13.5v-3.5c0-4.012 2.39-6.225 6.053-6.225 1.754 0 3.586.313 3.586.313v3.945h-2.02c-1.99 0-2.606 1.235-2.606 2.5V16h4.437l-.71 4.625H18.513v11.188C26.149 30.627 32 23.987 32 16z"/>
    <path fill="#fff" d="M18.513 31.813V20.625h4.437L23.66 16h-4.437v-2.967c0-1.265.616-2.5 2.606-2.5h2.02V6.588s-1.832-.313-3.586-.313c-3.663 0-6.053 2.213-6.053 6.225V16h-4.062v4.625H14.5v11.188a16.058 16.058 0 0 0 4.013 0z"/>
  </svg>
);
const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-2">
    <path fill="currentColor" d="M16.365 1.43c.115 1.12-.33 2.25-.98 3.08-.708.9-1.873 1.6-3.057 1.56-.14-1.05.35-2.18.95-2.97.74-.99 2.02-1.67 3.087-1.67zM20.83 16.59c-.6 1.29-1.31 2.56-2.37 3.57-.72.68-1.55 1.38-2.56 1.41-1.01.03-1.3-.45-2.42-.45-1.12 0-1.43.44-2.44.48-1.01.04-1.79-.73-2.51-1.41-1.72-1.62-3.04-4.56-2.63-7.26.29-1.93 1.53-3.56 3.19-3.6 1.05-.02 2.04.72 2.59.72.55 0 1.59-.89 2.68-.76.46.02 1.77.19 2.6 1.54-.07.04-1.55.91-1.53 2.73.02 2.18 1.99 2.89 2.02 2.9-.02.04-.31 1.09.28 2.29z"/>
  </svg>
);

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
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/'
        }
      });
      if (error) {
        console.error('Erro Google OAuth:', error.message);
        setError('Erro ao logar com Google: ' + error.message);
      }
    } catch (err: any) {
      console.error('Exceção Google OAuth:', err);
      setError('Falha inesperada ao logar com Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInFacebook = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin + '/'
        }
      });
      if (error) {
        console.error('Erro Facebook OAuth:', error.message);
        setError('Erro ao logar com Facebook: ' + error.message);
      }
    } catch (err: any) {
      console.error('Exceção Facebook OAuth:', err);
      setError('Falha inesperada ao logar com Facebook.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInApple = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin + '/'
        }
      });
      if (error) {
        console.error('Erro Apple OAuth:', error.message);
        setError('Erro ao logar com Apple: ' + error.message);
      }
    } catch (err: any) {
      console.error('Exceção Apple OAuth:', err);
      setError('Falha inesperada ao logar com Apple.');
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
              <GoogleIcon />
              Entrar com Google
            </Button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button 
                type="button"
                variant="outline"
                className="w-full btn-touch text-responsive-sm"
                onClick={signInFacebook}
                disabled={isLoading}
              >
                <FacebookIcon />
                Entrar com Facebook
              </Button>
              <Button 
                type="button"
                variant="outline"
                className="w-full btn-touch text-responsive-sm"
                onClick={signInApple}
                disabled={isLoading}
              >
                <AppleIcon />
                Entrar com Apple
              </Button>
            </div>

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
