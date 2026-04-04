import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet, ArrowDownToLine, IndianRupee, History, Send } from "lucide-react";

const DeveloperWallet: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["developer-wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_wallets")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["developer-transactions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("developer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["developer-withdrawals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) { toast.error("Valid amount dalein"); return; }
    if (!upiId.trim()) { toast.error("UPI ID dalein"); return; }
    if (!wallet || amt > Number(wallet.balance)) { toast.error("Insufficient balance"); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("withdrawal_requests").insert({
        user_id: user!.id,
        amount: amt,
        upi_id: upiId.trim(),
      } as any);
      if (error) throw error;
      toast.success("Withdrawal request submitted!");
      setWithdrawAmount("");
      setUpiId("");
      queryClient.invalidateQueries({ queryKey: ["developer-withdrawals"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!wallet) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center pb-20">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Wallet abhi active nahi hai. Developer account approve hone ke baad wallet automatically ban jayega.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-20 max-w-lg">
        {/* Balance Card */}
        <Card className="glass border-border/50 mb-4">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl gradient-neon flex items-center justify-center neon-glow">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-foreground">₹{Number(wallet.balance).toFixed(2)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground">Total Earned</p>
                <p className="text-sm font-semibold text-green-400">₹{Number(wallet.total_earned).toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground">Total Withdrawn</p>
                <p className="text-sm font-semibold text-orange-400">₹{Number(wallet.total_withdrawn).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdraw Section */}
        <Card className="glass border-border/50 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-primary" /> Withdrawal Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Amount (₹)</Label>
              <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">UPI ID</Label>
              <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" />
            </div>
            <Button onClick={handleWithdraw} disabled={submitting} className="w-full gradient-neon text-primary-foreground">
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Submitting..." : "Request Withdrawal"}
            </Button>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <Card className="glass border-border/50 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {withdrawals.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">₹{Number(w.amount).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className={`text-[10px] ${
                    w.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    w.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>{w.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Transaction History
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">30% platform commission, 70% aapka</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Abhi koi transaction nahi hai</p>
            ) : (
              transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">{t.product_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Total: ₹{Number(t.amount).toFixed(2)} | Your share: ₹{Number(t.developer_share).toFixed(2)}
                    </p>
                  </div>
                  <Badge className={`text-[10px] ${t.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {t.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DeveloperWallet;
