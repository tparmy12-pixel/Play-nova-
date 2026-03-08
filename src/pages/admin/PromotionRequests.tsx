import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ExternalLink, Clock, IndianRupee } from "lucide-react";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PromotionRequests: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["promotion-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotion_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: price = "100" } = useQuery({
    queryKey: ["promotion-price"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "promotion_price")
        .single();
      return data?.value || "100";
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("promotion_requests")
        .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotion-requests"] });
      toast({ title: "Updated!" });
    },
  });

  const updatePrice = useMutation({
    mutationFn: async (newPrice: string) => {
      const { error } = await supabase
        .from("admin_settings")
        .update({ value: newPrice, updated_at: new Date().toISOString() })
        .eq("key", "promotion_price");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotion-price"] });
      toast({ title: "Price Updated!" });
    },
  });

  const [newPrice, setNewPrice] = React.useState(price);
  React.useEffect(() => { setNewPrice(price); }, [price]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-black gradient-neon-text mb-8">Promotion Requests</h1>

        {/* Price Setting */}
        <Card className="glass border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <IndianRupee className="h-5 w-5 text-neon-pink" /> Promotion Price
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => updatePrice.mutate(newPrice)}
              disabled={newPrice === price}
              className="gradient-neon text-primary-foreground"
            >
              Save
            </Button>
          </CardContent>
        </Card>

        {/* Requests List */}
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-muted-foreground">No promotion requests yet.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass border-border/50">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusColors[req.status] || ""}>
                            {req.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {req.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {req.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                            {req.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ₹{req.amount} · {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <a
                          href={req.app_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neon-blue hover:underline flex items-center gap-1 text-sm truncate"
                        >
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          {req.app_link}
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">
                          Button: "{req.button_text}" · Style: {req.button_style}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Transaction ID: <span className="font-mono font-bold">{req.transaction_id}</span>
                        </p>
                        {req.description && (
                          <p className="text-xs text-muted-foreground mt-1">{req.description}</p>
                        )}
                      </div>

                      {req.status === "pending" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => updateStatus.mutate({ id: req.id, status: "approved" })}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus.mutate({ id: req.id, status: "rejected" })}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PromotionRequests;
