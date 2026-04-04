import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, User, Upload, Sparkles, Shield, AppWindow, Gamepad2, Wallet, Code } from "lucide-react";

const Profile: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: downloads = [] } = useQuery({
    queryKey: ["my-downloads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("downloads")
        .select("*, apps(name, icon_url)")
        .eq("user_id", user!.id)
        .order("downloaded_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: devAccount } = useQuery({
    queryKey: ["developer-account", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_accounts")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const menuItems = [
    { label: "Upload App", icon: Upload, path: "/upload", description: "Apna app ya game upload karein" },
    { label: "My Apps", icon: AppWindow, path: "/my-apps", description: "Aapke uploaded apps manage karein" },
    { label: "Promote App", icon: Sparkles, path: "/promote", description: "Apne app ki ad lagayein" },
    { label: "Developer Account", icon: Gamepad2, path: "/developer", description: "Game upload ke liye developer verification" },
  ];

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Profile dekhne ke liye login karein</p>
          <Button onClick={() => navigate("/login")} className="gradient-neon text-primary-foreground">Login</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-20 max-w-lg">
        {/* User Info */}
        <Card className="glass border-border/50 mb-4">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gradient-neon flex items-center justify-center neon-glow">
              <User className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-foreground">{profile?.display_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {devAccount && (
                <Badge className={`mt-1 text-[10px] ${
                  (devAccount as any).status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  (devAccount as any).status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  Developer: {(devAccount as any).status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="glass border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {isAdmin && (
            <Card
              className="glass border-border/50 cursor-pointer hover:border-neon-pink/50 transition-colors"
              onClick={() => navigate("/admin")}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-pink/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-neon-pink" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Admin Dashboard</p>
                  <p className="text-xs text-muted-foreground">Apps manage, reviews, settings</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Download History */}
        <h2 className="font-display text-lg font-bold text-foreground mb-3">Download History</h2>
        {downloads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No downloads yet.</p>
        ) : (
          <div className="space-y-2">
            {downloads.map((d: any) => (
              <Card key={d.id} className="glass border-border/50">
                <CardContent className="flex items-center gap-3 p-3">
                  <Download className="h-4 w-4 text-neon-pink shrink-0" />
                  <span className="flex-1 text-sm truncate">{d.apps?.name || "Unknown"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(d.downloaded_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <Link to="/contact" className="hover:text-primary">Contact</Link>
          <Link to="/privacy-policy" className="hover:text-primary">Privacy</Link>
          <Link to="/terms" className="hover:text-primary">Terms</Link>
          <Link to="/feedback" className="hover:text-primary">Feedback</Link>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
