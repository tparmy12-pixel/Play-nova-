import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: authError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing payment details" }), { status: 400, headers: corsHeaders });
    }

    // Get Razorpay secret
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: settings } = await adminClient.from("admin_settings").select("key, value").eq("key", "razorpay_key_secret");
    const keySecret = settings?.[0]?.value;
    if (!keySecret) {
      return new Response(JSON.stringify({ error: "Payment not configured" }), { status: 500, headers: corsHeaders });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = hmac("sha256", keySecret, body, "utf8", "hex");

    if (expectedSig !== razorpay_signature) {
      return new Response(JSON.stringify({ error: "Invalid signature", verified: false }), { status: 400, headers: corsHeaders });
    }

    // Update transaction
    await adminClient.from("payment_transactions").update({
      razorpay_payment_id,
      status: "completed",
    }).eq("razorpay_order_id", razorpay_order_id);

    // Get transaction to credit wallet
    const { data: txn } = await adminClient.from("payment_transactions")
      .select("id").eq("razorpay_order_id", razorpay_order_id).single();

    if (txn) {
      await adminClient.rpc("credit_developer_wallet", { _transaction_id: txn.id });
    }

    return new Response(JSON.stringify({ verified: true, status: "completed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
