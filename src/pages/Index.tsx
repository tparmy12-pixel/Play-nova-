import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import AppCard from "@/components/AppCard";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const Index: React.FC = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["apps-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apps")
        .select("*")
        .eq("status", "approved")
        .order("download_count", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = apps.filter((app) =>
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout showSearch onSearch={setSearch}>
      {/* Promote FAB */}
      <button
        onClick={() => navigate("/promote")}
        className="fixed bottom-20 right-4 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-full gradient-neon text-primary-foreground text-xs font-bold neon-glow shadow-2xl hover:scale-110 transition-transform"
      >
        <Sparkles className="h-4 w-4" />
        Promote
      </button>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-neon opacity-10" />
        <div className="relative container mx-auto px-4 py-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-black gradient-neon-text mb-2">bs Store</h1>
            <p className="text-muted-foreground text-sm">Discover amazing apps & games</p>
          </motion.div>
        </div>
      </section>

      {/* App Grid */}
      <section className="container mx-auto px-4 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/50 animate-pulse">
                <div className="aspect-square bg-muted/50" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No apps found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((app, i) => (
              <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <AppCard app={app} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Index;
