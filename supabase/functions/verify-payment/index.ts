import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[verify-payment] No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[verify-payment] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("[verify-payment] Missing payment details");
      return new Response(JSON.stringify({ error: "Missing payment details" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Duplicate check - if already completed, return success
    const { data: existingTxn } = await adminClient.from("payment_transactions")
      .select("id, status")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (existingTxn?.status === "completed") {
      console.log("[verify-payment] Already completed:", razorpay_order_id);
      return new Response(JSON.stringify({ verified: true, status: "already_completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!existingTxn) {
      console.error("[verify-payment] No transaction found for order:", razorpay_order_id);
      return new Response(JSON.stringify({ error: "Transaction not found" }), { status: 404, headers: corsHeaders });
    }

    // Get Razorpay secret
    const { data: settings } = await adminClient.from("admin_settings").select("key, value").eq("key", "razorpay_key_secret");
    const keySecret = settings?.[0]?.value;
    if (!keySecret) {
      console.error("[verify-payment] Razorpay secret not configured");
      return new Response(JSON.stringify({ error: "Payment not configured" }), { status: 500, headers: corsHeaders });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = await hmacSha256Hex(keySecret, body);

    if (expectedSig !== razorpay_signature) {
      console.error("[verify-payment] Signature mismatch for order:", razorpay_order_id);
      await adminClient.from("payment_transactions").update({
        status: "failed",
        razorpay_payment_id,
      }).eq("id", existingTxn.id);
      return new Response(JSON.stringify({ error: "Invalid signature", verified: false }), { status: 400, headers: corsHeaders });
    }

    // Update transaction to completed
    const { error: updateErr } = await adminClient.from("payment_transactions").update({
      razorpay_payment_id,
      status: "completed",
    }).eq("id", existingTxn.id);

    if (updateErr) {
      console.error("[verify-payment] Failed to update transaction:", updateErr.message);
      return new Response(JSON.stringify({ error: "Failed to update transaction" }), { status: 500, headers: corsHeaders });
    }

    console.log("[verify-payment] Payment verified, crediting wallet for txn:", existingTxn.id);

    // Credit developer wallet (70% share)
    const { error: creditErr } = await adminClient.rpc("credit_developer_wallet", { _transaction_id: existingTxn.id });
    if (creditErr) {
      console.error("[verify-payment] Wallet credit failed:", creditErr.message);
    } else {
      console.log("[verify-payment] Wallet credited successfully for txn:", existingTxn.id);
    }

    return new Response(JSON.stringify({ verified: true, status: "completed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[verify-payment] Unexpected error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
