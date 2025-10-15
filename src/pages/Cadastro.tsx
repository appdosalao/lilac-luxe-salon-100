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
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { UsuarioCadastro } from '@/types/usuario';

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

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<UsuarioCadastro>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      tema_preferencia: 'feminino',
    },
  });

  const temaEscolhido = watch('tema_preferencia');

  const onSubmit = async (data: UsuarioCadastro) => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signUp(data.email, data.senha, {
        nome_completo: data.nome_completo,
        nome_personalizado_app: data.nome_personalizado_app,
        telefone: data.telefone,
        tema_preferencia: data.tema_preferencia
      });
      
      if (!error) {
        navigate('/login');
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