import { useMemo } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function IntegracaoCakto() {
  const { usuario, user } = useSupabaseAuth();

  const mensalUrlConfigured = Boolean(import.meta.env.VITE_CAKTO_CHECKOUT_MENSAL_URL);
  const vitalicioUrlConfigured = Boolean(import.meta.env.VITE_CAKTO_CHECKOUT_VITALICIO_URL);

  const statusLabel = useMemo(() => {
    const subscriptionStatus = usuario?.subscription_status ?? null;
    if (subscriptionStatus === 'active') return 'Ativo';
    if (subscriptionStatus === 'trial') return 'Trial';
    if (subscriptionStatus === 'expired') return 'Expirado';
    if (subscriptionStatus === 'inactive') return 'Inativo';
    return '—';
  }, [usuario?.subscription_status]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 max-w-4xl space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Integração Cakto</CardTitle>
                <CardDescription>
                  Checklist e parâmetros usados pelo app (checkout hospedado + webhook)
                </CardDescription>
              </div>
              <Badge variant="outline">{statusLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Checkout Mensal configurado</div>
                <Badge variant={mensalUrlConfigured ? 'default' : 'outline'}>
                  {mensalUrlConfigured ? 'OK' : 'Faltando'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Checkout Vitalício configurado</div>
                <Badge variant={vitalicioUrlConfigured ? 'default' : 'outline'}>
                  {vitalicioUrlConfigured ? 'OK' : 'Faltando'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Parâmetro de vínculo (sck)</div>
                <div className="text-sm font-medium truncate max-w-[60%]">{user?.id ?? '—'}</div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Último evento Cakto</div>
                <div className="text-sm font-medium truncate max-w-[60%]">{usuario?.cakto_last_event ?? '—'}</div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Último status do pedido</div>
                <div className="text-sm font-medium truncate max-w-[60%]">{usuario?.cakto_last_status ?? '—'}</div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Cakto order</div>
                <div className="text-sm font-medium truncate max-w-[60%]">{usuario?.cakto_order_id ?? '—'}</div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Cakto refId</div>
                <div className="text-sm font-medium truncate max-w-[60%]">{usuario?.cakto_order_ref_id ?? '—'}</div>
              </div>
            </div>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Configuração no Painel Cakto</CardTitle>
                <CardDescription>Itens mínimos para o fluxo funcionar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>1) Produtos/Ofertas: crie um produto mensal (assinatura) e um vitalício (único).</div>
                <div>2) Links de checkout: configure em `VITE_CAKTO_CHECKOUT_MENSAL_URL` e `VITE_CAKTO_CHECKOUT_VITALICIO_URL`.</div>
                <div>3) Webhook: cadastre o endpoint do backend em Apps → Webhooks e selecione pelo menos `purchase_approved`.</div>
                <div>4) Chave secreta: defina a mesma `CAKTO_WEBHOOK_SECRET` no backend para validar chamadas.</div>
                <div>5) Testes: use “Enviar evento de teste” no webhook para validar o recebimento.</div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Validação via API (opcional)</CardTitle>
                <CardDescription>
                  O backend pode validar o pedido consultando a API Cakto usando OAuth2
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>1) Crie uma chave de API no painel (client_id/client_secret) com escopo `orders`.</div>
                <div>2) Configure `CAKTO_CLIENT_ID`, `CAKTO_CLIENT_SECRET` no backend.</div>
                <div>3) Ative `CAKTO_VERIFY_BY_API=true` para buscar o pedido em `public_api/orders`.</div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

