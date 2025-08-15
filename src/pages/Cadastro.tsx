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
import { UsuarioCadastro } from '@/types/usuario';

const cadastroSchema = z.object({
  nome_personalizado_app: z.string().min(1, 'Nome da profissional/salão é obrigatório'),
  nome_completo: z.string().min(1, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmar_senha: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.senha === data.confirmar_senha, {
  message: "Senhas não coincidem",
  path: ["confirmar_senha"],
});

const Cadastro = () => {
  const navigate = useNavigate();
  const { cadastrar } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<UsuarioCadastro>({
    resolver: zodResolver(cadastroSchema),
  });

  const onSubmit = async (data: UsuarioCadastro) => {
    setIsLoading(true);
    setError('');

    try {
      const success = await cadastrar(data);
      if (success) {
        navigate('/');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
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

            <div className="space-y-2">
              <Label htmlFor="senha">Senha *</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...register('senha')}
                disabled={isLoading}
              />
              {errors.senha && (
                <p className="text-sm text-destructive">{errors.senha.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar_senha">Confirmar Senha *</Label>
              <Input
                id="confirmar_senha"
                type="password"
                placeholder="Digite a senha novamente"
                {...register('confirmar_senha')}
                disabled={isLoading}
              />
              {errors.confirmar_senha && (
                <p className="text-sm text-destructive">{errors.confirmar_senha.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
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
      </Card>
    </div>
  );
};

export default Cadastro;