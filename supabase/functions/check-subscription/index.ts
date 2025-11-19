import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");

    // ✅ Criar client com ANON_KEY para validar o token JWT do usuário
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    logStep("Validating user token");
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    
    if (userError || !user) {
      logStep("ERROR: Authentication failed", {
        error: userError?.message,
        hasUser: !!user
      });
      throw new Error(`Authentication error: ${userError?.message || 'User not found'}`);
    }
    
    if (!user.email) {
      logStep("ERROR: User email missing");
      throw new Error("User email not available");
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Buscar todas as assinaturas do cliente (não filtrar por status ainda)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10, // Aumentar limite para ver todas as assinaturas
    });
    
    logStep("All subscriptions found", { 
      total: subscriptions.data.length,
      statuses: subscriptions.data.map(s => ({ id: s.id, status: s.status }))
    });
    
    // Filtrar apenas assinaturas "active" ou "trialing"
    const validSubscriptions = subscriptions.data.filter(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );
    
    const hasActiveSub = validSubscriptions.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let trialEnd = null;

    if (hasActiveSub) {
      const subscription = validSubscriptions[0]; // Pegar a primeira válida
      
      // Validar e criar data de fim da assinatura
      if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      }
      
      // Validar e criar data de fim do trial
      if (subscription.trial_end && typeof subscription.trial_end === 'number') {
        trialEnd = new Date(subscription.trial_end * 1000).toISOString();
      }
      
      logStep("Valid subscription found", { 
        subscriptionId: subscription.id,
        status: subscription.status,
        endDate: subscriptionEnd,
        trialEnd: trialEnd,
        rawTrialEnd: subscription.trial_end,
        rawPeriodEnd: subscription.current_period_end
      });
      
      productId = subscription.items.data[0].price.product;
      logStep("Determined subscription tier", { productId, status: subscription.status });
    } else {
      logStep("No valid subscription found (active or trialing)", {
        totalSubscriptions: subscriptions.data.length,
        statuses: subscriptions.data.map(s => s.status)
      });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      trial_end: trialEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
