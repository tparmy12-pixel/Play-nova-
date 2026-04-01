import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
};

const MyApps: React.FC = () => {
  const { user } = useAuth();

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["my-apps", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apps")
        .select("*")
        .eq("uploaded_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-black gradient-neon-text">My Apps</h1>
          <Link to="/upload">
            <Button className="gradient-neon text-primary-foreground neon-glow">
              <Plus className="h-4 w-4 mr-2" /> Upload New
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Aapne abhi tak koi app upload nahi kiya.</p>
            <Link to="/upload">
              <Button className="mt-4 gradient-neon text-primary-foreground">Upload First App</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map((app: any) => (
              <Card key={app.id} className="glass border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt={app.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl gradient-neon flex items-center justify-center">
                      <span className="font-display text-sm font-bold text-primary-foreground">{app.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{app.name}</p>
                    <p className="text-sm text-muted-foreground">{app.category} · v{app.version} · {app.download_count} downloads</p>
                  </div>
                  <Badge className={statusColors[app.status] || ""}>{app.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyApps;
