import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
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
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: { persistSession: false },
      }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let customerId: string;

    const { data: profile } = await supabaseClient
      .from("usuarios")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const existingCustomerId = profile?.stripe_customer_id ?? null;

    if (existingCustomerId) {
      try {
        const retrieved = await stripe.customers.retrieve(existingCustomerId);
        if (!retrieved.deleted) {
          customerId = retrieved.id;
          logStep("Using Stripe customer from profile", { customerId });
        } else {
          customerId = "";
          logStep("Stripe customer in profile is deleted, will re-create", { existingCustomerId });
        }
      } catch (e) {
        customerId = "";
        logStep("Stripe customer in profile not found, will re-create", { existingCustomerId });
        void e;
      }
    } else {
      customerId = "";
    }

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length === 0) {
        logStep("No Stripe customer found, creating one", { email: user.email });
        const createdCustomer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = createdCustomer.id;
        logStep("Stripe customer created", { customerId });
      } else {
        customerId = customers.data[0].id;
        logStep("Found Stripe customer by email", { customerId });
      }
    }

    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted) {
        const current = (customer.metadata ?? {}) as Record<string, string>;
        if (current.supabase_user_id !== user.id) {
          await stripe.customers.update(customerId, {
            metadata: { ...current, supabase_user_id: user.id },
          });
        }
      }
    } catch (e) {
      void e;
    }

    if (existingCustomerId !== customerId) {
      await supabaseClient
        .from("usuarios")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/`,
    });
    logStep("Customer portal session created", { sessionId: portalSession.id, url: portalSession.url });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
