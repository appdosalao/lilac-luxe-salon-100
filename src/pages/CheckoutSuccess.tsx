import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, subscription } = useSupabaseAuth();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const verifySubscription = async () => {
      console.log('[CHECKOUT-SUCCESS] Verificando assinatura... tentativa', retryCount + 1);
      
      try {
        await checkSubscription();
        
        // Aguardar um pouco para o estado atualizar
        setTimeout(() => {
          if (subscription?.subscribed) {
            console.log('[CHECKOUT-SUCCESS] ✅ Assinatura confirmada!');
            setStatus('success');
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else if (retryCount < maxRetries) {
            // Tentar novamente
            setRetryCount(prev => prev + 1);
          } else {
            console.log('[CHECKOUT-SUCCESS] ⚠️ Max retries atingido');
            setStatus('error');
          }
        }, 1000);
      } catch (error) {
        console.error('[CHECKOUT-SUCCESS] Erro ao verificar:', error);
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
        } else {
          setStatus('error');
        }
      }
    };

    // Verificar imediatamente e depois a cada 2 segundos
    verifySubscription();
    
    if (retryCount < maxRetries) {
      const interval = setInterval(verifySubscription, 2000);
      return () => clearInterval(interval);
    }
  }, [retryCount, searchParams, checkSubscription, subscription, navigate]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Processando pagamento...</CardTitle>
            <CardDescription>
              Aguarde enquanto confirmamos sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-muted-foreground">
              <p>Tentativa {retryCount + 1} de {maxRetries}</p>
              <p className="mt-2">Isso pode levar alguns segundos</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-green-100">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-900">Pagamento confirmado!</CardTitle>
            <CardDescription className="text-green-700">
              Sua assinatura foi ativada com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                {subscription?.status === 'trial' 
                  ? `🎉 Seu período de teste gratuito de 7 dias começou!`
                  : `✨ Sua assinatura premium está ativa!`
                }
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecionando para o dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-orange-100">
      <Card className="w-full max-w-md border-orange-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-orange-900">Verificação em andamento</CardTitle>
          <CardDescription className="text-orange-700">
            Não conseguimos confirmar sua assinatura ainda
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              Isso pode acontecer se o pagamento ainda está sendo processado pelo Stripe.
              Seu status será atualizado automaticamente quando o pagamento for confirmado.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Ir para o Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/configuracoes?tab=assinatura')} 
              variant="outline"
              className="w-full"
            >
              Ver Status da Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
