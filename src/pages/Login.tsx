import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { UsuarioLogin } from '@/types/usuario';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<UsuarioLogin>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: UsuarioLogin) => {
    setIsLoading(true);
    setError('');

    try {
      const success = await login(data.email, data.senha);
      if (success) {
        navigate('/');
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
              <Input
                id="senha"
                type="password"
                placeholder="Sua senha"
                {...register('senha')}
                disabled={isLoading}
                className="btn-touch text-responsive-sm"
              />
              {errors.senha && (
                <p className="text-responsive-xs text-destructive">{errors.senha.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full btn-touch text-responsive-sm" 
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center space-responsive-sm">
              <Link
                to="/esqueci-senha"
                className="text-responsive-xs text-muted-foreground hover:text-primary underline"
              >
                Esqueci minha senha
              </Link>
              <div className="text-responsive-xs text-muted-foreground">
                Não tem uma conta?{' '}
                <Link to="/cadastro" className="text-primary hover:underline font-medium">
                  Cadastre-se aqui
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;