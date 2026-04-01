import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const AppReviews: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: pendingApps = [], isLoading } = useQuery({
    queryKey: ["pending-apps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apps")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["app-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_reviews").select("*");
      if (error) throw error;
      return data;
    },
  });

  const handleAction = async (appId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("apps").update({ status } as any).eq("id", appId);
    if (error) { toast.error(error.message); return; }
    
    await supabase.from("app_reviews").update({ scan_result: status } as any).eq("app_id", appId);
    
    toast.success(`App ${status}!`);
    queryClient.invalidateQueries({ queryKey: ["pending-apps"] });
    queryClient.invalidateQueries({ queryKey: ["apps"] });
  };

  const getReview = (appId: string) => reviews.find((r: any) => r.app_id === appId);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-black gradient-neon-text mb-6">App Review Queue</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : pendingApps.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">Koi pending app nahi hai.</p>
        ) : (
          <div className="space-y-4">
            {pendingApps.map((app: any) => {
              const review = getReview(app.id);
              const hasSuspicious = review?.suspicious_keywords?.length > 0;

              return (
                <Card key={app.id} className="glass border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {app.icon_url ? (
                        <img src={app.icon_url} alt={app.name} className="w-16 h-16 rounded-xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl gradient-neon flex items-center justify-center">
                          <span className="font-display text-xl font-bold text-primary-foreground">{app.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{app.name}</h3>
                        <p className="text-sm text-muted-foreground">{app.category} · v{app.version}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{app.description}</p>
                        
                        {hasSuspicious && (
                          <div className="mt-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-yellow-400">
                              Suspicious keywords: {review.suspicious_keywords.join(", ")}
                            </span>
                          </div>
                        )}

                        {review && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              Trust Score: {review.trust_score}/100
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={() => handleAction(app.id, "approved")} className="bg-green-600 hover:bg-green-700">
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(app.id, "rejected")}>
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AppReviews;
