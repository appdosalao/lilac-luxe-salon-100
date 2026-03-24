import React, { useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, Sparkles, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const PaywallScreen: React.FC = () => {
  const { session, signOut } = useSupabaseAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleBuyAccess = async () => {
    if (!session?.access_token) {
      toast.error('Você precisa estar logado para comprar o acesso.');
      return;
    }

    setIsRedirecting(true);
    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.alreadyPaid) {
        toast.success('Seu acesso já está liberado!');
        window.location.reload();
      } else {
        toast.error('Erro ao gerar checkout. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      toast.error('Erro na conexão com o servidor.');
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-md w-full shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Acesso Vitalício ao Salão de Bolso
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Sua ferramenta completa de gestão, agora para sempre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {[
              "Agendamentos ilimitados",
              "Gestão completa de clientes",
              "Controle financeiro avançado",
              "Auditoria e marketing integrados",
              "Suporte prioritário",
              "Sem mensalidades futuras"
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-foreground/80">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="bg-primary/5 rounded-xl p-6 text-center border border-primary/10">
            <div className="text-sm text-muted-foreground line-through mb-1">De R$ 497,00</div>
            <div className="text-4xl font-extrabold text-primary mb-1">R$ [PRECO]</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Pagamento Único</div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" 
            size="lg"
            onClick={handleBuyAccess}
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redirecionando...
              </>
            ) : (
              'Comprar Acesso Vitalício'
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
