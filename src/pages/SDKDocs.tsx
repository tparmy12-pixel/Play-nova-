import React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Shield, AlertTriangle, IndianRupee, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const sdkCode = `// bs Store Payment SDK - Integration Guide

// Step 1: Include this in your app
const BS_STORE_API = "https://dpgrsjzuhukvuhkjfsjk.supabase.co/functions/v1";

// Step 2: Create Order (call from your app when user wants to buy)
async function createOrder(appId, productName, amount, userToken) {
  const res = await fetch(BS_STORE_API + "/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + userToken,
    },
    body: JSON.stringify({
      app_id: appId,
      product_name: productName,
      amount: amount, // in INR
    }),
  });
  return await res.json();
  // Returns: { order_id, key_id, amount, currency }
}

// Step 3: Open Razorpay Checkout (use order_id from Step 2)
function openPayment(orderData, onSuccess) {
  const options = {
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency,
    order_id: orderData.order_id,
    handler: function (response) {
      // Step 4: Verify payment
      verifyPayment(response, onSuccess);
    },
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

// Step 4: Verify Payment
async function verifyPayment(paymentResponse, userToken) {
  const res = await fetch(BS_STORE_API + "/verify-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + userToken,
    },
    body: JSON.stringify({
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
    }),
  });
  return await res.json();
  // Returns: { verified: true, status: "completed" }
}`;

const SDKDocs: React.FC = () => {
  const copyCode = () => {
    navigator.clipboard.writeText(sdkCode);
    toast.success("SDK code copied!");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-20 max-w-2xl">
        <h1 className="font-display text-2xl font-bold gradient-neon-text mb-4">bs Store Payment SDK</h1>

        {/* Warning */}
        <Card className="glass border-red-500/30 mb-4">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">⚠️ Important Rules</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Sirf bs Store SDK se payment karein — koi external gateway allowed nahi hai</li>
                <li>• Razorpay, Stripe, UPI ya koi bhi third-party payment detect hone par app reject ho jayega</li>
                <li>• Har payment par 30% platform commission aur 70% developer ko milega</li>
                <li>• SDK ke bina app publish nahi hoga agar paid features hain</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Commission Info */}
        <Card className="glass border-border/50 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <IndianRupee className="h-5 w-5 text-primary" />
              <p className="font-semibold text-sm">Commission Structure</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold text-orange-400">30%</p>
                <p className="text-[10px] text-muted-foreground">Platform Commission</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold text-green-400">70%</p>
                <p className="text-[10px] text-muted-foreground">Developer Share</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SDK Code */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" /> Integration Code
            </CardTitle>
            <Button size="sm" variant="outline" onClick={copyCode}>
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="text-[11px] text-muted-foreground bg-muted/30 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {sdkCode}
            </pre>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold text-sm">Integration Steps:</h3>
          {[
            "Apne app mein bs Store SDK code include karein",
            "createOrder() call karein jab user purchase kare",
            "Razorpay checkout open karein returned order_id se",
            "Payment hone par verifyPayment() call karein",
            "Backend automatically 30% commission katke 70% aapke wallet mein daalega",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/20">
              <Badge className="bg-primary/20 text-primary text-[10px] shrink-0">{i + 1}</Badge>
              <p className="text-xs text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SDKDocs;
