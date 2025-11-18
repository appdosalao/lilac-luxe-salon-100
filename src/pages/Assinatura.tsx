import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Assinatura() {
  const { user, subscription, checkSubscription } = useSupabaseAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    checkSubscription();
  }, [user, navigate, checkSubscription]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Erro ao criar sessão de pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      await checkSubscription();
      toast.success("Status atualizado!");
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast.error("Erro ao verificar status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura do Salão de Bolso
        </p>
      </div>

      {subscription?.subscribed ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Assinatura Ativa
            </CardTitle>
            <CardDescription>
              {subscription.trial 
                ? "Você está no período de teste gratuito de 7 dias"
                : "Sua assinatura está ativa e em dia"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">
                {subscription.trial ? "Período de Teste" : "Ativa"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Plano:</span>
              <span className="font-medium">Premium</span>
            </div>
            {subscription.subscription_end && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">
                  {subscription.trial ? "Trial termina em:" : "Renovação em:"}
                </span>
                <span className="font-medium">
                  {new Date(subscription.subscription_end).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              onClick={handleManageSubscription} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gerenciar Assinatura
            </Button>
            <Button 
              variant="outline"
              onClick={handleCheckStatus} 
              disabled={isCheckingStatus}
            >
              {isCheckingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar Status
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Plano Premium</CardTitle>
            <CardDescription>
              Acesso completo ao sistema de gerenciamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">R$ 20</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  ✨ 7 dias de teste gratuito
                </p>
                <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                  Experimente todos os recursos sem compromisso
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <h4 className="font-medium">Recursos inclusos:</h4>
                <ul className="space-y-2">
                  {[
                    "Agendamentos ilimitados",
                    "Gestão de clientes",
                    "Controle financeiro completo",
                    "Programa de fidelidade",
                    "Relatórios e gráficos",
                    "Agendamento online",
                    "Notificações por WhatsApp",
                    "Suporte prioritário",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button 
              onClick={handleSubscribe} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Teste Gratuito
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Cancele a qualquer momento durante o período de teste
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
