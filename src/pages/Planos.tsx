import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Scissors } from 'lucide-react';

export default function Planos() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Scissors className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Escolha seu Plano</h1>
          <p className="text-muted-foreground text-lg">
            7 dias grátis para testar • Sem compromisso • Acesso completo
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">Mensal</CardTitle>
                  <CardDescription>Acesso completo com cobrança recorrente</CardDescription>
                </div>
                <Badge variant="outline" className="border-border text-muted-foreground">Mais Flexível</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold leading-none">
                  R$ 20
                  <span className="text-xl font-normal text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">7 dias grátis antes da primeira cobrança</p>
              </div>

              <div className="space-y-2">
                {[
                  'Acesso completo ao app',
                  'Agendamentos ilimitados',
                  'Controle de clientes',
                  'Relatórios e financeiro',
                  'Cancele quando quiser',
                  '7 dias grátis para testar',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">{text}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate('/checkout', { state: { plano: 'mensal' } })}
                variant="outline"
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                Começar grátis por 7 dias
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2 border-primary/40 bg-gradient-to-b from-primary/5 to-background">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">Vitalício</CardTitle>
                  <CardDescription>Licença permanente (pagamento único)</CardDescription>
                </div>
                <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30">
                  Melhor Custo-Benefício
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold leading-none">R$ 350</div>
                <p className="text-sm text-muted-foreground mt-2">pagamento único</p>
                <p className="text-sm font-medium mt-2 text-yellow-700 dark:text-yellow-300">
                  Economize mais de R$ 220 comparado ao anual
                </p>
              </div>

              <div className="space-y-2">
                {[
                  'Acesso completo ao app',
                  'Agendamentos ilimitados',
                  'Controle de clientes',
                  'Relatórios e financeiro',
                  'Todas as atualizações futuras',
                  'Novas versões sem custo extra',
                  'Licença permanente',
                  '7 dias grátis para testar',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">{text}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate('/checkout', { state: { plano: 'vitalicio' } })}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                Garantir minha licença
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 max-w-4xl mx-auto">
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
            <div className="font-semibold mb-1">⚠️ Aviso sobre o plano vitalício</div>
            <div className="text-muted-foreground">
              O plano vitalício não permite cancelamento pelo aplicativo. Para solicitar reembolso entre em contato
              com nosso suporte em até 7 dias após a compra: <span className="font-medium">resellr7@gmail.com</span> |{' '}
              <span className="font-medium">(33) 99854-2100</span>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground mt-4">
            🔒 Pagamento 100% seguro • Os 7 dias grátis começam após o cadastro
          </div>
        </div>
      </div>
    </div>
  );
}

