import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet, Check, X, IndianRupee } from "lucide-react";

const AdminWithdrawals: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*, profiles:user_id(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleAction = async (id: string, status: "approved" | "rejected", userId?: string, amount?: number) => {
    try {
      const { error } = await supabase.from("withdrawal_requests").update({
        status,
        reviewed_at: new Date().toISOString(),
      } as any).eq("id", id);
      if (error) throw error;

      // If approved, deduct from wallet balance
      if (status === "approved" && userId && amount) {
        await supabase.from("developer_wallets").update({
          balance: supabase.rpc as any, // We'll use raw update
        } as any).eq("user_id", userId);
        
        // Use direct SQL-style update via RPC would be better, but for now:
        const { data: wallet } = await supabase.from("developer_wallets").select("balance, total_withdrawn").eq("user_id", userId).single();
        if (wallet) {
          await supabase.from("developer_wallets").update({
            balance: Number(wallet.balance) - amount,
            total_withdrawn: Number(wallet.total_withdrawn) + amount,
          } as any).eq("user_id", userId);
        }
      }

      toast.success(`Withdrawal ${status}!`);
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display gradient-neon-text flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Withdrawal Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No withdrawal requests</p>
            ) : (
              requests.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div>
                    <p className="font-medium text-sm">{(r as any).profiles?.display_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">
                      ₹{Number(r.amount).toFixed(2)} • UPI: {r.upi_id || "N/A"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${
                      r.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      r.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{r.status}</Badge>
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-green-400 border-green-500/30" onClick={() => handleAction(r.id, "approved", r.user_id, Number(r.amount))}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-red-400 border-red-500/30" onClick={() => handleAction(r.id, "rejected")}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminWithdrawals;
