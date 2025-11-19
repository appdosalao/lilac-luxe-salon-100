import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep("🔔 Webhook called", { 
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("📨 Processing webhook event");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    
    logStep("Keys verified");

    // Obter a assinatura do Stripe
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR: No stripe-signature header");
      return new Response(JSON.stringify({ error: "No signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Ler o body como texto
    const body = await req.text();
    logStep("Body received", { bodyLength: body.length });

    // Verificar assinatura do webhook
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("ERROR: Webhook signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Criar cliente Supabase com service role key para poder atualizar usuários
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Processar eventos relevantes
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription event", { 
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
          trial_end: subscription.trial_end,
          current_period_end: subscription.current_period_end
        });

        // Buscar email do cliente
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) {
          logStep("Customer deleted, skipping");
          break;
        }

        const customerEmail = (customer as Stripe.Customer).email;
        if (!customerEmail) {
          logStep("No email for customer, skipping");
          break;
        }

        logStep("Customer email found", { email: customerEmail });

        // ✅ MAPEAMENTO CORRETO: Incluir "trialing" como status válido
        let newStatus: string;
        if (subscription.status === 'active') {
          newStatus = 'active';
        } else if (subscription.status === 'trialing') {
          newStatus = 'trial'; // Mapear "trialing" do Stripe para "trial" no banco
        } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          newStatus = 'inactive';
        } else {
          newStatus = subscription.status; // Manter outros status como estão
        }

        logStep("Status mapping", { 
          stripeStatus: subscription.status, 
          dbStatus: newStatus 
        });

        const { error: updateError } = await supabaseClient
          .from('usuarios')
          .update({ 
            subscription_status: newStatus,
            trial_used: true // Marca trial como usado quando tem assinatura
          })
          .eq('email', customerEmail);

        if (updateError) {
          logStep("ERROR updating user", { error: updateError });
        } else {
          logStep("User subscription status updated", { 
            email: customerEmail, 
            status: newStatus 
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription deletion", { 
          subscriptionId: subscription.id,
          customerId: subscription.customer
        });

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) {
          logStep("Customer deleted, skipping");
          break;
        }

        const customerEmail = (customer as Stripe.Customer).email;
        if (!customerEmail) {
          logStep("No email for customer, skipping");
          break;
        }

        const { error: updateError } = await supabaseClient
          .from('usuarios')
          .update({ subscription_status: 'inactive' })
          .eq('email', customerEmail);

        if (updateError) {
          logStep("ERROR updating user on deletion", { error: updateError });
        } else {
          logStep("User subscription marked as inactive", { email: customerEmail });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing payment success", { 
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: invoice.subscription
        });

        if (!invoice.subscription) {
          logStep("No subscription associated with invoice, skipping");
          break;
        }

        const customer = await stripe.customers.retrieve(invoice.customer as string);
        if (customer.deleted) {
          logStep("Customer deleted, skipping");
          break;
        }

        const customerEmail = (customer as Stripe.Customer).email;
        if (!customerEmail) {
          logStep("No email for customer, skipping");
          break;
        }

        // Buscar a assinatura para verificar se é trial ou active
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        
        let newStatus: string;
        if (subscription.status === 'trialing') {
          newStatus = 'trial';
        } else if (subscription.status === 'active') {
          newStatus = 'active';
        } else {
          newStatus = subscription.status;
        }

        logStep("Payment success status mapping", { 
          subscriptionStatus: subscription.status, 
          dbStatus: newStatus 
        });

        const { error: updateError } = await supabaseClient
          .from('usuarios')
          .update({ 
            subscription_status: newStatus,
            trial_used: true
          })
          .eq('email', customerEmail);

        if (updateError) {
          logStep("ERROR updating user on payment success", { error: updateError });
        } else {
          logStep("User subscription confirmed active", { 
            email: customerEmail,
            status: newStatus
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing payment failure", { 
          invoiceId: invoice.id,
          customerId: invoice.customer
        });

        // NÃO mudar status automaticamente no primeiro falha
        // Stripe vai tentar novamente
        logStep("Payment failed - Stripe will retry automatically");
        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
